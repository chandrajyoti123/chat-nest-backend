import cloudinary from '@config/cloudinary.config';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadChatFileDto } from './dto/upload-chat-file.dto';
import { Readable } from 'stream';
import { UploadChatFileResponseDto } from './dto/upload-chat-file-response.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {

  @Post('chat-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file for chat' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadChatFileDto })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: UploadChatFileResponseDto })

  async uploadChatFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Missing required parameter - file');
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'chat', resource_type: 'auto' },
      (error, result) => {
        if (error) throw error;
        return result;
      },
    );

    // Convert buffer to stream
    Readable.from(file.buffer).pipe(stream);

    // Wait for result
    const result: any = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'chat', resource_type: 'auto' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      Readable.from(file.buffer).pipe(upload);
    });

    return {
      url: result.secure_url,
      type: result.resource_type,
      size: result.bytes,
      format: result.format,
      publicId: result.public_id,
    };
  }
}
