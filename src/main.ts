import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DEFAULT_CORS_ORIGIN = 'http://localhost:4200';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? DEFAULT_CORS_ORIGIN,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
