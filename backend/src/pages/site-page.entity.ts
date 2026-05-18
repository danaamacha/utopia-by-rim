// backend/src/pages/site-page.entity.ts
import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One row per page slug (home, about, contact, faq, legal).
 * Content is stored as JSONB so each page can have its own fields
 * without needing schema migrations every time copy changes.
 */
@Entity('site_pages')
export class SitePage {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  slug: string;

  @Column({ type: 'jsonb', default: {} })
  content: Record<string, unknown>;

  @UpdateDateColumn()
  updatedAt: Date;
}