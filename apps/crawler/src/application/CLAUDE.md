# Application Layer

Application 계층은 유스케이스와 DTO를 포함하며, 도메인 로직을 조율합니다.

## 구조

```
application/
├── use-cases/
│   └── search-wine.use-case.ts    # 와인 검색 유스케이스
└── dto/
    ├── wine-search-request.dto.ts  # 요청 DTO
    └── wine-search-response.dto.ts # 응답 DTO
```

## Use Cases

### SearchWineUseCase

와인 검색 비즈니스 로직을 조율하는 유스케이스입니다.

**역할**:
- Wine-Searcher URL 생성
- CrawlerPort를 통한 HTML 크롤링
- ParserPort를 통한 데이터 파싱
- 도메인 모델 → DTO 변환

**의존성**:
```typescript
@Inject('CrawlerPort') crawler: CrawlerPort
@Inject('ParserPort') parser: ParserPort
```

**실행 흐름**:
```typescript
execute(request: WineSearchRequestDto) {
  1. constructWineSearcherUrl(request)  // URL 생성
  2. crawler.fetch(url, options)        // HTML 크롤링
  3. parser.parse(html, url)            // 데이터 파싱
  4. mapToResponseDto(wineData)         // DTO 변환
}
```

**URL 생성 규칙**:
- Pattern: `/find/{winery}+{variety}+{vintage}+{region}`
- 소문자 변환, 공백 → `+`, 특수문자 제거

## DTOs

### WineSearchRequestDto

**검증 규칙**:
- `region`: 1-100자, 필수
- `winery`: 1-100자, 필수
- `variety`: 1-100자, 필수
- `vintage`: 1900 ~ (현재년도+5), 정수, 필수

**예시**:
```json
{
  "region": "Napa Valley",
  "winery": "Opus One",
  "variety": "Cabernet Sauvignon",
  "vintage": 2018
}
```

### WineSearchResponseDto

**구조**:
```typescript
{
  wine: WineInfoDto,        // 와인 기본 정보
  ratings: RatingDto[],     // 평점 목록
  price: PriceDto | null,   // 가격 정보 (선택적)
  source: SourceDto         // 크롤링 소스 정보
}
```

**WineInfoDto**: 이름, 지역, 와이너리, 품종, 빈티지

**RatingDto**: 출처, 점수, 평론가, 리뷰 수

**PriceDto**: 평균가, 통화, 가격 범위, 갱신일 (ISO 8601)

**SourceDto**: 사이트 이름, URL, 크롤링 시각 (ISO 8601)

## 레이어 간 상호작용

### Presentation → Application
```typescript
// WineController
@Post('search')
async search(@Body() request: WineSearchRequestDto) {
  return this.searchWineUseCase.execute(request);
}
```

### Application → Domain
```typescript
// SearchWineUseCase
const wineData = await this.parser.parse(html, url);
// wineData.wine: Wine Entity
// wineData.ratings: Rating[]
// wineData.price: Price | null
```

### Application → Infrastructure
```typescript
// Port 인터페이스를 통한 간접 호출
const html = await this.crawler.fetch(url);  // CrawlerPort
const data = await this.parser.parse(html);  // ParserPort
```

## 책임 분리

**Use Case의 책임**:
- 비즈니스 로직 조율 (orchestration)
- URL 생성 등 애플리케이션 레벨 로직
- DTO ↔ 도메인 모델 변환
- Port 인터페이스 사용

**Use Case가 하지 않는 것**:
- HTTP 요청 처리 (Presentation 계층)
- 실제 크롤링 구현 (Infrastructure 계층)
- 비즈니스 규칙 검증 (Domain 계층)

## 의존성 방향

```
Application → Domain (Port Interface)
Application ← Presentation
Application → Infrastructure (주입된 구현체)
```

Application 계층은 Domain의 Port 인터페이스에만 의존하며, 구체적인 구현체는 DI 컨테이너가 주입합니다.

## 테스트 전략

### Use Case 테스트

**Mock 대상**: CrawlerPort, ParserPort

```typescript
const mockCrawler = { fetch: jest.fn() };
const mockParser = { parse: jest.fn() };

const useCase = new SearchWineUseCase(mockCrawler, mockParser);
```

**검증 항목**:
- URL 생성 로직
- Port 메서드 호출 순서
- DTO 변환 로직
- 에러 전파

### DTO 테스트

**class-validator 사용**:
```typescript
const dto = new WineSearchRequestDto();
dto.vintage = 1800; // Invalid

const errors = await validate(dto);
expect(errors).toHaveLength(1);
```

## 확장 가이드

### 새 유스케이스 추가

1. `use-cases/` 디렉토리에 파일 생성
2. `@Injectable()` 데코레이터 추가
3. 필요한 Port 주입
4. `execute()` 메서드 구현

### DTO 확장

- 요청 DTO: class-validator 데코레이터로 검증 규칙 추가
- 응답 DTO: 필드 추가 시 Use Case의 `mapToResponseDto()` 수정
