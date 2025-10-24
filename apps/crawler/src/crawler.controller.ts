import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlRequest, CrawlResponse } from '@winescope/contracts/crawler';

@Controller('crawl')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async crawl(@Body() request: CrawlRequest): Promise<CrawlResponse> {
    return this.crawlerService.crawl(request);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date(),
      service: 'crawler',
    };
  }
}
