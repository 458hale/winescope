# CLAUDE.md - Crawler Application

This file provides guidance for working with the Crawler application in the WineScope monorepo.

## Application Overview

The Crawler application is a specialized microservice for web scraping wine data from various sources.

- **Framework**: NestJS v10.x (Microservice)
- **Language**: TypeScript 5.1+
- **Purpose**: Web crawling, data extraction, and wine information aggregation
- **Architecture**: Microservice pattern (can run independently or alongside API)

## Project Structure

```
apps/crawler/
├── src/
│   ├── main.ts                  # Application entry point
│   ├── crawler.module.ts        # Root module
│   ├── crawler.controller.ts    # Crawler controller (job management)
│   └── crawler.service.ts       # Crawler business logic
├── test/
│   └── crawler.e2e-spec.ts     # E2E test suite
├── Dockerfile                   # Docker configuration for Crawler service
└── tsconfig.app.json            # TypeScript config for this app
```

## Development Commands

All commands should be run from the **monorepo root** directory.

### Running the Crawler App

```bash
# Development mode with watch (from root)
pnpm run start:dev crawler

# Debug mode with watch
pnpm run start:debug crawler

# Production build
pnpm run build crawler

# Run production build
pnpm run start:prod crawler
```

### Testing

```bash
# Unit tests for Crawler app
pnpm run test crawler

# Unit tests in watch mode
pnpm run test:watch crawler

# E2E tests
pnpm run test:e2e crawler

# Test coverage
pnpm run test:cov crawler
```

## Docker

```bash
# Build Crawler service image
docker compose build crawler

# Run Crawler service only
docker compose up crawler

# Run Crawler with dependencies
docker compose up crawler rabbitmq redis
```

## Architecture

### Microservice Pattern

The Crawler app is designed as an independent microservice that can:

- Run as a standalone service
- Communicate with the API service via message queue (RabbitMQ/Redis)
- Process crawling jobs asynchronously
- Store results in shared database or message queue

### Module Organization

```
src/
├── crawlers/              # Different crawler implementations
│   ├── vivino.crawler.ts
│   ├── wine-searcher.crawler.ts
│   └── base.crawler.ts   # Abstract base crawler
├── parsers/              # HTML/Data parsers
│   ├── wine-parser.ts
│   └── review-parser.ts
├── queues/               # Job queue management
│   └── crawler-queue.ts
└── storage/              # Data storage adapters
    └── wine-storage.ts
```

### Crawler Interface

Define a consistent interface for all crawlers:

```typescript
export interface Crawler {
  crawl(url: string): Promise<CrawlResult>;
  parse(html: string): Promise<WineData>;
  validate(data: WineData): boolean;
}

export abstract class BaseCrawler implements Crawler {
  abstract crawl(url: string): Promise<CrawlResult>;
  abstract parse(html: string): Promise<WineData>;

  validate(data: WineData): boolean {
    // Common validation logic
    return !!data.name && !!data.vintage;
  }
}
```

## Crawler Implementation

### Basic Crawler Example

```typescript
@Injectable()
export class VivinoCrawler extends BaseCrawler {
  constructor(
    private readonly httpService: HttpService,
    private readonly parserService: ParserService,
  ) {
    super();
  }

  async crawl(url: string): Promise<CrawlResult> {
    try {
      const response = await this.httpService.get(url).toPromise();
      const wineData = await this.parse(response.data);

      if (this.validate(wineData)) {
        return { success: true, data: wineData };
      }

      return { success: false, error: 'Invalid data' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async parse(html: string): Promise<WineData> {
    // Implementation specific to Vivino structure
    const $ = cheerio.load(html);

    return {
      name: $('.wine-name').text().trim(),
      vintage: parseInt($('.wine-vintage').text()),
      rating: parseFloat($('.wine-rating').text()),
      price: parseFloat($('.wine-price').text()),
    };
  }
}
```

### Queue-Based Processing

