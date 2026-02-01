import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@auth/jwt.guard';
import { UpdateAboutDto } from './dto/update-about.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Get all users (requires JWT)' })
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID (requires JWT)' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }


@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Patch('about')
@ApiOperation({ summary: 'Update user about/status' })
updateAbout(@Req() req, @Body() body: UpdateAboutDto,) {
const userId = req.user.userId;
  return this.userService.updateAbout(userId, body.about);
}}
