import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

function safeFileName(originalName: string) {
  const base = originalName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_\.]/g, "")
    .toLowerCase();
  const ext = extname(base) || ".jpg";
  const name = base.replace(ext, "");
  return { name, ext };
}

@Controller("uploads")
export class UploadsController {
  @Post("products")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/products",
        filename: (req, file, cb) => {
          const { name, ext } = safeFileName(file.originalname);
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${name || "product"}-${unique}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(new BadRequestException("Only image files are allowed."), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    })
  )
  uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded.");

    // IMPORTANT: this URL is what frontend should store in DB
    return { url: `/uploads/products/${file.filename}` };
  }
}