```typescript
@Injectable()
export class CrawlerQueue {
  constructor(
    @InjectQueue('crawler') private crawlerQueue: Queue,
  ) {}

  async addCrawlJob(url: string, options?: CrawlOptions) {
    return this.crawlerQueue.add('crawl', {
      url,
      options,
      timestamp: new Date(),
    });
  }

  @Process('crawl')
  async processCrawlJob(job: Job<CrawlJobData>) {
    const { url, options } = job.data;
    const crawler = this.getCrawlerForUrl(url);
    const result = await crawler.crawl(url);

    if (result.success) {
      await this.storageService.save(result.data);
    }

    return result;
  }
}
```

## Best Practices

### Rate Limiting

Always implement rate limiting to avoid being blocked:

```typescript
@Injectable()
export class RateLimiter {
  private lastRequest = new Map<string, number>();
  private readonly minInterval = 1000; // 1 second between requests

  async throttle(domain: string): Promise<void> {
    const lastTime = this.lastRequest.get(domain) || 0;
    const elapsed = Date.now() - lastTime;

    if (elapsed < this.minInterval) {
      await this.sleep(this.minInterval - elapsed);
    }

    this.lastRequest.set(domain, Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Error Handling

```typescript
@Injectable()
export class CrawlerService {
  private readonly maxRetries = 3;

  async crawlWithRetry(url: string, retries = 0): Promise<CrawlResult> {
    try {
      return await this.crawler.crawl(url);
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.sleep(Math.pow(2, retries) * 1000); // Exponential backoff
        return this.crawlWithRetry(url, retries + 1);
      }

      throw new Error(`Failed after ${this.maxRetries} retries: ${error.message}`);
    }
  }
}
```

### User Agent Rotation

```typescript
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

@Injectable()
export class HttpClientService {
  getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async fetch(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
      },
    });
    return response.data;
  }
}
```

## Data Validation

### DTO Validation

```typescript
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class WineDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  vintage: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsNumber()
  @Min(0)
  price?: number;
}
```

## Environment Variables

```bash
# Crawler Configuration
CRAWLER_CONCURRENCY=5        # Max concurrent crawl jobs
CRAWLER_TIMEOUT=30000        # Request timeout (ms)
CRAWLER_RETRY_LIMIT=3        # Max retry attempts

# Rate Limiting
CRAWLER_RATE_LIMIT=1000      # Min interval between requests (ms)

# Queue Configuration (if using Bull/BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_NAME=crawler

# Proxy Configuration (optional)
PROXY_HOST=
PROXY_PORT=
```

## Common Libraries

### Web Scraping

- **axios**: HTTP client for making requests
- **cheerio**: jQuery-like HTML parsing
- **puppeteer**: Headless browser for dynamic content
- **playwright**: Modern browser automation

### Queue Management

- **@nestjs/bull**: Bull queue integration for NestJS
- **bullmq**: Modern Redis-based queue

### Data Processing

- **class-validator**: DTO validation
- **class-transformer**: Object transformation

## Testing

### Mock HTTP Requests

```typescript
describe('VivinoCrawler', () => {
  let crawler: VivinoCrawler;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VivinoCrawler,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    crawler = module.get<VivinoCrawler>(VivinoCrawler);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should parse wine data correctly', async () => {
    const mockHtml = '<div class="wine-name">Test Wine</div>';
    jest.spyOn(httpService, 'get').mockReturnValue(of({ data: mockHtml }));

    const result = await crawler.crawl('https://example.com');

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Wine');
  });
});
```

## Legal and Ethical Considerations

- **Respect robots.txt**: Always check and follow robots.txt rules
- **Rate limiting**: Don't overwhelm target servers
- **Terms of Service**: Review and comply with website ToS
- **Data privacy**: Handle scraped data responsibly
- **Copyright**: Respect intellectual property rights

## Related Documentation

- Root [CLAUDE.md](../../CLAUDE.md) - Monorepo guidelines
- [DOCKER.md](../../DOCKER.md) - Docker setup and deployment
- API app [CLAUDE.md](../api/CLAUDE.md) - API service documentation
