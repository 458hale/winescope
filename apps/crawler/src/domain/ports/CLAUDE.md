# Domain Ports

Infrastructure 계층의 구현체와 Domain 계층을 연결하는 인터페이스들입니다.

## 파일 구조

```
ports/
├── crawler.port.ts       # HTTP 크롤링 포트
├── parser.port.ts        # HTML 파싱 포트
└── index.ts             # 중앙 export
```

## Hexagonal Architecture

### Port & Adapter 패턴

```
Domain (Port Interface) ← Infrastructure (Adapter Implementation)
```

**Port**: Domain이 정의하는 계약 (interface)
**Adapter**: Infrastructure가 제공하는 구현체 (class)

### 의존성 역전

Domain이 구체적인 구현에 의존하지 않고, 인터페이스만 정의합니다.

```typescript
// ✅ Domain: 인터페이스 정의
export interface CrawlerPort {
  fetch(url: string): Promise<string>;
}

// ✅ Infrastructure: 구현
export class CurlCrawlerAdapter implements CrawlerPort {
  async fetch(url: string): Promise<string> { ... }
}

// ✅ Application: Port 주입
constructor(@Inject('CrawlerPort') crawler: CrawlerPort)
```

## CrawlerPort

**용도**: HTTP 요청으로 HTML을 가져오는 포트입니다.

### 인터페이스

```typescript
interface CrawlerPort {
  fetch(url: string, options?: CrawlOptions): Promise<string>;
}
```

### CrawlOptions

```typescript
interface CrawlOptions {
  browser?: 'chrome116' | 'chrome110' | 'firefox109';
  timeout?: number;                    // 기본값: 5000ms
  headers?: Record<string, string>;
  userAgent?: string;
}
```

### 구현체

- **CurlCrawlerAdapter**: curl-impersonate 기반 (기본)
- **AxiosCrawlerAdapter**: axios 기반 (예시)
- **PuppeteerCrawlerAdapter**: Puppeteer 기반 (예시)

### 에러

- `NetworkError`: 네트워크 오류
- `TimeoutError`: 타임아웃

### 사용 예시

```typescript
const html = await crawler.fetch(
  'https://wine-searcher.com/find/...',
  { browser: 'chrome116', timeout: 5000 }
);
```

## ParserPort

**용도**: HTML을 파싱하여 도메인 모델로 변환하는 포트입니다.

### 인터페이스

```typescript
interface ParserPort {
  parse(html: string, sourceUrl: string): Promise<WineData>;
}
```

### WineData

```typescript
interface WineData {
  wine: Wine;              // Wine 엔티티
  ratings: Rating[];       // Rating 배열
  price: Price | null;     // Price (선택적)
  sourceUrl: string;       // 원본 URL
  crawledAt: Date;         // 크롤링 시각
}
```

### 구현체

- **WineSearcherParser**: Wine-Searcher 전용 (cheerio 기반)
- **VivinoParser**: Vivino 전용 (예시)

### 에러

- `ParsingError`: 파싱 실패

### 사용 예시

```typescript
const wineData = await parser.parse(html, sourceUrl);
console.log(wineData.wine.name.value);
console.log(wineData.ratings.length);
```

## Port 설계 원칙

### 1. Domain이 정의

Port는 Domain 계층에 위치하며, Domain의 요구사항을 표현합니다.

```typescript
// ✅ Domain이 필요로 하는 것 정의
interface CrawlerPort {
  fetch(url: string): Promise<string>;
}

// ❌ Infrastructure 구현 세부사항 노출
interface CrawlerPort {
  fetchWithCurl(url: string): Promise<string>;  // curl 구현 강제
}
```

### 2. 구현 독립적

Port는 특정 기술이나 라이브러리에 종속되지 않습니다.

```typescript
// ✅ Good: 기술 중립적
interface CrawlerPort {
  fetch(url: string): Promise<string>;
}

// ❌ Bad: axios 종속
import { AxiosRequestConfig } from 'axios';
interface CrawlerPort {
  fetch(url: string, config: AxiosRequestConfig): Promise<string>;
}
```

### 3. 단일 책임

각 Port는 하나의 명확한 책임을 가집니다.

- CrawlerPort: HTTP 크롤링만
- ParserPort: HTML 파싱만

### 4. I Prefix 금지

TypeScript/NestJS 컨벤션에 따라 `I` prefix를 사용하지 않습니다.

```typescript
// ✅ Good
export interface CrawlerPort { ... }

// ❌ Bad (C# 스타일)
export interface ICrawlerPort { ... }
```

## 의존성 주입

### Provider 등록

```typescript
@Module({
  providers: [
    { provide: 'CrawlerPort', useClass: CurlCrawlerAdapter },
    { provide: 'ParserPort', useClass: WineSearcherParser },
  ],
})
```

### Use Case 주입

```typescript
@Injectable()
export class SearchWineUseCase {
  constructor(
    @Inject('CrawlerPort') private readonly crawler: CrawlerPort,
    @Inject('ParserPort') private readonly parser: ParserPort,
  ) {}
}
```

### 구현체 교체

Port 덕분에 구현체를 쉽게 교체할 수 있습니다.

```typescript
// 개발 환경: Mock Adapter
{ provide: 'CrawlerPort', useClass: MockCrawlerAdapter }

// 프로덕션: 실제 Adapter
{ provide: 'CrawlerPort', useClass: CurlCrawlerAdapter }
```

## 테스트

### Port Mock

```typescript
const mockCrawler: CrawlerPort = {
  fetch: jest.fn().mockResolvedValue('<html>...</html>'),
};

const mockParser: ParserPort = {
  parse: jest.fn().mockResolvedValue(mockWineData),
};

const useCase = new SearchWineUseCase(mockCrawler, mockParser);
```

### 구현체 테스트

```typescript
describe('CurlCrawlerAdapter', () => {
  let adapter: CrawlerPort;  // Port 타입으로 테스트

  beforeEach(() => {
    adapter = new CurlCrawlerAdapter();
  });

  it('HTML을 반환한다', async () => {
    const html = await adapter.fetch('https://example.com');
    expect(typeof html).toBe('string');
  });
});
```

## 확장 가이드

### 새 Port 추가

1. `ports/` 디렉토리에 인터페이스 파일 생성
2. Port 인터페이스 정의 (Domain 요구사항 표현)
3. `ports/index.ts`에 export 추가
4. Infrastructure에 Adapter 구현
5. Module에 Provider 등록
6. Use Case에서 주입 사용

### 예시: CachePort

```typescript
// ports/cache.port.ts
export interface CachePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// infrastructure/adapters/redis-cache.adapter.ts
@Injectable()
export class RedisCacheAdapter implements CachePort {
  async get(key: string): Promise<string | null> {
    // Redis 구현
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    // Redis 구현
  }

  async delete(key: string): Promise<void> {
    // Redis 구현
  }
}

// Module
providers: [
  { provide: 'CachePort', useClass: RedisCacheAdapter },
]
```
