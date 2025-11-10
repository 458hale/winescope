# Domain Layer

Domain 계층은 비즈니스 로직의 핵심으로, 외부 의존성 없이 순수한 비즈니스 규칙을 표현합니다.

## 구조

```
domain/
├── entities/           # 엔티티 (Wine, Rating, Price)
├── value-objects/      # 값 객체 (WineName, Vintage, Score)
├── ports/              # 포트 인터페이스 (CrawlerPort, ParserPort)
└── errors/             # 도메인 에러 정의
```

## Entities

### Wine (Aggregate Root)

와인의 기본 정보를 나타내는 Aggregate Root입니다.

**속성**:
- `name: WineName` - 와인 이름 (VO)
- `region: string` - 생산 지역
- `winery: string` - 와이너리
- `variety: string` - 품종
- `vintage: Vintage` - 빈티지 (VO)

**검증 규칙**:
- region, winery, variety: 1-100자, 빈 값 불가

**비즈니스 메서드**:
- `getFullDescription()`: 와인 전체 설명 반환
- `isFromRegion(regionName)`: 특정 지역 생산 여부
- `isFromWinery(wineryName)`: 특정 와이너리 생산 여부

### Rating

와인의 평점 정보를 나타내는 엔티티입니다.

**속성**:
- `source: string` - 평점 출처 (1-100자)
- `score: Score` - 점수 (VO)
- `critic: string | null` - 평론가 이름
- `reviewCount: number` - 리뷰 수 (≥0)

**비즈니스 메서드**:
- `isRobertParker()`: Robert Parker 평점 여부
- `isHighRated()`: 고평점 여부 (90점 이상)
- `isReliable()`: 신뢰성 여부 (리뷰 10개 이상)

### Price

와인의 가격 정보를 나타내는 엔티티입니다.

**속성**:
- `average: number` - 평균 가격 (≥0)
- `currency: string` - 통화 (1-10자)
- `priceRange: string | null` - 가격 범위
- `updatedAt: Date` - 갱신 시각

**비즈니스 메서드**:
- `format()`: 가격 포맷팅 (예: "USD 325.00")
- `isExpensive()`: 고가 여부 ($200 이상)
- `isRecent()`: 최근 정보 여부 (7일 이내)

## Value Objects

### WineName

와인 이름을 캡슐화한 VO입니다.

**생성**: `WineName.create(value: string)`

**검증 규칙**:
- 1-100자, 빈 값 불가
- 자동 trim 처리

**메서드**:
- `value`: getter로 값 접근
- `equals(other)`: 동등성 비교
- `contains(keyword)`: 키워드 포함 여부

### Vintage

빈티지(연도)를 캡슐화한 VO입니다.

**생성**: `Vintage.create(value: number)`

**검증 규칙**:
- 1900 ~ 현재 연도
- 정수만 허용

### Score

평점을 캡슐화한 VO입니다.

**생성**: `Score.create(value: number)`

**검증 규칙**:
- 0-100점
- 소수점 허용

**메서드**:
- `isHighRated()`: 90점 이상 여부

## Ports (Interfaces)

### CrawlerPort

HTTP 크롤링을 위한 포트 인터페이스입니다.

```typescript
interface CrawlerPort {
  fetch(url: string, options?: CrawlOptions): Promise<string>;
}
```

**옵션**:
- `browser`: 브라우저 타입 (chrome116, chrome110, firefox109)
- `timeout`: 타임아웃 (ms)
- `headers`: 커스텀 헤더
- `userAgent`: User-Agent

### ParserPort

HTML 파싱을 위한 포트 인터페이스입니다.

```typescript
interface ParserPort {
  parse(html: string, sourceUrl: string): Promise<WineData>;
}
```

**반환**: `WineData` (wine, ratings, price, sourceUrl, crawledAt)

## Domain Errors

### NetworkError
- **용도**: 네트워크 요청 실패
- **속성**: `url: string`
- **HTTP 매핑**: 502 Bad Gateway

### TimeoutError
- **용도**: 요청 타임아웃
- **속성**: `url: string`, `timeoutMs: number`
- **HTTP 매핑**: 504 Gateway Timeout

### ParsingError
- **용도**: HTML 파싱 실패
- **속성**: `sourceUrl: string`
- **HTTP 매핑**: 500 Internal Server Error

### ValidationError
- **용도**: 도메인 규칙 위반
- **속성**: `field: string`
- **HTTP 매핑**: 400 Bad Request

## 설계 원칙

### 1. 외부 의존성 제로

Domain 계층은 NestJS, cheerio 등 외부 라이브러리에 의존하지 않습니다.

```typescript
// ✅ Good: 순수 TypeScript
export class Wine { ... }

// ❌ Bad: 외부 의존성
import { Injectable } from '@nestjs/common';
```

### 2. 불변성 (Immutability)

Entity와 VO는 생성 후 변경 불가능합니다.

```typescript
class Wine {
  constructor(
    public readonly name: WineName,  // readonly
    public readonly region: string,
    // ...
  )
}
```

### 3. 자가 검증 (Self-Validation)

생성 시점에 모든 규칙을 검증합니다.

```typescript
constructor(...) {
  this.validate();  // 생성자에서 검증
}
```

### 4. 비즈니스 메서드 캡슐화

비즈니스 로직은 도메인 객체 내부에 캡슐화합니다.

```typescript
// ✅ Good: 도메인 메서드
wine.isFromRegion('Napa Valley')

// ❌ Bad: 외부 로직
wine.region.toLowerCase().includes('napa valley')
```

## 테스트 전략

### Entity 테스트

- 검증 규칙 확인
- 비즈니스 메서드 동작 확인
- 경계값 테스트

### Value Object 테스트

- `create()` 정적 팩토리 메서드
- 유효성 검증
- 동등성 비교 (`equals()`)

### Port Interface

Port는 인터페이스이므로 직접 테스트하지 않습니다. 구현체(Adapter)를 테스트합니다.

## 확장 가이드

### 새 Entity 추가

1. `entities/` 디렉토리에 파일 생성
2. 속성 정의 (readonly)
3. `validate()` 메서드 작성
4. 비즈니스 메서드 추가
5. `toJSON()` 메서드 작성

### 새 Value Object 추가

1. `value-objects/` 디렉토리에 파일 생성
2. `private constructor()` + `static create()` 패턴
3. 검증 로직 작성
4. `equals()`, `toString()` 메서드 추가

### 새 Port 추가

1. `ports/` 디렉토리에 인터페이스 정의
2. `ports/index.ts`에 export 추가
3. Infrastructure 계층에 구현체 작성
4. DI 컨테이너에 등록
