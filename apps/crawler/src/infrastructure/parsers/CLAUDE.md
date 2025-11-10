# Infrastructure Parsers

HTML을 파싱하여 도메인 모델로 변환하는 Parser들입니다.

## 파일 구조

```
parsers/
├── wine-searcher.parser.ts         # ParserPort 구현
├── wine-searcher.selectors.ts      # CSS 선택자 정의
└── wine-searcher.parser.spec.ts    # 단위 테스트
```

## WineSearcherParser

**구현**: `ParserPort` 인터페이스

**기술**: cheerio (jQuery-like HTML parser)

### 핵심 메서드

```typescript
async parse(html: string, sourceUrl: string): Promise<WineData>
```

**파라미터**:
- `html`: 파싱할 HTML 문자열
- `sourceUrl`: HTML의 원본 URL (에러 추적용)

**반환**: `WineData` (wine, ratings, price, sourceUrl, crawledAt)

**에러**: `ParsingError` - 파싱 실패 시

### 파싱 프로세스

1. **cheerio 로드**: `cheerio.load(html)`
   - jQuery 스타일 DOM 탐색

2. **Wine 추출**: `extractWine($)`
   - CSS 선택자로 텍스트 추출
   - 도메인 VO/Entity 생성 (WineName, Vintage, Wine)
   - 필수 필드 누락 시 에러

3. **Ratings 추출**: `extractRatings($)`
   - 평점 컨테이너 탐색
   - 각 평점 아이템 순회
   - 파싱 실패는 경고 로그 (건너뜀)

4. **Price 추출**: `extractPrice($)`
   - 가격 정보 선택자로 추출
   - 없으면 `null` 반환 (선택적)

5. **WineData 반환**:
   - 모든 데이터 조합
   - sourceUrl, crawledAt 추가

### 추출 메서드

**extractWine($)**:

```typescript
private extractWine($: cheerio.Root): Wine {
  const name = this.extractText($, selectors.wine.name);
  if (!name) throw new Error('Wine name not found');

  const vintageText = this.extractText($, selectors.wine.vintage);
  const vintage = this.parseVintage(vintageText);

  const region = this.extractText($, selectors.wine.region) || 'Unknown Region';
  const winery = this.extractText($, selectors.wine.winery) || 'Unknown Winery';
  const variety = this.extractText($, selectors.wine.variety) || 'Unknown Variety';

  return new Wine(WineName.create(name), region, winery, variety, vintage);
}
```

**extractRatings($)**:

```typescript
private extractRatings($: cheerio.Root): Rating[] {
  const ratings: Rating[] = [];
  const ratingElements = $(selectors.ratings.container).find(selectors.ratings.item);

  ratingElements.each((_, element) => {
    try {
      const source = this.extractText($, selectors.ratings.source, element);
      const scoreText = this.extractText($, selectors.ratings.score, element);
      // ... 파싱 로직
      if (source && scoreText) {
        ratings.push(new Rating(source, score, critic, reviewCount));
      }
    } catch (error) {
      this.logger.warn(`Failed to parse rating: ${error}`);
      // 개별 Rating 실패 시 건너뛰고 계속 진행
    }
  });

  return ratings;
}
```

**extractPrice($)**:

```typescript
private extractPrice($: cheerio.Root): Price | null {
  const averageText = this.extractText($, selectors.price.average);
  const currency = this.extractText($, selectors.price.currency);

  if (!averageText || !currency) return null;  // 가격 정보 없음

  const average = this.parsePrice(averageText);
  const priceRange = this.extractText($, selectors.price.priceRange) || null;
  const updatedAtText = this.extractText($, selectors.price.updatedAt);
  const updatedAt = this.parseDate(updatedAtText) || new Date();

  return new Price(average, currency, priceRange, updatedAt);
}
```

### 파싱 유틸리티

**extractText()**: CSS 선택자로 텍스트 추출

```typescript
private extractText($: cheerio.Root, selector: string, context?: cheerio.Element): string | null {
  const element = context ? $(context).find(selector) : $(selector);
  const text = element.first().text().trim();
  return text.length > 0 ? text : null;
}
```

**파싱 메서드들**:

```typescript
parseVintage(text: string | null): Vintage
parseScore(text: string): Score
parseReviewCount(text: string | null): number
parsePrice(text: string): number
parseDate(text: string | null): Date | null
```

**예시**:
- `parseScore("95 points")` → `Score.create(95)`
- `parsePrice("$325.00")` → `325.00`
- `parseVintage("2018 Vintage")` → `Vintage.create(2018)`

## CSS Selectors

**wine-searcher.selectors.ts** - 선택자 중앙 관리

### 선택자 구조

