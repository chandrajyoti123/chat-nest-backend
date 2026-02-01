import { Controller, Post, Body, Req, UseGuards, Get, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/jwt.guard';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatGateway } from '@chat/chat.gateway';
import { MessageResponseDto } from './dto/message-response.dto';


@ApiTags('Message')
@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) { }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('send')
  @ApiOperation({ summary: 'Send a message via REST (fallback if WS fails)' })
  async sendMessage(@Req() req, @Body() dto: CreateMessageDto) {
    const userId = req.user.userId;
    return this.messageService.sendMessage(userId, dto, this.chatGateway.server);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':conversationId')
  @ApiOperation({ summary: 'Get all messages of a conversation' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  async getMessages(@Req() req, @Param('conversationId') conversationId: string) {
    const userId = req.user.userId;
    return this.messageService.getMessages(userId, conversationId);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('read/:conversationId')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markAsRead(@Req() req, @Param('conversationId') conversationId: string) {
    const userId = req.user.userId;
    return this.messageService.markAsRead(userId, conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('unread/total-count/by-conversation')
  async getUnreadByConversation(@Req() req) {
    const userId = req.user.userId;
    return this.messageService.getUnreadCountByConversation(userId);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Delete(':messageId/delete-for-all')
  @ApiOperation({
    summary: 'Delete a message for everyone (sender only)',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message ID to delete',
  })
  async deleteForEveryone(
    @Req() req,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user.userId;

    return this.messageService.deleteMessageForEveryone(
      userId,
      messageId,
      this.chatGateway.server,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Delete(':messageId/delete-for-me')
  @ApiOperation({
    summary: 'Delete a message for me only (sender or receiver)',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message ID to delete for current user',
  })
  async deleteForMe(
    @Req() req: any,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user.userId;

    return this.messageService.deleteMessageForMe(
      userId,
      messageId,

    );
  }




}
