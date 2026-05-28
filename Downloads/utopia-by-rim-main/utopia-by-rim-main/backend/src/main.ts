import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  /**
   * ======================================
   * ✅ GLOBAL API PREFIX
   * ======================================
   * All routes become:
   * http://localhost:3001/api/....
   */
  app.setGlobalPrefix('api');

  /**
   * ======================================
   * ✅ STATIC UPLOADS FOLDER
   * ======================================
   * Files stored in:
   * /uploads/products/....
   *
   * Accessible via:
   * http://localhost:3001/uploads/....
   */
  const uploadsDir = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  /**
   * ======================================
   * ✅ CORS CONFIGURATION
   * ======================================
   * - credentials: true  → allows Authorization header cookies
   * - methods            → explicitly allow PATCH for status updates
   * - allowedHeaders     → required for JWT Bearer token
   */
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://utopiabyrim.com',
      'https://www.utopiabyrim.com',
      'https://utopia-by-rim-front.onrender.com',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  /**
   * ======================================
   * ✅ GLOBAL VALIDATION PIPE
   * ======================================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) =>
        new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors,
          },
          HttpStatus.BAD_REQUEST,
        ),
    }),
  );

  /**
   * ======================================
   * ✅ GLOBAL EXCEPTION FILTER
   * ======================================
   */
  app.useGlobalFilters(new AllExceptionsFilter());

  /**
   * ======================================
   * ✅ START SERVER
   * ======================================
   */
  const port = config.get<number>('PORT') || 3001;

  await app.listen(port);

  console.log(`🚀 Utopia backend running on http://localhost:${port}/api`);
  console.log(`📂 Uploads available at http://localhost:${port}/uploads`);
}

bootstrap();