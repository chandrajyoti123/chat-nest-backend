import { UserResponseDto } from '@auth/dto/user-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ============================
   Message Meta (Image / File)
============================ */
export class MessageMetaDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../file.png' })
  url: string;

  @ApiProperty({ example: 'image' })
  type: string;

  @ApiProperty({ example: 576986 })
  size: number;

  @ApiPropertyOptional({ example: 'jpg' })
  format?: string;

  @ApiPropertyOptional({ example: 'chat/a27ewtqnwbmuqk3tz3pw' })
  publicId?: string;

  @ApiPropertyOptional({ example: 'image.jpg' })
  fileName?: string;

  @ApiPropertyOptional({ example: '168.2 KB' })
  fileSize?: string;

  @ApiPropertyOptional({ example: 'image' })
  fileType?: string;
}

/* ============================
   Sender
============================ */
// export class SenderDto {
//   @ApiProperty({ example: 'cmja2k2r40000s1v5u51rvzvv' })
//   id: string;

//   @ApiProperty({ example: 'chandrajyoti adil' })
//   name: string;

//   @ApiPropertyOptional({ example: '+917559223041' })
//   phone?: string;

//   @ApiPropertyOptional({ example: 'user@email.com' })
//   email?: string;
// }

/* ============================
   Reply Message
============================ */
export class ReplyToMessageDto {
  @ApiProperty({ example: 'cmjjzpslr0012s1iizueozpm3' })
  id: string;

  @ApiProperty({ example: 'hello kitty' })
  content: string;

  @ApiProperty({
    example: 'IMAGE',
    enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
  })
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

  @ApiPropertyOptional({ type: MessageMetaDto })
  meta?: MessageMetaDto;

  @ApiProperty({ type: UserResponseDto})
  sender: UserResponseDto;


}

/* ============================
   Main Message Response
============================ */
export class MessageResponseDto {
  @ApiProperty({ example: 'cmjjzzm5k0001s1ldynty62zt' })
  id: string;

  @ApiProperty({ example: 'cmjcsh1d10004s1hh6w6547n3' })
  conversationId: string;

  @ApiProperty({ example: 'cmjcsgkj20001s1hhw72yh0eh' })
  senderId: string;

  @ApiProperty({ example: 'hii' })
  content: string;

  @ApiProperty({
    example: 'TEXT',
    enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
  })
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

  @ApiPropertyOptional({
    type: MessageMetaDto,
    nullable: true,
  })
  meta?: MessageMetaDto | null;

  @ApiPropertyOptional({ example: 'cmjjzpslr0012s1iizueozpm3' })
  replyToId?: string;

  @ApiProperty({ example: false })
  deletedForAll: boolean;

  @ApiProperty({ example: '2025-12-24T12:36:20.072Z' })
  createdAt: string;

  @ApiProperty({ type: UserResponseDto })
  sender: UserResponseDto;

  @ApiProperty({
    type: [String],
    example: [],
  })
  deletions: string[];

  @ApiPropertyOptional({ type: ReplyToMessageDto })
  replyTo?: ReplyToMessageDto;

   @ApiProperty({ type: [UserResponseDto] })
  reads: UserResponseDto[];
}
