# CLAUDE.md - Crawler Application

Crawler 애플리케이션 작업 시 참고할 문서입니다.

## 애플리케이션 개요

Wine-Searcher 사이트에서 와인 데이터를 크롤링하고 파싱하는 NestJS 마이크로서비스입니다.

- **Framework**: NestJS v10.x
- **Language**: TypeScript 5.1+
- **Architecture**: Hexagonal Architecture (Ports & Adapters)
- **HTTP Client**: curl-impersonate (브라우저 핑거프린트 위장)
- **HTML Parser**: cheerio (jQuery 기반 파서)

## 프로젝트 구조

```
apps/crawler/
├── src/
│   ├── domain/                   # 비즈니스 로직 계층
│   │   ├── entities/            # 엔티티 (Wine, Rating, Price)
│   │   ├── value-objects/       # 값 객체 (WineName, Vintage, Score)
│   │   ├── ports/               # 인터페이스 정의 (CrawlerPort, ParserPort)
│   │   └── errors/              # 도메인 에러 정의
│   ├── application/             # 애플리케이션 계층
│   │   ├── use-cases/           # 유스케이스 (SearchWineUseCase)
│   │   └── dto/                 # 요청/응답 DTO
│   ├── infrastructure/          # 인프라 계층
│   │   ├── adapters/            # 어댑터 구현 (CurlCrawlerAdapter)
│   │   └── parsers/             # 파서 구현 (WineSearcherParser)
│   ├── presentation/            # 프레젠테이션 계층
│   │   ├── controllers/         # HTTP 컨트롤러
│   │   └── filters/             # 예외 필터
│   └── main.ts                  # 애플리케이션 진입점 (포트 3001)
└── test/                        # E2E 테스트
```

## 개발 명령어

**모노레포 루트**에서 실행해야 합니다.

### 실행

```bash
# 개발 모드 (watch)
pnpm run start:dev crawler

# 디버그 모드
pnpm run start:debug crawler

# 프로덕션 빌드
pnpm run build crawler
pnpm run start:prod crawler
```

### 테스트

```bash
# 단위 테스트
pnpm --filter @winescope/crawler run test

# 단위 테스트 (watch)
pnpm --filter @winescope/crawler run test:watch

# E2E 테스트
pnpm --filter @winescope/crawler run test:e2e

# 커버리지
pnpm --filter @winescope/crawler run test:cov
```

### 코드 품질

```bash
# ESLint
pnpm --filter @winescope/crawler run lint

# 빌드 확인
pnpm --filter @winescope/crawler run build
```

## Hexagonal Architecture

### 계층 구조

```
Presentation → Application → Domain ← Infrastructure
(HTTP API)    (Use Cases)    (Core)    (Adapters)
```

### 의존성 방향

- **Domain**: 외부 의존성 없음 (순수 비즈니스 로직)
- **Application**: Domain에만 의존
- **Infrastructure**: Domain의 Port 인터페이스 구현
- **Presentation**: Application 계층 사용

### Port Interface 패턴

**CrawlerPort** ([domain/ports/crawler.port.ts](src/domain/ports/crawler.port.ts:34)):
```typescript
export interface CrawlerPort {
  fetch(url: string, options?: CrawlOptions): Promise<string>;
}
```

**ParserPort** ([domain/ports/parser.port.ts](src/domain/ports/parser.port.ts)):
```typescript
export interface ParserPort {
  parse(html: string, sourceUrl: string): Promise<WineData>;
}
```

**구현체**:
- [CurlCrawlerAdapter](src/infrastructure/adapters/curl-crawler.adapter.ts:16) - CrawlerPort 구현
- [WineSearcherParser](src/infrastructure/parsers/wine-searcher.parser.ts:20) - ParserPort 구현

## 핵심 도메인 모델

### Wine Entity

와인 정보를 나타내는 Aggregate Root ([domain/entities/wine.entity.ts](src/domain/entities/wine.entity.ts:10))

```typescript
class Wine {
  constructor(
    public readonly name: WineName,      // 와인 이름 (VO)
    public readonly region: string,      // 생산 지역
    public readonly winery: string,      // 와이너리
    public readonly variety: string,     // 품종
    public readonly vintage: Vintage,    // 빈티지 (VO)
  )
}
```

### Value Objects

