import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';
import { EnhancedPrismaService } from '@prisma/enhanced-prisma.service';
import { TwilioService } from '@twilio/twilio.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteSignupDto } from './dto/complete-signup-dto';


@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly prisma: EnhancedPrismaService,
    private readonly twilio: TwilioService,
  ) { }

  async sendOtp(dto: SendOtpDto) {
    const { phone, type } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { phone } });

    if (type === 'signup' && existingUser) {
      throw new BadRequestException('User already exists');
    }

    if (type === 'login' && !existingUser) {
      throw new NotFoundException('User not found');
    }

    // await this.twilio.sendOTP(phone);

    return { message: 'OTP sent' };
  }


  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otp, type } = dto;

    // const isValid = await this.twilio.verifyOTP(phone, otp);
    const isValid = true;
    if (!isValid) throw new BadRequestException('Invalid OTP');


    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (type === 'signup') {
      // New signup → return temporary otpToken, do NOT create user yet
      if (user) throw new BadRequestException('User exists');

      const otpToken = this.jwtService.sign(
        { phone, type: 'signup' },
        { secret: jwtConstants.otpSecret, expiresIn: '5m' }
      );

      return { isNewUser: true, phone, otpToken };
    }

    // Login flow
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.generateTokens(user.id, user.phone);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return { user, ...tokens };
  }


  async completeSignup(dto: CompleteSignupDto) {
    const { phone, name, email, otpToken } = dto;

    // Verify otpToken
    try {
      const payload = this.jwtService.verify(otpToken, { secret: jwtConstants.otpSecret });
      if (payload.phone !== phone || payload.type !== 'signup') {
        throw new UnauthorizedException('Invalid OTP token');
      }
    } catch {
      throw new UnauthorizedException('OTP token expired or invalid');
    }

    // Prevent duplicate user
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) throw new BadRequestException('User already exists');

    // Create user
    const user = await this.prisma.user.create({
      data: { phone, name, email, isPhoneVerified: true },
    });

    const tokens = await this.generateTokens(user.id, phone);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return { user, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user.id, user.phone);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.hashedRt) {
      throw new BadRequestException("User is already logged out");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: null },
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  private async generateTokens(userId: string, phone: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, phone },
        { secret: jwtConstants.accessSecret, expiresIn: jwtConstants.accessExpiresIn },
      ),
      this.jwtService.signAsync(
        { sub: userId, phone },
        { secret: jwtConstants.refreshSecret, expiresIn: jwtConstants.refreshExpiresIn },
      ),
    ]);
    return { access_token, refresh_token };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRt = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt },
    });
  }
}


