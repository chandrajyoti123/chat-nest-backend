import { ApiProperty } from '@nestjs/swagger';
import { ConversationParticipantResponseDto } from './conversation-participant-response.dto';

export class ConversationResponseDto {
  @ApiProperty({ example: 'cmjmkn7in0007s1q50utmma0g' })
  id: string;

  @ApiProperty({ example: false })
  isGroup: boolean;

  @ApiProperty({
    example: 'Friends Group'
   
  })
  name?: string ;

  @ApiProperty({
    example: '2025-12-26T07:50:05.519Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: [ConversationParticipantResponseDto],
  })
  participants: ConversationParticipantResponseDto[];
}
