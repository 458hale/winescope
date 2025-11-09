import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CrawlerModule } from '../src/crawler.module';
import { CrawlerExceptionFilter } from '../src/presentation/filters/crawler-exception.filter';
import { CrawlerPort } from '../src/domain/ports/crawler.port';
import { ParserPort, WineData } from '../src/domain/ports/parser.port';
import { Wine } from '../src/domain/entities/wine.entity';
import { Rating } from '../src/domain/entities/rating.entity';
import { Price } from '../src/domain/entities/price.entity';
import { WineName } from '../src/domain/value-objects/wine-name.vo';
import { Vintage } from '../src/domain/value-objects/vintage.vo';
import { Score } from '../src/domain/value-objects/score.vo';
import {
  NetworkError,
  TimeoutError,
  ParsingError,
} from '../src/domain/errors/crawler.errors';

describe('Wine Search E2E Tests', () => {
  let app: INestApplication;
  let mockCrawler: jest.Mocked<CrawlerPort>;
  let mockParser: jest.Mocked<ParserPort>;

  const mockWineData: WineData = {
    wine: new Wine(
      WineName.create('Opus One 2018'),
      'Napa Valley',
      'Opus One',
      'Cabernet Sauvignon',
      Vintage.create(2018),
    ),
    ratings: [
      new Rating('Robert Parker', Score.create(96), 'Robert Parker', 1500),
      new Rating('Wine Spectator', Score.create(95), null, 800),
    ],
    price: new Price(300, 'USD', '$280-$320', new Date('2025-01-15')),
    sourceUrl: 'https://www.wine-searcher.com/find/opus+one+2018',
    crawledAt: new Date('2025-11-09T12:00:00Z'),
  };

  beforeEach(async () => {
    // Create mock implementations
    mockCrawler = {
      fetch: jest.fn(),
    };

    mockParser = {
      parse: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CrawlerModule],
    })
      .overrideProvider('CrawlerPort')
      .useValue(mockCrawler)
      .overrideProvider('ParserPort')
      .useValue(mockParser)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same middleware as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new CrawlerExceptionFilter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /wines/search', () => {
    it('should successfully search wine with valid input', async () => {
      // Mock successful crawl and parse
      mockCrawler.fetch.mockResolvedValue('<html>mock html</html>');
      mockParser.parse.mockResolvedValue(mockWineData);

      const server = app.getHttpServer() as never;
      const response = await request(server)
        .post('/wines/search')
        .send({
          winery: 'Opus One',
          variety: 'Cabernet Sauvignon',
          vintage: 2018,
          region: 'Napa Valley',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        wine: {
          name: 'Opus One 2018',
          region: 'Napa Valley',
          winery: 'Opus One',
          variety: 'Cabernet Sauvignon',
          vintage: 2018,
        },
        ratings: [
          {
            source: 'Robert Parker',
            score: 96,
            critic: 'Robert Parker',
            reviewCount: 1500,
          },
          {
            source: 'Wine Spectator',
            score: 95,
            critic: null,
            reviewCount: 800,
          },
        ],
        price: {
          average: 300,
          currency: 'USD',
          priceRange: '$280-$320',
          updatedAt: '2025-01-15T00:00:00.000Z',
        },
        source: {
          site: 'Wine-Searcher',
          url: 'https://www.wine-searcher.com/find/opus+one+2018',
          crawledAt: '2025-11-09T12:00:00.000Z',
        },
      });

      // Verify crawler was called
      expect(mockCrawler.fetch).toHaveBeenCalled();
      const fetchUrl = mockCrawler.fetch.mock.calls[0][0];
      expect(fetchUrl).toContain('wine-searcher.com/find/');
      expect(fetchUrl).toContain('opus');
      expect(fetchUrl).toContain('2018');

      // Verify parser was called
      expect(mockParser.parse).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        // Missing: variety, vintage, region
      });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
      // ValidationPipe returns "BadRequestException"
      expect(response.body.error).toBe('BadRequestException');
    });

    it('should return 400 for invalid vintage year', async () => {
      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 1800, // Too old
        region: 'Napa Valley',
      });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for vintage too far in future', async () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 10;

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: futureYear,
        region: 'Napa Valley',
      });

      expect(response.status).toBe(400);
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid field types', async () => {
      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 'not-a-number', // Should be number
        region: 'Napa Valley',
      });

      expect(response.status).toBe(400);
    });

    it('should return 504 for timeout errors', async () => {
      mockCrawler.fetch.mockRejectedValue(
        new TimeoutError('Request timed out', 'https://example.com', 5000),
      );

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
        region: 'Napa Valley',
      });

      expect(response.status).toBe(504);
      expect(response.body.error).toBe('Gateway Timeout');
    });

    it('should return 502 for network errors', async () => {
      mockCrawler.fetch.mockRejectedValue(
        new NetworkError('Connection failed', 'https://example.com'),
      );

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
        region: 'Napa Valley',
      });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Bad Gateway');
    });

    it('should return 404 for wine not found errors', async () => {
      mockCrawler.fetch.mockRejectedValue(
        new NetworkError('404 not found', 'https://example.com'),
      );

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Unknown Winery',
        variety: 'Unknown Variety',
        vintage: 2018,
        region: 'Unknown Region',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 500 for parsing errors', async () => {
      mockCrawler.fetch.mockResolvedValue('<html>invalid html</html>');
      mockParser.parse.mockRejectedValue(
        new ParsingError('Failed to parse', 'https://example.com'),
      );

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
        region: 'Napa Valley',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle wine data without price', async () => {
      const wineDataWithoutPrice: WineData = {
        ...mockWineData,
        price: null,
      };

      mockCrawler.fetch.mockResolvedValue('<html>mock html</html>');
      mockParser.parse.mockResolvedValue(wineDataWithoutPrice);

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
        region: 'Napa Valley',
      });

      expect(response.status).toBe(200);
      expect(response.body.price).toBeNull();
    });

    it('should strip whitelist-invalid fields from request', async () => {
      mockCrawler.fetch.mockResolvedValue('<html>mock html</html>');
      mockParser.parse.mockResolvedValue(mockWineData);

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
        region: 'Napa Valley',
        extraField: 'should be removed', // Not in DTO
      });

      expect(response.status).toBe(400); // forbidNonWhitelisted: true
    });

    it('should accept numeric vintage', async () => {
      mockCrawler.fetch.mockResolvedValue('<html>mock html</html>');
      mockParser.parse.mockResolvedValue(mockWineData);

      const server = app.getHttpServer() as never;
      const response = await request(server).post('/wines/search').send({
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018, // Numeric vintage
        region: 'Napa Valley',
      });

      expect(response.status).toBe(200);
    });
  });
});
