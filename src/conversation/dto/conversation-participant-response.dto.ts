import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@auth/dto/user-response.dto';

export class ConversationParticipantResponseDto {
  @ApiProperty({ example: 'cmjmkn7in0009s1q50db26wzr' })
  id: string;

  @ApiProperty({ example: 'cmjmkn7in0007s1q50utmma0g' })
  conversationId: string;

  @ApiProperty({ example: 'cmjmkje9m0001s1q5fss1iy6m' })
  userId: string;

  @ApiProperty({ example: 'member' })
  role: string;

  @ApiProperty({
    example: '2025-12-26T07:50:05.519Z',
  })
  joinedAt: Date;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
