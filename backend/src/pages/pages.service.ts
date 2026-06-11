// backend/src/pages/pages.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SitePage } from './site-page.entity';
import { UpdatePageDto } from './dto/update-page.dto';

const VALID_SLUGS = ['home', 'about', 'contact', 'faq', 'legal'] as const;
type PageSlug = (typeof VALID_SLUGS)[number];

const DEFAULTS: Record<PageSlug, Record<string, unknown>> = {
  home: {
    heroTitle: 'Handmade resin art for your dream space.',
    heroSubtitle: 'Unique, custom-made pieces crafted with love in Lebanon.',
    heroTagline: 'Highlight a main message or promo here.',
    heroButtonLabel: 'Shop now',
  },
  about: {
    title: 'About Utopia by Rim',
    body: 'Write your brand story here.',
  },
  contact: {
    title: 'Contact',
    email: 'hello@utopiabyrim.com',
    phone: '+961 70 000 000',
    whatsapp: '+961 70 000 000',
    address: 'Beirut, Lebanon',
    note: '',
  },
  faq: {
    intro: 'Answer common questions here.',
    content: '',
  },
  legal: {
    title: 'Terms & Conditions',
    content: '',
  },
};

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(SitePage)
    private readonly pageRepo: Repository<SitePage>,
  ) {}

  async getAllPages(): Promise<Record<PageSlug, Record<string, unknown>>> {
    const rows = await this.pageRepo.find();
    const map = new Map(rows.map((r) => [r.slug, r.content]));
    return Object.fromEntries(
      VALID_SLUGS.map((slug) => [
        slug,
        { ...DEFAULTS[slug], ...(map.get(slug) ?? {}) },
      ]),
    ) as Record<PageSlug, Record<string, unknown>>;
  }

  async getPage(slug: string): Promise<Record<string, unknown>> {
    this.assertValidSlug(slug);
    const row = await this.pageRepo.findOne({ where: { slug } });
    return { ...DEFAULTS[slug as PageSlug], ...(row?.content ?? {}) };
  }

  async upsertPage(slug: string, dto: UpdatePageDto): Promise<Record<string, unknown>> {
    this.assertValidSlug(slug);

    this.logger.log(`upsertPage called: slug=${slug}`);
    this.logger.log(`incoming content: ${JSON.stringify(dto.content)}`);

    // Use raw query to guarantee the write — bypasses TypeORM JSONB detection
    const result = await this.pageRepo.query(
      `INSERT INTO site_pages (slug, content, "updatedAt")
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (slug)
       DO UPDATE SET content = $2::jsonb, "updatedAt" = NOW()
       RETURNING *`,
      [slug, JSON.stringify(dto.content)],
    );

    this.logger.log(`upsert result: ${JSON.stringify(result)}`);

    // Return shape: { content: { field: value, ... } }
    const pageContent = await this.getPage(slug);
    return { slug, content: pageContent };
  }

  private assertValidSlug(slug: string): void {
    if (!VALID_SLUGS.includes(slug as PageSlug)) {
      throw new NotFoundException(`Page "${slug}" not found`);
    }
  }
}