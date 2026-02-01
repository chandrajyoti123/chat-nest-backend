import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddContactDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number of the friend you want to add',
  })
  @IsString()
  @IsNotEmpty()
  friendPhone: string;
}
