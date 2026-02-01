import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { ChatModule } from '@chat/chat.module';

@Module({
  imports: [PrismaModule,  ChatModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule { }
