import { envConfig } from '@config/envconfig';
import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
    private client: Twilio;

    constructor() {
        this.client = new Twilio(
            envConfig.accountSid,
            envConfig.authToken,
        );
    }

    async sendOTP(phone: string) {
        return this.client.verify.v2
            .services(envConfig.serviceSid)
            .verifications.create({ to: phone, channel: 'sms' });
    }

    async verifyOTP(phone: string, code: string) {
        const verification = await this.client.verify.v2
            .services(envConfig.serviceSid)
            .verificationChecks.create({ to: phone, code });
        return verification.status === 'approved';
    }
}
