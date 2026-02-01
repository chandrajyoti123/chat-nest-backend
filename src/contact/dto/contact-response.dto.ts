import { UserResponseDto } from '@auth/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';
export class ContactChatResponseDto {
  @ApiProperty()
  contactId: string;

  @ApiProperty({ type: UserResponseDto })
  friend: UserResponseDto;

  @ApiProperty({ nullable: true })
  conversationId: string | null;

  @ApiProperty({ nullable: true })
  lastMessage: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lastMessageAt: Date | null;

  @ApiProperty({ nullable: true })
  lastMessageBy: string | null;

  @ApiProperty({ type: [UserResponseDto] })
  lastMessageRead: UserResponseDto[];

  @ApiProperty({ description: 'Unread messages count' })
  unreadCount: number;
}
