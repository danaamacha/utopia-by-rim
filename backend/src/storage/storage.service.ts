// backend/src/storage/storage.service.ts
// Thin wrapper around Supabase Storage for product images.
// The client is created lazily so a missing env var fails the upload
// request with a clear message instead of crashing app boot.
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private get bucket(): string {
    return this.config.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new InternalServerErrorException(
        'Image storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)',
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
    return this.client;
  }

  /** Upload an image buffer; returns the permanent public URL. */
  async uploadProductImage(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
  ): Promise<string> {
    const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
    const ext = extname(originalName || '').toLowerCase();
    const safeExt = allowedExt.has(ext) ? ext : '.jpg';
    const path = `products/${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;

    const { error } = await this.getClient()
      .storage.from(this.bucket)
      .upload(path, buffer, { contentType: mimetype, upsert: false });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw new InternalServerErrorException('Image upload failed');
    }

    const { data } = this.getClient().storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Best-effort delete of a Supabase-hosted image by its public URL.
   * URLs from other origins (e.g. legacy /uploads/ paths) are ignored.
   * Never throws — file cleanup must not block DB operations.
   */
  async deleteByPublicUrl(url: string): Promise<void> {
    try {
      const marker = `/storage/v1/object/public/${this.bucket}/`;
      const idx = url?.indexOf(marker) ?? -1;
      if (idx === -1) return;

      const path = decodeURIComponent(url.slice(idx + marker.length));
      const { error } = await this.getClient().storage.from(this.bucket).remove([path]);
      if (error) this.logger.warn(`Supabase delete failed for ${path}: ${error.message}`);
    } catch (e: any) {
      this.logger.warn(`Supabase delete skipped: ${e?.message ?? e}`);
    }
  }
}
