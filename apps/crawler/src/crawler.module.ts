import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { WineModule } from './presentation/wine.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Feature modules
    WineModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
