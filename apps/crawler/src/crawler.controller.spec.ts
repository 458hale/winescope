import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

describe('CrawlerController', () => {
  let crawlerController: CrawlerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerController],
      providers: [CrawlerService],
    }).compile();

    crawlerController = app.get<CrawlerController>(CrawlerController);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = crawlerController.health();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'crawler');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
