import { ApiProperty } from '@nestjs/swagger';
import { ConversationParticipantResponseDto } from './conversation-participant-response.dto';



export class LastMessageReadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  readAt: Date;
}

export class ConversationGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isGroup: boolean;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [ConversationParticipantResponseDto] })
  participants: ConversationParticipantResponseDto[];

  @ApiProperty({ nullable: true })
  lastMessage?: string;

  @ApiProperty({ nullable: true })
  lastMessageAt?: Date;

  @ApiProperty({ nullable: true })
  lastMessageBy?: string;

  @ApiProperty({ type: [LastMessageReadDto] })
  lastMessageReads: LastMessageReadDto[];

  @ApiProperty()
  unreadCount: number;
}
