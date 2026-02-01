import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class CreateGroupConversationDto {
  @ApiProperty({ example: "Family Group" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ["uid1", "uid2", "uid3"] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  members: string[];
}



