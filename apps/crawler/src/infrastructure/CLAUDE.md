# Infrastructure Layer

Infrastructure 계층은 Domain의 Port 인터페이스를 구체적으로 구현하는 Adapter들을 포함합니다.

## 구조

```
infrastructure/
├── adapters/
│   └── curl-crawler.adapter.ts    # CrawlerPort 구현
└── parsers/
    ├── wine-searcher.parser.ts     # ParserPort 구현
    └── wine-searcher.selectors.ts  # CSS 선택자 정의
```

## Adapters

### CurlCrawlerAdapter

**구현**: `CrawlerPort` 인터페이스

**기술**: curl-impersonate (브라우저 핑거프린트 위장)

**메서드**:
```typescript
async fetch(url: string, options?: CrawlOptions): Promise<string>
```

**동작 방식**:
1. curl-impersonate 명령어 생성
2. `exec()` 비동기 실행 (Node.js child_process)
3. HTML 응답 반환
4. 에러 시 NetworkError/TimeoutError 발생

**브라우저 프로필**:
- `curl_chrome116` (기본값)
- `curl_chrome110`
- `curl_firefox109`

**보안 고려사항**:

`escapeShellArg()` - Command Injection 방지

```typescript
private escapeShellArg(arg: string): string {
  return arg
    .replace(/\\/g, '\\\\')    // backslash
    .replace(/"/g, '\\"')      // double quotes
    .replace(/\$/g, '\\$')     // dollar signs
    .replace(/`/g, '\\`')      // backticks
    .replace(/;/g, '\\;')      // semicolons
    // ...
}
```

**타임아웃 처리**:
- 기본값: 5000ms
- `--max-time` 옵션으로 curl에 전달
- 타임아웃 시 TimeoutError 발생

**로깅**:
- 요청 URL, 브라우저, 타임아웃 기록
- 응답 크기 (bytes) 기록
- stderr 출력 경고 로그

## Parsers

### WineSearcherParser

**구현**: `ParserPort` 인터페이스

**기술**: cheerio (jQuery-like HTML parser)

**메서드**:
```typescript
async parse(html: string, sourceUrl: string): Promise<WineData>
```

**파싱 프로세스**:
1. cheerio로 HTML 로드
2. `extractWine()` - Wine 엔티티 추출
3. `extractRatings()` - Rating 배열 추출
4. `extractPrice()` - Price 엔티티 추출
5. WineData 객체 반환

**추출 메서드**:

**extractWine()**:
- CSS 선택자로 텍스트 추출
- 도메인 VO/Entity 생성 (WineName, Vintage, Wine)
- 필수 필드 누락 시 에러 발생

**extractRatings()**:
- 평점 컨테이너 탐색
- 각 평점 아이템 순회
- 파싱 실패 시 경고 로그 (Rating 건너뜀)
- 성공한 Rating만 배열에 추가

**extractPrice()**:
- 가격 정보 선택자로 추출
- 없으면 `null` 반환 (선택적 정보)
- Price 엔티티 생성

**파싱 유틸리티**:

```typescript
parseVintage(text: string | null): Vintage
parseScore(text: string): Score
parseReviewCount(text: string | null): number
parsePrice(text: string): number
parseDate(text: string | null): Date | null
```

**에러 처리**:
- 파싱 실패 시 ParsingError 발생
- sourceUrl 포함하여 디버깅 용이

### CSS Selectors

**wine-searcher.selectors.ts** - CSS 선택자 중앙 관리

**구조**:
```typescript
export const WINE_SEARCHER_SELECTORS = {
  wine: { name, vintage, region, winery, variety },
  ratings: { container, item, source, score, critic, reviewCount },
  price: { average, currency, priceRange, updatedAt },
};
```

**선택자 전략**:
- 다중 선택자 제공 (fallback)
- 예: `'h1.wine-name, .wine-title h1, h1'`
- HTML 구조 변경 시 이 파일만 수정

**⚠️ 현재 상태**:
- Mock 선택자 (TODO 표시)
- 실제 Wine-Searcher HTML 분석 필요
- 브라우저 DevTools로 실제 선택자 식별 필요

## 의존성 주입

### Provider 등록

**wine.module.ts**:
```typescript
@Module({
  providers: [
    { provide: 'CrawlerPort', useClass: CurlCrawlerAdapter },
    { provide: 'ParserPort', useClass: WineSearcherParser },
  ],
})
```

### Adapter 교체

Port 인터페이스 덕분에 구현체 교체가 쉽습니다.

**예시**: axios 기반 Adapter로 교체
```typescript
{ provide: 'CrawlerPort', useClass: AxiosCrawlerAdapter }
```

**예시**: Puppeteer 기반 Parser로 교체
```typescript
{ provide: 'ParserPort', useClass: PuppeteerParser }
```

## 테스트 전략

### Adapter 단위 테스트

**CurlCrawlerAdapter**:
- `exec()` mock으로 curl 실행 시뮬레이션
- HTML 응답 검증
- 타임아웃 시나리오
- Command Injection 방어 검증

**WineSearcherParser**:
- 고정 HTML fixture 사용
- Entity/VO 생성 검증
- 선택자 추출 로직 검증
- 누락 필드 처리 검증

### 통합 테스트

**실제 크롤링 + 파싱**:
```typescript
const crawler = new CurlCrawlerAdapter();
const parser = new WineSearcherParser();

const html = await crawler.fetch(url);
const wineData = await parser.parse(html, url);

expect(wineData.wine).toBeInstanceOf(Wine);
```

## 확장 가이드

### 새 Crawler Adapter 추가

1. `adapters/` 디렉토리에 파일 생성
2. `CrawlerPort` 인터페이스 구현
3. `@Injectable()` 데코레이터 추가
4. `fetch()` 메서드 구현
5. Module에 Provider 등록

### 새 Parser 추가

1. `parsers/` 디렉토리에 파일 생성
2. `ParserPort` 인터페이스 구현
3. 선택자 파일 생성 (선택적)
4. `parse()` 메서드 구현
5. Module에 Provider 등록

### CSS 선택자 업데이트

1. Wine-Searcher 페이지 크롤링
2. 브라우저 DevTools로 요소 검사
3. CSS 선택자 식별
4. `wine-searcher.selectors.ts` 업데이트
5. 파서 테스트 실행하여 검증

## 주의사항

### curl-impersonate 설치

**로컬 개발**:
```bash
# macOS
brew install curl-impersonate

# Linux
# 공식 릴리스에서 바이너리 다운로드
```

**Docker**:
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache curl-impersonate
```

### HTML 구조 변경 대응

Wine-Searcher가 HTML 구조를 변경하면:
1. 선택자 파일만 업데이트
2. Parser 로직은 변경 불필요 (추상화 덕분)
3. 테스트로 검증

### Rate Limiting

현재 구현에는 rate limiting이 없습니다.

**TODO**: RateLimiter 구현
- 도메인별 요청 간격 제한
- Exponential backoff
- 429 응답 처리
