import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+917559223041' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ enum: ['login', 'signup'] })
  @IsEnum(['login', 'signup'])
  type: 'login' | 'signup';
}
