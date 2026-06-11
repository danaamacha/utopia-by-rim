import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAllActive(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async findAllAdmin(): Promise<Category[]> {
    return this.categoryRepo.find({
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async findOneBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    // Check if slug already exists
    const existing = await this.categoryRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        `Category with slug "${dto.slug}" already exists`,
      );
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
      position: dto.position ?? 0,
    });

    if (dto.parentId) {
      category.parent = await this.categoryRepo.findOneBy({ id: dto.parentId });
    }

    try {
      return await this.categoryRepo.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('duplicate key')
      ) {
        throw new ConflictException(
          `Category with slug "${dto.slug}" already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    if (dto.position !== undefined) category.position = dto.position;

    if (dto.parentId !== undefined) {
      category.parent = await this.categoryRepo.findOneBy({
        id: dto.parentId,
      });
    }

    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryRepo.remove(category);
  }
}


