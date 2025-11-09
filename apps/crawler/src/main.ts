import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CrawlerModule } from './crawler.module';
import { CrawlerExceptionFilter } from './presentation/filters/crawler-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);

  // Enable CORS for API service
  app.enableCors();

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter for error handling
  app.useGlobalFilters(new CrawlerExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Crawler Service is running on: http://localhost:${port}`);
}
void bootstrap();
