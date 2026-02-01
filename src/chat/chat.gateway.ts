import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';
import { MessageService } from '@message/message.service';
import { MessageType } from '@prisma/client';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: EnhancedPrismaService,
    private readonly messageService: MessageService


  ) { }

  // ---------------------------
  // User connects
  // ---------------------------
  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    this.logger.log(`User connected: ${userId}`);
   
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });
   
    this.server.emit('user:online', { userId });
    // 🔐 Bind user explicitly for WS
    const prisma = this.prisma.enhanceForUser({ id: userId });

    const participantConvos = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    participantConvos.forEach(({ conversationId }) => {
      client.join(conversationId);
    });

    this.logger.log(
      `User ${userId} joined rooms: ${participantConvos
        .map(p => p.conversationId)
        .join(', ')}`
    );
  }


  // ---------------------------
  // User disconnects
  // ---------------------------
  // handleDisconnect(client: Socket) {
  //   this.logger.log(`User disconnected: ${client.data.userId}`);
  // }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.logger.log(`User disconnected: ${userId}`);

    // ✅ MARK USER OFFLINE + LAST SEEN
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
      },
    });

    // notify contacts
    this.server.emit('user:offline', {
      userId,
      lastSeenAt: new Date(),
    });
  }


  // ---------------------------
  // Listen to send-message event
  // ---------------------------

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    const senderId = client.data.userId;

    try {
      const message = await this.messageService.sendMessage(senderId, data);

      // Emit to all participants
      this.server.to(data.conversationId).emit('new-message', message);
    } catch (err) {
      client.emit('error', err.message);
    }

  }


  // Inside ChatGateway class
  @SubscribeMessage('mark-read')
  async handleMarkRead(client, payload) {
    const { conversationId } = payload;
    const userId = client.data.userId;

    const result = await this.messageService.markAsRead(userId, conversationId);

    this.server.to(conversationId).emit('messages-read', {
      conversationId,
      userId,
      count: result.count,
    });
  }


  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.userId;
    const { conversationId } = data;

    if (!userId || !conversationId) return;

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    this.typingUsers.get(conversationId)!.add(userId);

    // 🔥 Notify others (exclude sender)
    client.to(conversationId).emit('typing', {
      conversationId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.userId;
    const { conversationId } = data;

    const users = this.typingUsers.get(conversationId);
    if (!users) return;

    users.delete(userId);

    if (users.size === 0) {
      this.typingUsers.delete(conversationId);
    }

    client.to(conversationId).emit('typing', {
      conversationId,
      userId,
      isTyping: false,
    });
  }



  @SubscribeMessage('delete-message-for-all')
  async handleDeleteForAll(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    try {
      const result = await this.messageService.deleteMessageForEveryone(
        userId,
        data.messageId,
        this.server,
      );

      return result;
    } catch (err) {
      client.emit('error', err.message);
    }
  }

  // ---------------------------
  // Call api
  // ---------------------------


  @SubscribeMessage('call:start')
  async handleCallStart(
    @MessageBody() data: { conversationId: string; callType: 'AUDIO' | 'VIDEO' },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const prisma = this.prisma.enhanceForUser({ id: userId });

    // 1️⃣ Create call
    const call = await prisma.call.create({
      data: {
        conversationId: data.conversationId,
        callerId: userId,
        type: data.callType,
        status: 'RINGING',
      },
    });

    // 2️⃣ Create ONE system message
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        type: MessageType.SYSTEM,
        content: `${data.callType === 'AUDIO' ? '📞' : '🎥'} Call started`,
        meta: {
          callId: call.id,
          status: 'RINGING',
          callType: data.callType,
        },
      },
    });

    this.server.to(data.conversationId).emit('new-message', message);
    this.server.to(data.conversationId).emit('call:ring', {
      callId: call.id,
      messageId: message.id,
      from: userId,
    });
  }


  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const call = await this.prisma.call.findUnique({
      where: { id: data.callId },

    });

    // 1️⃣ Add participant
    await this.prisma.callParticipant.create({
      data: {
        callId: data.callId,
        userId,
        joinedAt: new Date(),
      },
    });

    // 2️⃣ Update call status
    await this.prisma.call.update({
      where: { id: data.callId },
      data: {
        status: 'ONGOING',
        startedAt: new Date(),
      },
    });

    // 3️⃣ UPDATE the SAME system message
    const updatedMessage =
      await this.messageService.updateCallMessage(`${call?.type === 'AUDIO' ? '📞' : '🎥'} Call in progress`, data.callId, {
        status: 'ONGOING',
        acceptedBy: userId,
        acceptedAt: new Date(),
      });

    // 4️⃣ Real-time chat update
    if (updatedMessage) {
      this.server
        .to(updatedMessage.conversationId)
        .emit('message:updated', updatedMessage);
    }

    // 5️⃣ Call signaling
    this.server.to(data.callId).emit('call:accepted', { userId });
  }



  @SubscribeMessage('call:reject')
  async handleCallReject(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const call = await this.prisma.call.findUnique({
      where: { id: data.callId },

    });
    // 1️⃣ Update call status
    await this.prisma.call.update({
      where: { id: data.callId },
      data: {
        status: 'REJECTED',
        endedAt: new Date(),
      },
    });

    // 2️⃣ Update SAME system message
    const updatedMessage =
      await this.messageService.updateCallMessage(` ${call?.type === 'AUDIO' ? '📞' : '🎥'} Call rejected`, data.callId, {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
      });

    // 3️⃣ Notify chat UI
    if (updatedMessage) {
      this.server
        .to(updatedMessage.conversationId)
        .emit('message:updated', updatedMessage);
    }

    // 4️⃣ Call signaling
    this.server.to(data.callId).emit('call:rejected', {
      callId: data.callId,
      userId,
    });
  }


  @SubscribeMessage('call:end')
  async handleCallEnd(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;


    // 1️⃣ Mark participant left
    await this.prisma.callParticipant.updateMany({
      where: {
        callId: data.callId,
        userId,
        leftAt: null,
      },
      data: { leftAt: new Date() },
    });

    // 2️⃣ End call
    const call = await this.prisma.call.update({
      where: { id: data.callId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // 3️⃣ Update SAME system message
    const updatedMessage =
      await this.messageService.updateCallMessage(`${call?.type === 'AUDIO' ? '📞' : '🎥'} Call ended`, data.callId, {
        status: 'ENDED',
        endedBy: userId,
        endedAt: call.endedAt,
      });

    // 4️⃣ Notify chat UI
    if (updatedMessage) {
      this.server
        .to(updatedMessage.conversationId)
        .emit('message:updated', updatedMessage);
    }

    // 5️⃣ Notify call channel
    this.server.to(data.callId).emit('call:ended', {
      callId: data.callId,
      endedBy: userId,
    });
  }



  @SubscribeMessage('call:miss')
  async handleCallMissed(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 1️⃣ Mark call missed
    const call = await this.prisma.call.update({
      where: { id: data.callId },
      data: {
        status: 'MISSED',
        endedAt: new Date(),
      },
    });

    // 2️⃣ Update SAME system message
    const updatedMessage =
      await this.messageService.updateCallMessage(`${call?.type === 'AUDIO' ? '📞' : '🎥'} Missed call`, data.callId, {
        status: 'MISSED',
        missedAt: call.endedAt,

      });

    // 3️⃣ Notify chat UI
    if (updatedMessage) {
      this.server
        .to(updatedMessage.conversationId)
        .emit('message:updated', updatedMessage);
    }

    // 4️⃣ Notify call channel
    this.server.to(data.callId).emit('call:missed', {
      callId: data.callId,
    });
  }




  /* ---------------- WEBRTC SIGNALING ---------------- */

  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @MessageBody()
    data: { conversationId: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.conversationId).emit('webrtc:offer', {
      from: client.data.userId,
      offer: data.offer,
    });
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @MessageBody()
    data: { conversationId: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.conversationId).emit('webrtc:answer', {
      from: client.data.userId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('webrtc:ice-candidate')
  handleIceCandidate(
    @MessageBody()
    data: { conversationId: string; candidate: RTCIceCandidateInit },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.conversationId).emit('webrtc:ice-candidate', {
      from: client.data.userId,
      candidate: data.candidate,
    });
  }




}



