
import * as dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID || ""



};