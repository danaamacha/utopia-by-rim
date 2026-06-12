import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ProductsService } from './products.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// -------------------------
// Helpers
// -------------------------
function toBool(v: any) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  // =========================
  // PUBLIC
  // =========================
  @Get('products')
  async listPublic(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.listPublic({
      category,
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    });
  }

  @Get('products/best-sellers')
  async bestSellers(@Query('limit') limit?: string) {
    return this.productsService.getBestSellers(Number(limit) || 6);
  }

  @Get('products/slug/:slug')
  async getPublicBySlug(@Param('slug') slug: string) {
    return this.productsService.getPublicBySlug(slug);
  }

  // =========================
  // ADMIN
  // =========================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/products')
  async listAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('is_active') isActive?: string,
    @Query('stock_min') stockMin?: string,
    @Query('stock_max') stockMax?: string,
  ) {
    return this.productsService.findAllAdmin({
      category,
      search,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      stockMin: stockMin ? Number(stockMin) : undefined,
      stockMax: stockMax ? Number(stockMax) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/products/:id')
  async getAdminById(@Param('id') id: string) {
    return this.productsService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Post('admin/products')
  async createAdmin(@Body() dto: CreateProductDto) {
    return this.productsService.createAdminProduct(dto);
  }

  /**
   * ✅ IMPORTANT:
   * This PATCH endpoint updates ONLY normal product fields (JSON body).
   * Image upload is done via POST /admin/products/:id/images (multipart/form-data).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Patch('admin/products/:id')
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateAdminProduct(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Delete('admin/products/:id')
  async deleteAdmin(@Param('id') id: string) {
    return this.productsService.deleteAdminProduct(id);
  }

  // =========================
  // IMAGES (UPLOAD / PRIMARY)
  // =========================

  /**
   * ✅ Upload image for a product
   * form-data:
   * - file: (image)  <-- MUST be called "file"
   * - altText (optional)
   * - isPrimary (optional true/false)
   * - position (optional number)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Post('admin/products/:id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const ok = /image\/(png|jpe?g|webp|gif)/i.test(file.mimetype || '');
        if (!ok) return cb(new BadRequestException('Only image files are allowed') as any, false);
        return cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProductImage(
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
    @Body('isPrimary') isPrimary?: string,
    @Body('position') position?: string,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    // Upload to Supabase Storage; the returned URL is permanent and
    // survives Render redeploys (legacy /uploads/ images keep working
    // via ServeStatic — they are committed to the repo).
    const url = await this.storageService.uploadProductImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return this.productsService.addImageToProduct(productId, {
      url,
      altText: altText?.trim() ? altText.trim() : null,
      isPrimary: toBool(isPrimary),
      position: toInt(position, 0),
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Post('admin/products/:id/images/:imageId/primary')
  async makePrimary(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.setPrimaryImage(productId, imageId);
  }
}