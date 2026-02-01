import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server } from 'socket.io';
import { MessageType, Prisma } from '@prisma/client';


@Injectable()
export class MessageService {
  constructor(
    private prisma: EnhancedPrismaService,
  ) { }

  async sendMessage(userId: string, dto: CreateMessageDto, io?: Server) {
    const { conversationId, content, meta, replyToId } = dto;

    // 1️⃣ Validate sender is participant
    const isParticipant =
      await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

    if (!isParticipant) {
      throw new BadRequestException('You are not part of this conversation.');
    }

    // 2️⃣ Find all other participants (receivers)
    const receivers =
      await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId },
        },
        select: { userId: true },
      });

    if (!receivers.length) {
      return null;
    }

    // 3️⃣ Check existing contacts (DO NOT blindly insert)
    const existingContacts =
      await this.prisma.raw.contact.findMany({
        where: {
          ownerId: { in: receivers.map(r => r.userId) },
          friendId: userId,
        },
        select: { ownerId: true },
      });

    const existingOwnerIds = new Set(
      existingContacts.map(c => c.ownerId),
    );

    const contactsToCreate = receivers
      .filter(r => !existingOwnerIds.has(r.userId))
      .map(r => ({
        ownerId: r.userId, // receiver
        friendId: userId,  // sender
      }));

    if (contactsToCreate.length) {
      await this.prisma.raw.contact.createMany({
        data: contactsToCreate,
      });
    }

    // 4️⃣ Determine message type
    let type: MessageType = MessageType.TEXT;
    if (meta?.type) {
      if (meta.type.startsWith('image')) type = MessageType.IMAGE;
      else type = MessageType.FILE;
    }

    // 5️⃣ Determine message content
    const messageContent =  content;

    // 6️⃣ Save message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: messageContent,
        replyToId: replyToId,
        type,
        meta: meta,
      },
      include: { sender: { select: { id: true, name: true, phone: true } } },
    });
    // const message = await this.prisma.message.create({
    //   data: {
    //     conversationId,
    //     senderId: userId,
    //     content,
    //   },
    //   include: {
    //     sender: {
    //       select: { id: true, name: true, phone: true },
    //     },
    //   },
    // });

    // 5️⃣ Emit socket event
    if (io) {
      receivers.forEach(r => {
        io.to(r.userId).emit('newMessage', message);
      });
    }

    return message;
  }




  // Fetch messages of a conversation
  // async getMessages(userId: string, conversationId: string) {
  //   // 1️⃣ Validate user is participant
  //   const isParticipant = await this.prisma.conversationParticipant.findUnique({
  //     where: { conversationId_userId: { conversationId, userId } },
  //   });
  //   if (!isParticipant) {
  //     throw new BadRequestException('You are not part of this conversation.');
  //   }

  //   // 2️⃣ Return messages
  //   return this.prisma.message.findMany({
  //     where: { conversationId },
  //     include: {
  //       sender: {
  //         select: { id: true, name: true, phone: true },
  //       },
  //     },
  //     orderBy: { createdAt: 'asc' }, // oldest first
  //   });
  // }

  async getMessages(userId: string, conversationId: string) {
    // 1️⃣ Validate participant
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isParticipant) {
      throw new BadRequestException('You are not part of this conversation.');
    }

    // 2️⃣ Fetch messages WITH deletions
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, phone: true },
        },
        deletions: {
          where: { userId },
          select: { id: true },
        },
        reads:true,
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            meta:true,
            sender: {
              select: { id: true, name: true ,email:true},
            },
          },
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3️⃣ Transform per-user response
    return messages.map(msg => {
      // 🔥 Deleted FOR ME only
      if (msg.deletions.length > 0 && !msg.deletedForAll) {
        return {
          ...msg,
          content: 'You deleted this message',
          meta: null,
          type: 'SYSTEM',
        };
      }

      // 🔥 Deleted FOR EVERYONE
      if (msg.deletedForAll) {
        return {
          ...msg,
          content: 'This message was deleted',
          meta: null,
          type: 'SYSTEM',
        };
      }

      return msg;
    });
  }




  async markAsRead(userId: string, conversationId: string) {
    // 1. Find all messages in this conversation that the user hasn't read yet
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Don't mark your own messages as unread
        reads: {
          none: { userId }, // Where there is no 'read' record for this user
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) return { count: 0 };

    // 2. Create MessageRead entries for all unread messages
    const readData = unreadMessages.map((msg) => ({
      userId,
      messageId: msg.id,
    }));

    // We use the raw prisma (or standard createMany) to avoid individual policy overhead for bulk
    const result = await this.prisma.messageRead.createMany({
      data: readData,
      skipDuplicates: true,
    });

    return { count: result.count };
  }






  async getUnreadCountByConversation(userId: string) {
    const conversations =
      await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: {
          conversationId: true,
          conversation: {
            select: {
              messages: {
                where: {
                  senderId: { not: userId },
                  reads: { none: { userId } },
                },
                select: { id: true },
              },
            },
          },
        },
      });

    return conversations.map(c => ({
      conversationId: c.conversationId,
      unreadCount: c.conversation.messages.length,
    }));
  }



  async deleteMessageForEveryone(
    userId: string,
    messageId: string,
    io?: Server,
  ) {
    // 1️⃣ Fetch message
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        conversationId: true,
        deletedForAll: true,
      },
    });

    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // 2️⃣ Only sender allowed
    if (message.senderId !== userId) {
      throw new BadRequestException('You can delete only your own message');
    }

    // 3️⃣ Prevent double delete
    if (message.deletedForAll) {
      return { success: true };
    }

    // 4️⃣ Soft delete for everyone
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedForAll: true,
        type: MessageType.SYSTEM,
        content: 'This message was deleted',
        meta: Prisma.DbNull,
      },
    });

    // 5️⃣ Emit socket event
    if (io) {
      io.to(message.conversationId).emit('message-deleted-for-all', {
        messageId,
        conversationId: message.conversationId,
      });
    }

    return updated;
  }



  async deleteMessageForMe(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // 2️⃣ Create delete-for-me record (idempotent)
    await this.prisma.messageDelete.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {}, // no-op if already deleted
    });

    return {
      success: true,
      message: 'Message deleted for you',
    };

  }



  async updateCallMessage(content: string, callId: string, patch: any) {
    const message = await this.prisma.message.findFirst({
      where: {
        type: MessageType.SYSTEM,
        meta: {
          path: ['callId'],
          equals: callId,
        },
      },
    });

    if (!message) return null;

    return this.prisma.message.update({
      where: { id: message.id },
      data: {
        content,
        meta: {
          ...(message.meta as any),
          ...patch,
        },
      },
    });
  }

}
