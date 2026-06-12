// backend/src/pages/pages.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /**
   * PUBLIC — fetch all pages at once
   * GET /api/pages
   */
  @Get('pages')
  getAllPages() {
    return this.pagesService.getAllPages();
  }

  /**
   * PUBLIC — fetch a single page
   * GET /api/pages/:slug
   */
  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.pagesService.getPage(slug);
  }

  /**
   * ADMIN — save a page's content
   * PATCH /api/admin/pages/:slug
   * Body: { content: { ...fields } }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Patch('admin/pages/:slug')
  upsertPage(
    @Param('slug') slug: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.upsertPage(slug, dto);
  }
}