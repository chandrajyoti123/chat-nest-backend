import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: '+917559223041',
    description: 'Phone number with country code'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'login',
    enum: ['login', 'signup'],
    description: 'Purpose of OTP'
  })
  @IsEnum(['login', 'signup'])
  type: 'login' | 'signup';
}
