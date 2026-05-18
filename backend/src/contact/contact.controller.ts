import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { AdminContactQueryDto } from './dto/admin-contact-query.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public
  @Post('contact')
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto);
  }

  // Admin: list messages
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/contact')
  adminList(@Query() query: AdminContactQueryDto) {
    return this.contactService.adminList(query);
  }

  // Admin: get message
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/contact/:id')
  adminGet(@Param('id') id: string) {
    return this.contactService.adminGetById(id);
  }

  // Admin: update status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/contact/:id/status')
  adminUpdateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ) {
    return this.contactService.adminUpdateStatus(id, dto);
  }
}
