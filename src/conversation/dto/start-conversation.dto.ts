// src/conversations/dto/start-conversation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ example: 'friendUserId', description: 'Friend ID to start chat with' })
  @IsString()
  @IsNotEmpty()
  friendId: string;
}
