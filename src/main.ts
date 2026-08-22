import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DEFAULT_CORS_ORIGIN = 'http://localhost:4200';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Detrás de un reverse proxy (Nginx en Lightsail): sin esto, Express ve
  // como IP de cada request la del proxy (127.0.0.1) y no la del cliente
  // real, lo que rompe el rate limiting por IP (@nestjs/throttler) — todo el
  // tráfico caería en el mismo balde. "1" = confiar en un solo hop de proxy
  // (el de Nginx, que ya manda X-Forwarded-For).
  app.set('trust proxy', 1);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? DEFAULT_CORS_ORIGIN,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
