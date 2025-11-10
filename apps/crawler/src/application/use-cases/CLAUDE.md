# Use Cases

Application 계층의 비즈니스 로직 조율을 담당하는 유스케이스들입니다.

## 파일 구조

```
use-cases/
└── search-wine.use-case.ts   # 와인 검색 유스케이스
```

## SearchWineUseCase

**역할**: 와인 검색 비즈니스 플로우를 조율합니다.

### 의존성

```typescript
@Injectable()
export class SearchWineUseCase {
  constructor(
    @Inject('CrawlerPort') private readonly crawler: CrawlerPort,
    @Inject('ParserPort') private readonly parser: ParserPort,
  ) {}
}
```

**Port 인터페이스**:
- `CrawlerPort`: HTTP 크롤링 담당
- `ParserPort`: HTML 파싱 담당

### 실행 흐름

```typescript
async execute(request: WineSearchRequestDto): Promise<WineSearchResponseDto>
```

**4단계 프로세스**:

1. **URL 생성**: `constructWineSearcherUrl(request)`
   - 와인 정보 → Wine-Searcher URL 변환
   - Pattern: `/find/{winery}+{variety}+{vintage}+{region}`

2. **HTML 크롤링**: `crawler.fetch(url, options)`
   - curl-impersonate로 HTML 가져오기
   - 브라우저: chrome116, 타임아웃: 5000ms

3. **데이터 파싱**: `parser.parse(html, url)`
   - HTML → 도메인 모델 (Wine, Rating[], Price)
   - cheerio 기반 CSS 선택자 파싱

4. **DTO 변환**: `mapToResponseDto(wineData)`
   - 도메인 모델 → Response DTO
   - Value Object unwrap (name.value, score.value)

### URL 생성 규칙

**constructWineSearcherUrl()**:

```typescript
// Input
{ winery: 'Opus One', variety: 'Cabernet', vintage: 2018, region: 'Napa' }

// Processing
1. 필드 결합: "Opus One Cabernet 2018 Napa"
2. 소문자 변환: "opus one cabernet 2018 napa"
3. 공백 → '+': "opus+one+cabernet+2018+napa"
4. 특수문자 제거: a-z, 0-9, + 만 유지

// Output
"https://www.wine-searcher.com/find/opus+one+cabernet+2018+napa"
```

### DTO 변환 로직

**mapToResponseDto()**:

```typescript
private mapToResponseDto(wineData: WineData): WineSearchResponseDto {
  return {
    wine: {
      name: wineData.wine.name.value,        // WineName VO → string
      vintage: wineData.wine.vintage.value,  // Vintage VO → number
      // ...
    },
    ratings: wineData.ratings.map(rating => ({
      score: rating.score.value,             // Score VO → number
      // ...
    })),
    price: wineData.price ? {
      updatedAt: wineData.price.updatedAt.toISOString(),  // Date → ISO string
      // ...
    } : null,
    source: {
      crawledAt: wineData.crawledAt.toISOString(),
      // ...
    },
  };
}
```

### 로깅

```typescript
this.logger.log(`Searching wine: ${request.winery} ${request.variety} ...`);
this.logger.debug(`Wine-Searcher URL: ${url}`);
this.logger.debug(`Fetched ${html.length} bytes of HTML`);
this.logger.log(`Successfully parsed wine: ${wineData.wine.name.value}`);
```

**로그 레벨**:
- `log`: 주요 작업 시작/완료
- `debug`: 상세 정보 (URL, 데이터 크기)

## Use Case 설계 원칙

### 1. Port 인터페이스 사용

구체적인 구현(Adapter)이 아닌 Port에 의존합니다.

```typescript
// ✅ Good: Port 인터페이스 주입
@Inject('CrawlerPort') private readonly crawler: CrawlerPort

// ❌ Bad: 구체적 구현체 주입
constructor(private readonly curlAdapter: CurlCrawlerAdapter)
```

### 2. 단일 책임

Use Case는 비즈니스 플로우 조율만 담당합니다.

**Use Case가 하는 일**:
- Port 메서드 호출 순서 결정
- 데이터 변환 (DTO ↔ Domain)
- 애플리케이션 레벨 로직 (URL 생성)

**Use Case가 하지 않는 일**:
- HTTP 요청 처리 (Controller)
- 실제 크롤링 (Adapter)
- 비즈니스 규칙 검증 (Domain)

### 3. 트랜잭션 경계

Use Case는 하나의 트랜잭션(작업 단위)을 나타냅니다.

### 4. 테스트 용이성

Port를 mock하여 Use Case 로직만 독립적으로 테스트 가능합니다.

## 테스트

### 단위 테스트

```typescript
describe('SearchWineUseCase', () => {
  let useCase: SearchWineUseCase;
  let mockCrawler: jest.Mocked<CrawlerPort>;
  let mockParser: jest.Mocked<ParserPort>;

  beforeEach(() => {
    mockCrawler = { fetch: jest.fn() };
    mockParser = { parse: jest.fn() };
    useCase = new SearchWineUseCase(mockCrawler, mockParser);
  });

  it('URL을 올바르게 생성한다', async () => {
    mockCrawler.fetch.mockResolvedValue('<html>...</html>');
    mockParser.parse.mockResolvedValue(mockWineData);

    await useCase.execute(request);

    expect(mockCrawler.fetch).toHaveBeenCalledWith(
      'https://www.wine-searcher.com/find/opus+one+cabernet+2018+napa',
      expect.any(Object)
    );
  });

  it('파싱 실패 시 에러를 전파한다', async () => {
    mockCrawler.fetch.mockResolvedValue('<html>...</html>');
    mockParser.parse.mockRejectedValue(new ParsingError('...', 'url'));

    await expect(useCase.execute(request)).rejects.toThrow(ParsingError);
  });
});
```

### 통합 테스트

실제 Adapter를 사용하여 E2E 테스트를 수행합니다.

```typescript
it('실제 Wine-Searcher 크롤링 및 파싱', async () => {
  const crawler = new CurlCrawlerAdapter();
  const parser = new WineSearcherParser();
  const useCase = new SearchWineUseCase(crawler, parser);

  const result = await useCase.execute(request);

  expect(result.wine.name).toBeDefined();
  expect(result.ratings).toBeInstanceOf(Array);
});
```

## 확장 가이드

### 새 Use Case 추가

1. `use-cases/` 디렉토리에 파일 생성
2. `@Injectable()` 데코레이터 추가
3. 필요한 Port 생성자 주입
4. `execute()` 메서드 구현
5. Module의 providers에 등록
6. Controller에서 주입 및 사용

### Use Case 확장

**새 Port 주입**:
```typescript
constructor(
  @Inject('CrawlerPort') crawler: CrawlerPort,
  @Inject('ParserPort') parser: ParserPort,
  @Inject('CachePort') private readonly cache: CachePort,  // 추가
) {}
```

**캐싱 로직 추가**:
```typescript
async execute(request: WineSearchRequestDto) {
  const cacheKey = this.buildCacheKey(request);
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  // 기존 로직...
  await this.cache.set(cacheKey, result);
  return result;
}
```
