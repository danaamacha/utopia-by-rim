import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { Product } from '../products/product.entity';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAllByProduct(productId: string): Promise<ProductImage[]> {
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.imageRepo.find({
      where: { product: { id: productId } },
      order: { isPrimary: 'DESC', position: 'ASC' },
    });
  }

  async create(
    productId: string,
    dto: CreateProductImageDto,
  ): Promise<ProductImage> {
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const image = this.imageRepo.create({
      product,
      url: dto.url,
      altText: dto.altText ?? null,
      position: dto.position ?? 0,
      isPrimary: dto.isPrimary ?? false,
    });

    // If this image is set as primary, unset all other primary images for this product
    if (dto.isPrimary) {
      await this.imageRepo.update(
        { product: { id: productId }, isPrimary: true },
        { isPrimary: false },
      );
    }

    return this.imageRepo.save(image);
  }

  async update(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const image = await this.imageRepo.findOne({
      where: { id: imageId, product: { id: productId } },
    });

    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    if (dto.url !== undefined) image.url = dto.url;
    if (dto.altText !== undefined) image.altText = dto.altText;
    if (dto.position !== undefined) image.position = dto.position;

    // Handle primary flag: if setting to true, unset others
    if (dto.isPrimary === true) {
      await this.imageRepo.update(
        { product: { id: productId }, isPrimary: true },
        { isPrimary: false },
      );
      image.isPrimary = true;
    } else if (dto.isPrimary === false) {
      image.isPrimary = false;
    }

    return this.imageRepo.save(image);
  }

  async remove(productId: string, imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({
      where: { id: imageId, product: { id: productId } },
    });

    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    await this.imageRepo.remove(image);
  }
}

