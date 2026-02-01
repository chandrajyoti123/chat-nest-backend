import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "./user-response.dto";

export class VerifyOtpResponse {
  @ApiProperty()
  phone: string;

  @ApiProperty()
  otpToken: string;

  @ApiProperty()
  isNewUser: boolean;

  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
