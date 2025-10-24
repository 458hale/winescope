import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);

  // Enable CORS for API service
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Crawler Service is running on: http://localhost:${port}`);
}
void bootstrap();
