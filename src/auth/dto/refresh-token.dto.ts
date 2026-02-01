
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'your_refresh_token_here', description: 'The refresh token obtained during login' })
  @IsString()
  refresh_token: string;
}
