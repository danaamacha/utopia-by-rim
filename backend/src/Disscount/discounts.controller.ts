// backend/src/discounts/discounts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // ─── ADMIN endpoints ──────────────────────────────────────────────────────

  /** GET /api/admin/discounts */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/discounts')
  adminList() {
    return this.discountsService.adminList();
  }

  /** GET /api/admin/discounts/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/discounts/:id')
  adminGetById(@Param('id', ParseUUIDPipe) id: string) {
    return this.discountsService.adminGetById(id);
  }

  /** POST /api/admin/discounts */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Post('admin/discounts')
  adminCreate(@Body() dto: CreateDiscountDto) {
    return this.discountsService.adminCreate(dto);
  }

  /** PATCH /api/admin/discounts/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Patch('admin/discounts/:id')
  adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiscountDto,
  ) {
    return this.discountsService.adminUpdate(id, dto);
  }

  /** DELETE /api/admin/discounts/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Delete('admin/discounts/:id')
  adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.discountsService.adminDelete(id);
  }

  // ─── PUBLIC endpoint — validate a code before checkout ───────────────────

  /**
   * POST /api/discounts/validate
   * Body: { code: "UTOPIA10", total: 120 }
   * Returns: { discountAmount, finalTotal, freeShipping, ... }
   */
  @Post('discounts/validate')
  validateCode(@Body() dto: ApplyDiscountDto) {
    return this.discountsService.validateCode(dto.code, dto.total);
  }
}