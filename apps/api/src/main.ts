import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Type-safe environment variable parsing
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${process.env.PORT}`);
  }

  await app.listen(port);
}
void bootstrap();
