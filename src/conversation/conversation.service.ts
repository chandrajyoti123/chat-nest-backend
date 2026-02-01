import { Injectable, BadRequestException, } from '@nestjs/common';
import { StartConversationDto } from './dto/start-conversation.dto';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';
import { CreateGroupConversationDto } from './dto/create-group.dto';

@Injectable()
export class ConversationService {
  constructor(private prisma: EnhancedPrismaService) { }

  async startConversation(userId: string, dto: StartConversationDto) {
    const { friendId } = dto;

    if (friendId === userId) {
      throw new BadRequestException("You cannot start a conversation with yourself");
    }

    // 1️⃣ Check if friend is in user's contacts
    const contact = await this.prisma.contact.findFirst({
      where: { ownerId: userId, friendId },
    });

    if (!contact) {
      throw new BadRequestException("You can only chat with your contacts");
    }

    // 2️⃣ Check if a 1:1 conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [userId, friendId] }
          }
        }
      },
      include: { participants: true },
    });

    if (existing) {
      return existing; // return existing conversation
    }

    // 3️⃣ Create conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          createMany: {
            data: [
              { userId },
              { userId: friendId }
            ]
          }
        }
      },
      include: { participants: true },
    });

    return conversation;
  }


  async createGroup(ownerId: string, dto: CreateGroupConversationDto) {
    const { name, members } = dto;


    // 1️⃣ Remove duplicates & owner if included accidentally
    const uniqueMembers = [...new Set(members)].filter(id => id !== ownerId);

    if (uniqueMembers.length === 0) {
      throw new BadRequestException("Group must contain at least 1 member (besides you)");
    }

    // 2️⃣ Validate all members exist in the owner's contact list
    const contacts = await this.prisma.contact.findMany({
      where: {
        ownerId,
        friendId: { in: uniqueMembers }
      }
    });

    if (contacts.length !== uniqueMembers.length) {
      throw new BadRequestException("You can only add users who are in your contacts");
    }

    // 3️⃣ Create group conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        name,
        isGroup: true,
        participants: {
          create: [
            // creator joins as admin
            { userId: ownerId, role: "admin" },

            // others join as members
            ...uniqueMembers.map(uid => ({
              userId: uid,
              role: "member"
            }))
          ]
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });

    return conversation;
  }


  // async getGroupsForUser(userId: string) {
  //   return this.prisma.conversation.findMany({
  //     where: {
  //       isGroup: true,
  //       participants: {
  //         some: { userId }
  //       }
  //     },
  //     include: {
  //       participants: {
  //         include: { user: true }
  //       },
  //       messages: {
  //         orderBy: { createdAt: 'desc' },
  //         take: 1
  //       }
  //     },
  //     orderBy: { createdAt: "desc" }
  //   });
  // }

  async getGroupsForUser(userId: string) {
    const groups = await this.prisma.conversation.findMany({
      where: {
        isGroup: true,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
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
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            reads: true,
          },
        },
      },
      // orderBy: { createdAt:"desc" },
    });

    const result = await Promise.all(
      groups.map(async (group) => {
        // 🔔 Unread messages count (exclude own messages)
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: group.id,
            senderId: { not: userId },
            reads: {
              none: { userId },
            },
          },
        });

        return {
          id: group.id,
          isGroup: group.isGroup,
          name: group.name,
          createdAt: group.createdAt,
          participants: group.participants,
          lastMessage: group.messages[0]?.content ?? null,
          lastMessageAt: group.messages[0]?.createdAt ?? null,
          lastMessageBy: group.messages[0]?.senderId ?? null,
          lastMessageReads: group.messages[0]?.reads ?? [],
          unreadCount,
        };
      }),
    );

    return result;
  }


  // async getOppositeMember(userId: string, conversationId: string) {
  //   const conversation = await this.prisma.conversation.findUnique({
  //     where: { id: conversationId, isGroup: false },
  //     include: {
  //       participants: {
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               phone: true,
  //               email: true,
  //               createdAt: true,
  //               isOnline: true,
  //               lastSeenAt: true,
  //               about: true
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!conversation) {
  //     throw new BadRequestException('Conversation not found');
  //   }

  //   // 🚫 Group not allowed
  //   if (conversation.isGroup) {
  //     throw new BadRequestException('This endpoint is only for 1:1 conversations');
  //   }

  //   // ✅ Ensure user is part of conversation
  //   const isParticipant = conversation.participants.some(
  //     p => p.userId === userId,
  //   );

  //   if (!isParticipant) {
  //     throw new BadRequestException('You are not part of this conversation');
  //   }

  //   // ✅ Find opposite user
  //   const oppositeParticipant = conversation.participants.find(
  //     p => p.userId !== userId,
  //   );

  //   if (!oppositeParticipant) {
  //     throw new BadRequestException('Opposite user not found');
  //   }

  //   return {
  //     conversationId,
  //     user: oppositeParticipant.user,
  //   };
  // }

  async getConversationById(
    userId: string,
    conversationId: string,
  ) {

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: {
              id: true,
              name: true,
            isOnline: true,
            lastSeenAt: true,
            about: true,
            email: true,
            }  },
          },
        },
        messages: false,
        calls:false,
      },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    // ✅ Check user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new BadRequestException('You are not part of this conversation');
    }

    // ✅ GROUP → return full conversation
    if (conversation.isGroup) {
      return conversation;
    }

    // ✅ 1:1 → exclude logged-in user from participants
    const filteredParticipants = conversation.participants.filter((p) => p.user.id !== userId);

    console.log('Filtered Participants:', filteredParticipants);

    if (filteredParticipants.length === 0) {
      throw new BadRequestException('Opposite member not found');
    }

    return {

      ...conversation,
      participants: filteredParticipants,
    };
  }



  // async getConversationById(userId: string, conversationId: string) {
  //   const conversation = await this.prisma.conversation.findUnique({
  //     where: { id: conversationId },
  //     include: {
  //       participants: {
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               phone: true,
  //               email: true,
  //               createdAt: true,
  //               isOnline: true,
  //               lastSeenAt: true,
  //               about: true,
  //             },
  //           },
  //         },
  //       },
  //       messages: {
  //         orderBy: { createdAt: 'desc' },
  //         take: 1, // last message
  //         select: {
  //           id: true,
  //           content: true,
  //           createdAt: true,
  //           senderId: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!conversation) {
  //     throw new BadRequestException('Conversation not found');
  //   }

  //   // Filter out requesting user
  //   const otherParticipants = conversation.participants.map(p => p.user);

  //   return {
  //     conversationId: conversation.id,
  //     isGroup: conversation.isGroup,
  //     name: conversation.name,
  //     participants: otherParticipants,
  //     lastMessage: conversation.messages[0]?.content ?? null,
  //   };
  // }


}

