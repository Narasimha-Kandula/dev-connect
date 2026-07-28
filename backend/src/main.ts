import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'RESEND_API_KEY',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    logger.fatal(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET!.includes('replace-with') || process.env.JWT_SECRET!.length < 32) {
    logger.fatal('JWT_SECRET must be a secure randomly-generated string (min 32 chars). Generate one with: openssl rand -hex 32');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { cors: false });

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api/v1');

  app.getHttpServer().on('listening', () => {
    logger.log(`DevConnect API running on port ${process.env.PORT ?? 4000}`);
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