```typescript
export const WINE_SEARCHER_SELECTORS = {
  wine: {
    name: 'h1.wine-name, .wine-title h1, h1',
    vintage: '.vintage, .wine-year, [data-vintage]',
    region: '.region, .wine-region, [data-region]',
    winery: '.winery, .wine-producer, [data-winery]',
    variety: '.variety, .wine-varietal, [data-variety]',
  },
  ratings: {
    container: '.ratings, .wine-ratings, [data-ratings]',
    item: '.rating-item, .rating',
    source: '.rating-source, .critic-name, [data-source]',
    score: '.rating-score, .wine-score, [data-score]',
    critic: '.critic, .reviewer, [data-critic]',
    reviewCount: '.review-count, .num-reviews, [data-review-count]',
  },
  price: {
    average: '.average-price, .price-avg, [data-price-avg]',
    currency: '.currency, .price-currency, [data-currency]',
    priceRange: '.price-range, [data-price-range]',
    updatedAt: '.price-updated, .last-updated, [data-updated]',
  },
};
```

### 선택자 전략

**다중 선택자 (Fallback)**:
```typescript
'h1.wine-name, .wine-title h1, h1'
// 순서대로 시도:
// 1. h1.wine-name
// 2. .wine-title h1
// 3. h1 (최후의 수단)
```

**data-* 속성 사용**:
```typescript
'[data-vintage]'
// HTML 구조 변경에 강건
```

### ⚠️ 현재 상태

**Mock 선택자**: 실제 Wine-Searcher HTML 분석 필요

**TODO**:
1. Wine-Searcher 페이지 크롤링
2. 브라우저 DevTools로 실제 HTML 구조 분석
3. 정확한 CSS 선택자 식별
4. `wine-searcher.selectors.ts` 업데이트
5. 파서 테스트 실행하여 검증

### 선택자 업데이트 프로세스

```bash
# 1. 실제 HTML 크롤링
curl_chrome116 "https://wine-searcher.com/find/..." > wine-searcher.html

# 2. 브라우저에서 열기
open wine-searcher.html

# 3. DevTools로 요소 검사
# - 와인 이름: h1.wine-title
# - 빈티지: span.vintage-year
# - 평점: div.rating-card
# 등등...

# 4. selectors.ts 업데이트
wine: {
  name: 'h1.wine-title',
  vintage: 'span.vintage-year',
  // ...
}

# 5. 테스트 실행
pnpm --filter @winescope/crawler test wine-searcher.parser
```

## 에러 처리

### 파싱 실패

```typescript
try {
  const $ = cheerio.load(html);
  const wine = this.extractWine($);
  // ...
  return wineData;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
  throw new ParsingError(
    `Failed to parse HTML from ${sourceUrl}: ${errorMessage}`,
    sourceUrl
  );
}
```

### 부분 실패 허용

**Rating 파싱 실패**:
- 개별 Rating 실패는 경고 로그
- 다른 Rating은 계속 파싱
- 빈 배열이 아닌 성공한 Rating만 반환

**Price 파싱 실패**:
- `null` 반환 (선택적 정보)
- 전체 파싱 실패 아님

## 로깅

```typescript
this.logger.debug(`Parsing HTML from ${sourceUrl}`);
this.logger.warn(`Failed to parse rating: ${error}`);
this.logger.debug(`Successfully parsed wine: ${wine.name.value}, ${ratings.length} ratings`);
```

## 테스트

### Fixture 기반 테스트

```typescript
describe('WineSearcherParser', () => {
  let parser: WineSearcherParser;
  let mockHtml: string;

  beforeEach(() => {
    parser = new WineSearcherParser();
    mockHtml = readFileSync('fixtures/wine-searcher-sample.html', 'utf-8');
  });

  it('와인 정보를 추출한다', async () => {
    const result = await parser.parse(mockHtml, 'https://example.com');

    expect(result.wine.name.value).toBe('Opus One');
    expect(result.wine.vintage.value).toBe(2018);
  });

  it('평점 배열을 반환한다', async () => {
    const result = await parser.parse(mockHtml, 'https://example.com');

    expect(result.ratings).toBeInstanceOf(Array);
    expect(result.ratings.length).toBeGreaterThan(0);
  });
});
```

### 선택자 검증

```typescript
it('선택자로 와인 이름을 찾는다', () => {
  const $ = cheerio.load(mockHtml);
  const name = $(WINE_SEARCHER_SELECTORS.wine.name).first().text();
  expect(name).toBeTruthy();
});
```

## 대안 Parser

### VivinoParser (예시)

```typescript
@Injectable()
export class VivinoParser implements ParserPort {
  async parse(html: string, sourceUrl: string): Promise<WineData> {
    const $ = cheerio.load(html);

    // Vivino HTML 구조에 맞는 선택자 사용
    const name = $('.wine-card__name').text().trim();
    const vintage = parseInt($('.wine-year').text());
    // ...

    return { wine, ratings, price, sourceUrl, crawledAt: new Date() };
  }
}
```

## 확장 가이드

### 새 Parser 추가

1. 파일 생성: `{site}-parser.ts`
2. ParserPort 구현
3. 선택자 파일 생성: `{site}-selectors.ts`
4. `@Injectable()` 추가
5. 추출 메서드 구현 (extractWine, extractRatings, extractPrice)
6. 테스트 작성 (HTML fixture 준비)
7. Module에 Provider 등록

### Parser 교체

```typescript
// Wine-Searcher
{ provide: 'ParserPort', useClass: WineSearcherParser }

// Vivino
{ provide: 'ParserPort', useClass: VivinoParser }
```
