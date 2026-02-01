
import * as dotenv from 'dotenv';
dotenv.config();

export const jwtConstants = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  accessExpiresIn: Number(process.env.JWT_ACCESS_EXPIRES) || 900,     
  refreshExpiresIn: Number(process.env.JWT_REFRESH_EXPIRES) || 604800,
  otpSecret:process.env.OTP_SECRET || 'fallback_otp_secret',
};
