import { Module } from '@nestjs/common';
import { WineController } from './controllers/wine.controller';
import { SearchWineUseCase } from '../application/use-cases/search-wine.use-case';
import { CurlCrawlerAdapter } from '../infrastructure/adapters/curl-crawler.adapter';
import { WineSearcherParser } from '../infrastructure/parsers/wine-searcher.parser';

/**
 * WineModule
 *
 * Wine 검색 기능을 위한 모듈입니다.
 * Hexagonal Architecture의 DI 설정을 담당합니다.
 */
@Module({
  controllers: [WineController],
  providers: [
    // Use Cases
    SearchWineUseCase,

    // Infrastructure Adapters (Port 구현체)
    {
      provide: 'CrawlerPort',
      useClass: CurlCrawlerAdapter,
    },
    {
      provide: 'ParserPort',
      useClass: WineSearcherParser,
    },
  ],
  exports: [SearchWineUseCase],
})
export class WineModule {}
