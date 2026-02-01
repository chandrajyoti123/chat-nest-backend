import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateAboutDto {
  @ApiProperty({
    example: 'Hey there! I am using GetUno',
    description: 'User profile status / about text',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  about: string;
}
