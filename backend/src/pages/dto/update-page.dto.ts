// backend/src/pages/dto/update-page.dto.ts
import { IsObject } from 'class-validator';

export class UpdatePageDto {
  @IsObject()
  content: Record<string, unknown>;
}