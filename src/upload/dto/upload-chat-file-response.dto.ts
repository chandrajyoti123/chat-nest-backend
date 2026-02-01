import { ApiProperty } from '@nestjs/swagger';

export class UploadChatFileResponseDto {
  @ApiProperty({ description: 'URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'Type of the file', example: 'image' })
  type: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  size: number;

  @ApiProperty({ description: 'File format', example: 'png' })
  format: string;

  @ApiProperty({ description: 'Cloudinary public ID of the file' })
  publicId: string;
}
