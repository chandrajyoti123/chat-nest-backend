import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { jwtConstants } from './constants';
import { TwilioService } from '@twilio/twilio.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.accessSecret,
      signOptions: {
        expiresIn:jwtConstants.accessExpiresIn, 
      },
    }),
  ],
  providers: [AuthService, JwtStrategy,TwilioService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
