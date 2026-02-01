import { Controller, Post, Body, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { JwtAuthGuard } from './jwt.guard';
import { CompleteSignupDto } from './dto/complete-signup-dto';
import { VerifyOtpResponse } from './dto/verify-otp-response.dto';
import { CompleteSignupResponseDto } from './dto/complete-signup-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
  ) { }

 
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and login/register user' })
  @ApiOkResponse({ type: VerifyOtpResponse }) 
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('complete-signup')
  @ApiOperation({ summary: 'Complete signup after OTP verification' })
    @ApiOkResponse({ type: CompleteSignupResponseDto }) 
  completeSignup(@Body() dto: CompleteSignupDto) {
    return this.authService.completeSignup(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT Access Token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refresh_token, {
        secret: jwtConstants.refreshSecret,
      });
      return this.authService.refreshTokens(payload.sub, dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @ApiOperation({ summary: 'Logout user (invalidate refresh token)' })
  async logout(@Req() req,) {
    const userId = req.user.userId;
    return this.authService.logout(userId);
  }
}
