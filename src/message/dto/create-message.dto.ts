import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateMessageDto {

 @ApiPropertyOptional({
    example: 'messageId123',
    description: 'ID of the message being replied to',
  })
  @IsString()
  @IsOptional()
  replyToId?: string;

  @ApiProperty({
    example: 'conversationId123',
    description: 'ID of the conversation'
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiPropertyOptional({
    example: 'Hello, how are you?',
    description: 'Text content of the message'
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Metadata for attached file (image, pdf, etc.)',
    type: Object,
    example: {
      url: 'https://res.cloudinary.com/dudm74obr/image/upload/v1766040678/chat/cgjuk8gvvfbwo4z1qyjp.png',
      type: 'image/png',
      size: 575184,
      format: 'png',
      publicId: 'chat/cgjuk8gvvfbwo4z1qyjp'
    },
  })
  @IsObject()
  @IsOptional()
  meta?: {
    url: string;
    type: string;
    size: number;
    format?: string;
    publicId?: string;
  };
}
