import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'ckx123abc' })
  id: string;

  @ApiProperty({ example: 'Chandrajyoti' })
  name: string;

  @ApiProperty({ example: '+919876543210' })
  phone: string;

  @ApiProperty({ example: 'user@email.com' })
  email: string;

  @ApiProperty({ example: true })
  isPhoneVerified: boolean;

  @ApiProperty({
    example: 'Hey there! I am using GetUno',
    description: 'User profile about/status',
  })
  about: string;

  @ApiProperty({
    example: true,
    description: 'User online status',
  })
  isOnline: boolean;

  @ApiProperty({
    example: '2025-03-25T10:30:00.000Z',
    description: 'Last seen timestamp (null if online)',
    nullable: true,
  })
  lastSeenAt: Date | null;
}
