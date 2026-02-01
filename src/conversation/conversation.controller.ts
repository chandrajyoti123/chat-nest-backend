import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/jwt.guard';
import { ConversationService } from './conversation.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group.dto';
import { StartConversationResponseDto } from './dto/start-conversation.response.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { ConversationGroupResponseDto } from './dto/conversation-group.dto';

@ApiTags('Conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private conversationService: ConversationService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: StartConversationResponseDto,
  })
  @Post('start')
  @ApiOperation({ summary: 'Start a 1:1 conversation with a contact' })
  startConversation(@Req() req, @Body() dto: StartConversationDto) {
    const userId = req.user.userId;
    return this.conversationService.startConversation(userId, dto);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('group')
  @ApiOperation({ summary: 'Create a group conversation' })
  createGroup(
    @Req() req,
    @Body() dto: CreateGroupConversationDto,
  ) {
    const userId = req.user.userId;
    return this.conversationService.createGroup(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('groups')
  @ApiOperation({ summary: 'List all groups of the logged-in user' })
   @ApiResponse({ status: 200, type: [ConversationGroupResponseDto] })
  async getMyGroups(@Req() req) {
    const userId = req.user.userId;
    return this.conversationService.getGroupsForUser(userId);
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @ApiOkResponse({
  //   type: ConversationOppositeMemberDto,
  // })
  // @Get(':conversationId/opposite')
  // @ApiOperation({ summary: 'Get opposite user for 1:1 conversation' })
  // getOppositeMember(
  //   @Req() req,
  //   @Param('conversationId') conversationId: string,
  // ) {
  //   const userId = req.user.userId;
  //   return this.conversationService.getOppositeMember(userId, conversationId);
  // }


  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @ApiOkResponse({
  //   type: ConversationResponseDto,
  // })
  // @Get(':conversationId')
  // @ApiOperation({ summary: 'Get conversation details by ID, excluding current user from participants' })
  // async getConversationById(@Req() req, @Param('conversationId') conversationId: string) {
  //   const userId = req.user.userId;
  //   return this.conversationService.getConversationById(userId, conversationId);
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: ConversationResponseDto, })
  @ApiOperation({
    summary:
      'Get conversation by ID (1:1 excludes logged-in user from participants)',
  })
  @Get(':conversationId')
  getConversationById(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.userId;
    return this.conversationService.getConversationById(
      userId,
      conversationId,
    );
  }
}




