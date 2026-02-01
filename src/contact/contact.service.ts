import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AddContactDto } from './dto/add-contact.dto';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: EnhancedPrismaService) { }

  async addContact(userId: string, dto: AddContactDto) {


    const { friendPhone } = dto;

    // 1. Check if friend exists
    const friend = await this.prisma.user.findUnique({
      where: { phone: friendPhone },
    });

    if (!friend) {
      throw new NotFoundException('User not registered');
    }

    // 2. Prevent adding yourself
    if (friend.id === userId) {
      throw new BadRequestException('You cannot add yourself');
    }

    // 3. Check duplicate contact
    const existing = await this.prisma.contact.findFirst({
      where: {
        ownerId: userId,
        friendId: friend.id,
      },
    });

    if (existing) {
      throw new BadRequestException('Contact already exists');
    }

    // 4. Create contact
    await this.prisma.contact.create({
      data: {
        ownerId: userId,
        friendId: friend.id,
      },
    });

    return { message: 'Contact added successfully' };
  }


  // async getContacts(userId: string) {
  //   const contacts = await this.prisma.contact.findMany({
  //     where: { ownerId: userId },
  //     include: {
  //       friend: { select: { id: true, name: true, phone: true, email: true } },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  //   return contacts; 
  // }


  async getContacts(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { ownerId: userId },
      include: {
        friend: {
          select: { id: true, name: true, phone: true, email: true, isOnline: true, lastSeenAt: true, about: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = await Promise.all(
      contacts.map(async (contact) => {
        // 1️⃣ Find latest personal conversation
        const conversation = await this.prisma.conversation.findFirst({
          where: {
            isGroup: false,
            participants: {
              every: {
                userId: { in: [userId, contact.friendId] },
              },
            },
          },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                content: true,
                createdAt: true,
                senderId:true,
                reads:true
              },
            },
          },
        });

        // 2️⃣ Unread count
        const unreadCount = conversation
          ? await this.prisma.message.count({
            where: {
              conversationId: conversation.id,
              senderId: { not: userId },
              reads: {
                none: { userId },
              },
            },
          })
          : 0;

        return {
          contactId: contact.id,
          friend: contact.friend,
          conversationId: conversation?.id ?? null,
          lastMessage: conversation?.messages[0]?.content ?? null,
          lastMessageAt: conversation?.messages[0]?.createdAt ?? null,
          lastMessageBy:conversation?.messages[0]?.senderId,
          lastMessageReads:conversation?.messages[0]?.reads,
          unreadCount,
        };
      }),
    );

    return result;
  }


  async getContactById(userId: string, contactId: string) {
    // 1️⃣ Check if contact exists
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isOnline: true,
            lastSeenAt: true,
            about: true,
          },
        },
      },
    });

    if (!contact) {
      throw new BadRequestException('Contact not found');
    }

    // 2️⃣ Get latest conversation if needed
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: { every: { userId: { in: [userId, contact.friend.id] } } },
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
      },
    });

    return {
      contactId: contact.id,
      friend: contact.friend,
      conversationId: conversation?.id ?? null,
      lastMessage: conversation?.messages[0]?.content ?? null,
      lastMessageAt: conversation?.messages[0]?.createdAt ?? null,
    };
  }


}
