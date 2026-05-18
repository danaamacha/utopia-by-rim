import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { ProductImage } from '../media/product-image.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
  ) {}

  /** ✅ Normalize slug safely (decode + trim + lowercase) */
  private normalizeSlug(input: string) {
    let decoded = input ?? '';
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // ignore bad encoding
    }
    return decoded.trim().toLowerCase();
  }

  // ✅ Controller wrapper
  async listPublic(query: any) {
    return this.findAllPublic(query);
  }

  // ===== PUBLIC =====
  async findAllPublic(query: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.categories', 'c')
      .where('p.isActive = true');

    if (query.search) {
      qb.andWhere('(p.name ILIKE :s OR p.slug ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    if (query.category) {
      qb.andWhere('(c.slug = :cat OR c.name = :cat)', { cat: query.category });
    }

    if (typeof query.minPrice === 'number') {
      qb.andWhere('p.price >= :min', { min: query.minPrice });
    }

    if (typeof query.maxPrice === 'number') {
      qb.andWhere('p.price <= :max', { max: query.maxPrice });
    }

    // ✅ sorting
    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.price', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('p.createdAt', 'DESC');
        break;
    }

    // ✅ ensure images ordered (primary first, then position)
    qb.addOrderBy('images.isPrimary', 'DESC').addOrderBy(
      'images.position',
      'ASC',
    );

    const data = await qb.getMany();
    return { data };
  }

  // ✅ PUBLIC: Best Sellers (temporary = newest)
  async getBestSellers(limit = 6) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.categories', 'c')
      .where('p.isActive = true')
      .orderBy('p.createdAt', 'DESC')
      .addOrderBy('images.isPrimary', 'DESC')
      .addOrderBy('images.position', 'ASC')
      .take(limit);

    const data = await qb.getMany();
    return { data };
  }

  // ✅ PUBLIC: Get by slug (resilient + isActive + trims DB slug)
  async getPublicBySlug(slug: string) {
    const s = this.normalizeSlug(slug);

    console.log(
      '[getPublicBySlug]',
      JSON.stringify({ raw: slug, normalized: s }),
    );

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.categories', 'categories')
      .where('p.isActive = true')
      .andWhere('TRIM(LOWER(p.slug)) = :s', { s })
      .addOrderBy('images.isPrimary', 'DESC')
      .addOrderBy('images.position', 'ASC');

    const product = await qb.getOne();

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getPublicById(id: string) {
    const p = await this.productRepo.findOne({
      where: { id, isActive: true } as any,
      relations: ['images', 'categories'],
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  // ===== ADMIN =====
  async findAllAdmin(query: {
    category?: string;
    search?: string;
    isActive?: boolean;
    stockMin?: number;
    stockMax?: number;
  }) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.categories', 'c');

    if (query.search) {
      qb.andWhere('(p.name ILIKE :s OR p.slug ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    if (query.category) {
      qb.andWhere('(c.slug = :cat OR c.name = :cat)', { cat: query.category });
    }

    if (typeof query.isActive === 'boolean') {
      qb.andWhere('p.isActive = :a', { a: query.isActive });
    }

    if (typeof query.stockMin === 'number') {
      qb.andWhere('p.stockQuantity >= :min', { min: query.stockMin });
    }

    if (typeof query.stockMax === 'number') {
      qb.andWhere('p.stockQuantity <= :max', { max: query.stockMax });
    }

    qb.orderBy('p.createdAt', 'DESC')
      .addOrderBy('images.isPrimary', 'DESC')
      .addOrderBy('images.position', 'ASC');

    const data = await qb.getMany();
    return { data };
  }

  async findOneById(id: string) {
    const p = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.categories', 'c')
      .where('p.id = :id', { id })
      .addOrderBy('images.isPrimary', 'DESC')
      .addOrderBy('images.position', 'ASC')
      .getOne();

    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async createAdminProduct(dto: CreateProductDto) {
    return this.create(dto);
  }

  async updateAdminProduct(id: string, dto: UpdateProductDto) {
    return this.update(id, dto);
  }

  async deleteAdminProduct(id: string) {
    await this.remove(id);
    return { success: true };
  }

  // ===========================
  // CREATE (✅ includes salePrice)
  // ===========================
  async create(dto: CreateProductDto) {
    const categories = dto.categoryIds?.length
      ? await this.categoryRepo.find({
          where: { id: In(dto.categoryIds) } as any,
        })
      : [];

    const normalizedSlug = (dto.slug ?? '').trim().toLowerCase();
    if (!normalizedSlug) throw new BadRequestException('Slug is required');

    // ✅ Sale validation
    if (dto.salePrice != null && dto.salePrice >= dto.price) {
      throw new BadRequestException('Sale price must be lower than price');
    }

    const p = this.productRepo.create({
      name: dto.name,
      slug: normalizedSlug,
      description: dto.description ?? null,
      price: dto.price,
      salePrice: dto.salePrice ?? null, // ✅ ADDED
      currency: dto.currency ?? 'USD',
      sku: dto.sku ?? null,
      stockQuantity: dto.stockQuantity ?? 0,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? null,
      categories,
    } as any);

    return this.productRepo.save(p);
  }

  // ===========================
  // UPDATE (✅ includes salePrice)
  // ===========================
  async update(id: string, dto: UpdateProductDto) {
    const p = await this.findOneById(id);

    if (dto.categoryIds) {
      const categories = dto.categoryIds.length
        ? await this.categoryRepo.find({
            where: { id: In(dto.categoryIds) } as any,
          })
        : [];
      (p as any).categories = categories;
    }

    const normalizedSlug =
      typeof dto.slug === 'string' ? dto.slug.trim().toLowerCase() : undefined;

    const nextPrice =
      typeof dto.price === 'number' ? dto.price : (p as any).price;

    // ✅ Sale validation on update
    if (typeof dto.salePrice === 'number' && dto.salePrice >= nextPrice) {
      throw new BadRequestException('Sale price must be lower than price');
    }

    Object.assign(p as any, {
      name: dto.name ?? (p as any).name,
      slug: normalizedSlug ?? (p as any).slug,
      description: dto.description ?? (p as any).description,
      price: typeof dto.price === 'number' ? dto.price : (p as any).price,

      // ✅ SALE PRICE LOGIC (number = set, null = remove, undefined = keep)
      salePrice:
        typeof dto.salePrice === 'number'
          ? dto.salePrice
          : dto.salePrice === null
          ? null
          : (p as any).salePrice,

      currency: dto.currency ?? (p as any).currency,
      sku: dto.sku ?? (p as any).sku,
      stockQuantity:
        typeof dto.stockQuantity === 'number'
          ? dto.stockQuantity
          : (p as any).stockQuantity,
      isActive:
        typeof dto.isActive === 'boolean' ? dto.isActive : (p as any).isActive,
      metadata: dto.metadata ?? (p as any).metadata,
    });

    return this.productRepo.save(p);
  }

  // ✅ Upload handler save (BACKEND CONTROLS primary + position)
  async addImageToProduct(
    productId: string,
    payload: {
      url: string;
      altText?: string | null;
      isPrimary?: boolean; // ignored
      position?: number; // ignored
    },
  ) {
    const p = await this.findOneById(productId);

    // ✅ count using productId column directly (reliable)
    const existingCount = await this.productImageRepo.count({
      where: { productId } as any,
    });

    const computedIsPrimary = existingCount === 0;
    const computedPosition = existingCount;

    // ✅ If first image => reset any existing primary (safety)
    if (computedIsPrimary) {
      await this.productImageRepo.update(
        { productId } as any,
        { isPrimary: false },
      );
    }

    // ✅ IMPORTANT FIX: set productId explicitly (NOT NULL column)
    const img = this.productImageRepo.create({
      productId, // ✅ MUST
      product: p,
      url: payload.url,
      altText: payload.altText ?? null,
      position: computedPosition,
      isPrimary: computedIsPrimary,
    });

    const saved = await this.productImageRepo.save(img);

    // ✅ update product.imageUrl to match first primary
    if (computedIsPrimary && !(p as any).imageUrl) {
      (p as any).imageUrl = saved.url;
      await this.productRepo.save(p);
    }

    // ✅ return updated product with relations
    return this.productRepo.findOne({
      where: { id: productId } as any,
      relations: ['images', 'categories'],
    });
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const img = await this.productImageRepo.findOne({
      where: { id: imageId } as any,
      relations: ['product'],
    });

    if (!img || (img.product as any)?.id !== productId) {
      throw new NotFoundException('Image not found');
    }

    await this.productImageRepo.update(
      { productId } as any,
      { isPrimary: false },
    );
    await this.productImageRepo.update(
      { id: imageId } as any,
      { isPrimary: true },
    );

    // ✅ update product.imageUrl to match primary
    (img.product as any).imageUrl = img.url;
    await this.productRepo.save(img.product);

    return { success: true };
  }

  // ✅ remove product + delete images from DB + delete files from disk
  async remove(id: string) {
    const p = await this.productRepo.findOne({
      where: { id } as any,
      relations: ['images'],
    });
    if (!p) throw new NotFoundException('Product not found');

    // delete files (optional but recommended)
    for (const img of (p as any).images ?? []) {
      const url: string = img.url;
      if (url?.startsWith('/uploads/')) {
        const rel = url.replace(/^\//, '');
        const full = path.join(process.cwd(), rel);
        try {
          if (fs.existsSync(full)) fs.unlinkSync(full);
        } catch {}
      }
    }

    // ✅ delete image rows first (safe + reliable)
    await this.productImageRepo.delete({ productId: id } as any);

    // then delete product
    await this.productRepo.delete({ id } as any);
  }
}