불변 객체로 비즈니스 규칙 캡슐화:

- **WineName** ([domain/value-objects/wine-name.vo.ts](src/domain/value-objects/wine-name.vo.ts)): 1-200자, 빈 값 불가
- **Vintage** ([domain/value-objects/vintage.vo.ts](src/domain/value-objects/vintage.vo.ts)): 1900-현재 연도
- **Score** ([domain/value-objects/score.vo.ts](src/domain/value-objects/score.vo.ts)): 0-100점

### Rating & Price Entities

- **Rating** ([domain/entities/rating.entity.ts](src/domain/entities/rating.entity.ts)): 평점 정보 (출처, 점수, 평론가, 리뷰 수)
- **Price** ([domain/entities/price.entity.ts](src/domain/entities/price.entity.ts)): 가격 정보 (평균가, 통화, 범위, 갱신일)

## 데이터 흐름

### 1. HTTP 요청 수신

[WineController](src/presentation/controllers/wine.controller.ts:14) → `POST /wine/search`

```typescript
@Post('search')
async search(@Body() request: WineSearchRequestDto): Promise<WineSearchResponseDto>
```

### 2. Use Case 실행

[SearchWineUseCase.execute()](src/application/use-cases/search-wine.use-case.ts:28)

```typescript
async execute(request: WineSearchRequestDto): Promise<WineSearchResponseDto> {
  // 1. Wine-Searcher URL 생성
  const url = this.constructWineSearcherUrl(request);

  // 2. HTML 크롤링 (CrawlerPort)
  const html = await this.crawler.fetch(url, { browser: 'chrome116' });

  // 3. 데이터 파싱 (ParserPort)
  const wineData = await this.parser.parse(html, url);

  // 4. DTO 변환
  return this.mapToResponseDto(wineData);
}
```

### 3. HTTP 크롤링

[CurlCrawlerAdapter.fetch()](src/infrastructure/adapters/curl-crawler.adapter.ts:28)

```bash
# curl-impersonate 실행 예시
curl_chrome116 -s -L "https://www.wine-searcher.com/find/..." \
  --max-time 5
```

### 4. HTML 파싱

[WineSearcherParser.parse()](src/infrastructure/parsers/wine-searcher.parser.ts:31)

```typescript
async parse(html: string, sourceUrl: string): Promise<WineData> {
  const $ = cheerio.load(html);

  const wine = this.extractWine($);        // Wine 엔티티
  const ratings = this.extractRatings($);  // Rating 배열
  const price = this.extractPrice($);      // Price 엔티티

  return { wine, ratings, price, sourceUrl, crawledAt: new Date() };
}
```

## curl-impersonate 사용

### 브라우저 핑거프린트 위장

일반 curl은 봇으로 감지되므로 curl-impersonate 사용:

```bash
# 지원 브라우저
curl_chrome116   # Chrome 116 (기본값)
curl_chrome110   # Chrome 110
curl_firefox109  # Firefox 109
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

### 보안 고려사항

[escapeShellArg()](src/infrastructure/adapters/curl-crawler.adapter.ts:122) - Command Injection 방지

```typescript
private escapeShellArg(arg: string): string {
  return arg
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    // ... 특수문자 이스케이프
}
```

## 예외 처리

### 도메인 에러

[domain/errors/crawler.errors.ts](src/domain/errors/crawler.errors.ts)

- **NetworkError**: 네트워크 오류
- **TimeoutError**: 타임아웃
- **ParsingError**: HTML 파싱 실패

### 예외 필터

[CrawlerExceptionFilter](src/presentation/filters/crawler-exception.filter.ts) - 도메인 에러를 HTTP 응답으로 변환

```typescript
NetworkError  → 502 Bad Gateway
TimeoutError  → 504 Gateway Timeout
ParsingError  → 500 Internal Server Error
```

## 테스트 전략

### 단위 테스트

각 계층별 독립적 테스트:

- **Domain**: 엔티티, VO 비즈니스 규칙 검증
- **Application**: Use Case 로직 검증 (Port mock)
- **Infrastructure**: Adapter 구현 검증

### E2E 테스트

[test/wine.e2e-spec.ts](test/wine.e2e-spec.ts) - 실제 HTTP 요청 시뮬레이션

```typescript
it('POST /wine/search - 와인 검색 성공', async () => {
  const response = await request(app.getHttpServer())
    .post('/wine/search')
    .send({
      winery: 'Opus One',
      variety: 'Cabernet Sauvignon',
      vintage: 2018,
      region: 'Napa Valley',
    })
    .expect(201);

  expect(response.body).toHaveProperty('wine');
  expect(response.body).toHaveProperty('ratings');
});
```

### Test Doubles

- **Mock**: Port 인터페이스 (CrawlerPort, ParserPort)
- **Stub**: 고정 HTML 응답
- **Spy**: 메서드 호출 검증

## Wine-Searcher URL 패턴

### URL 생성 규칙

[constructWineSearcherUrl()](src/application/use-cases/search-wine.use-case.ts:65)

```
Pattern: /find/{winery}+{variety}+{vintage}+{region}

