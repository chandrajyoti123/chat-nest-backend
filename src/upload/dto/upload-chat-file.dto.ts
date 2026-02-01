import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadChatFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload for chat',
  })
  @IsNotEmpty()
  file: any;
}
