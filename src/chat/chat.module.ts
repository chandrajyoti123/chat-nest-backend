import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '@prisma/prisma.module';
import { MessageService } from '@message/message.service';

@Module({
  imports: [PrismaModule],
  providers: [ChatGateway, MessageService],
  exports: [ChatGateway],
})
export class ChatModule {}