Input:  { winery: 'Opus One', variety: 'Cabernet', vintage: 2018, region: 'Napa' }
Output: https://www.wine-searcher.com/find/opus+one+cabernet+2018+napa
```

### 정규화 규칙

- 소문자 변환
- 공백 → `+`
- 특수문자 제거 (a-z, 0-9, + 만 허용)

## CSS 선택자 관리

[wine-searcher.selectors.ts](src/infrastructure/parsers/wine-searcher.selectors.ts) - CSS 선택자 중앙 관리

```typescript
export const WINE_SEARCHER_SELECTORS = {
  wine: {
    name: '.wine-name-selector',
    vintage: '.wine-vintage',
    region: '.wine-region',
    winery: '.winery-name',
    variety: '.wine-variety',
  },
  ratings: {
    container: '.ratings-section',
    item: '.rating-item',
    source: '.rating-source',
    score: '.rating-score',
  },
  // ...
};
```

**선택자 변경 시**: 이 파일만 수정하면 됨

## 의존성 주입

### Provider 등록

[wine.module.ts](src/presentation/wine.module.ts)

```typescript
@Module({
  providers: [
    SearchWineUseCase,
    { provide: 'CrawlerPort', useClass: CurlCrawlerAdapter },
    { provide: 'ParserPort', useClass: WineSearcherParser },
  ],
})
```

### 주입 방식

```typescript
@Injectable()
export class SearchWineUseCase {
  constructor(
    @Inject('CrawlerPort') private readonly crawler: CrawlerPort,
    @Inject('ParserPort') private readonly parser: ParserPort,
  ) {}
}
```

## 환경 변수

```bash
# 애플리케이션 포트
PORT=3001

# 크롤링 설정
CRAWLER_TIMEOUT=5000           # 타임아웃 (ms)
CRAWLER_BROWSER=chrome116      # 브라우저 프로필

# 로깅
LOG_LEVEL=debug
```

## 베스트 프랙티스

### 1. Port 인터페이스 우선

새 기능 추가 시:
1. Domain에 Port 인터페이스 정의
2. Infrastructure에 구현체 작성
3. Application에서 Port 사용

### 2. Value Object 활용

검증 로직이 있는 값은 VO로 캡슐화:

```typescript
// ❌ Bad
if (vintage < 1900 || vintage > new Date().getFullYear()) {
  throw new Error('Invalid vintage');
}

// ✅ Good
const vintage = Vintage.create(vintageValue); // VO 내부 검증
```

### 3. 도메인 에러 사용

도메인 의미를 담은 에러 클래스:

```typescript
// ❌ Bad
throw new Error('Network error');

// ✅ Good
throw new NetworkError('Failed to fetch URL', url);
```

### 4. CSS 선택자 중앙화

선택자는 `wine-searcher.selectors.ts`에서만 관리

## 제약사항

### 법적/윤리적 고려

- Wine-Searcher 이용약관 준수
- robots.txt 확인 필요
- Rate limiting 구현 권장
- 개인정보 처리 주의

### 기술적 제한

- curl-impersonate 설치 필요 (로컬/Docker)
- SSR HTML만 파싱 가능 (JavaScript 렌더링 불가)
- Wine-Searcher HTML 구조 변경 시 선택자 수정 필요

## 관련 문서

- Root [CLAUDE.md](../../CLAUDE.md) - 모노레포 가이드라인
- API [CLAUDE.md](../api/CLAUDE.md) - API 서비스 문서
