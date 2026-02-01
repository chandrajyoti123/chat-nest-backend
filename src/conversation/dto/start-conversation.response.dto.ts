import { ApiProperty } from '@nestjs/swagger';

class ConversationParticipantDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  role: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt: Date;
}

export class StartConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isGroup: boolean;

  @ApiProperty()
  name: string ;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: [ConversationParticipantDto] })
  participants: ConversationParticipantDto[];
}
