import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CrawlerModule } from './../src/crawler.module';

describe('CrawlerController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CrawlerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/crawl/health (GET)', async () => {
    const server = app.getHttpServer() as never;
    const response = await request(server).get('/crawl/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'crawler');
    expect(response.body).toHaveProperty('timestamp');
  });
});
