import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AddContactDto } from './dto/add-contact.dto';
import { JwtAuthGuard } from '@auth/jwt.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { ContactChatResponseDto } from './dto/contact-response.dto';

@Controller('contacts')
export class ContactController {
  constructor(private contactService: ContactService) { }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('add')
  @ApiOperation({ summary: 'Create a new Contact (requires authentication)' })
  addContact(@Req() req, @Body() dto: AddContactDto) {
    const userId = req.user.userId;
    return this.contactService.addContact(userId, dto);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: ContactChatResponseDto,
    isArray: true,
  })
  @Get()
  @ApiOperation({ summary: 'Get all my contacts (requires authentication)' })
  getAllContacts(@Req() req) {
    const userId = req.user.userId;
    return this.contactService.getContacts(userId);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: ContactChatResponseDto, })
  @Get(':contactId')
  @ApiOperation({ summary: 'Get  contact By Id (requires authentication)' })
  async getContact(@Param('contactId') contactId: string, @Req() req) {
    const userId = req.user.userId;
    return this.contactService.getContactById(userId, contactId);
  }






}
