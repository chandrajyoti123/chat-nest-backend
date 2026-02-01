import { UserResponseDto } from '@auth/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

/* ============================
   User DTO
============================ */
// export class ConversationUserDto {
//   @ApiProperty({ example: 'cmjcsgkj20001s1hhw72yh0eh' })
//   id: string;

//   @ApiProperty({ example: 'mahalaxmi' })
//   name: string;

//   @ApiProperty({ example: '+916379346618' })
//   phone: string;

//   @ApiProperty({ example: 'mahalaxmi@gmail.com' })
//   email: string;

//   @ApiProperty({ example: '2025-12-19T11:31:10.959Z' })
//   createdAt: string;
// }

/* ============================
   Conversation Opposite Member
============================ */
export class ConversationOppositeMemberDto {
  @ApiProperty({ example: 'cmjcsh1d10004s1hh6w6547n3' })
  conversationId: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
