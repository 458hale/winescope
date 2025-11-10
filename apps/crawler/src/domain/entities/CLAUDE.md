# Domain Entities

비즈니스 개념을 나타내는 엔티티들로, 고유 식별자와 생명주기를 가집니다.

## 파일 구조

```
entities/
├── wine.entity.ts          # Wine (Aggregate Root)
├── rating.entity.ts        # Rating
├── price.entity.ts         # Price
└── *.spec.ts              # 단위 테스트
```

## Wine Entity (Aggregate Root)

**역할**: 와인 정보의 중심 엔티티이며 Aggregate Root입니다.

### 속성

```typescript
class Wine {
  constructor(
    public readonly name: WineName,      // VO
    public readonly region: string,
    public readonly winery: string,
    public readonly variety: string,
    public readonly vintage: Vintage,    // VO
  )
}
```

### 검증 규칙

- `region`: 1-100자, 빈 값 불가, 자동 trim
- `winery`: 1-100자, 빈 값 불가, 자동 trim
- `variety`: 1-100자, 빈 값 불가, 자동 trim

### 비즈니스 메서드

**getFullDescription()**: 전체 설명 생성
```typescript
"Opus One 2018, Napa Valley, Cabernet Sauvignon"
```

**isFromRegion(regionName: string)**: 지역 확인
- 대소문자 무시 부분 매칭

**isFromWinery(wineryName: string)**: 와이너리 확인
- 대소문자 무시 부분 매칭

**toJSON()**: 직렬화
- Value Object의 값 추출 (name.value, vintage.value)

## Rating Entity

**역할**: 와인의 평점 정보를 나타냅니다.

### 속성

```typescript
class Rating {
  constructor(
    public readonly source: string,         // 1-100자
    public readonly score: Score,           // VO (0-100)
    public readonly critic: string | null,  // 평론가 (선택적)
    public readonly reviewCount: number,    // ≥0
  )
}
```

### 검증 규칙

- `source`: 1-100자, 빈 값 불가
- `reviewCount`: 0 이상
- `critic`: null 또는 비어있지 않은 문자열 (빈 문자열 불가)

### 비즈니스 메서드

**isRobertParker()**: Robert Parker 평점 여부
- 키워드: "parker", "rp", "robert parker"
- source 또는 critic에 포함 확인

**isHighRated()**: 고평점 여부
- 90점 이상 (Score VO의 메서드 위임)

**isReliable()**: 신뢰성 확인
- 리뷰 수 10개 이상

## Price Entity

**역할**: 와인의 가격 정보를 나타냅니다.

### 속성

```typescript
class Price {
  constructor(
    public readonly average: number,          // ≥0
    public readonly currency: string,         // 1-10자
    public readonly priceRange: string | null,
    public readonly updatedAt: Date,
  )
}
```

### 검증 규칙

- `average`: 0 이상
- `currency`: 1-10자, 빈 값 불가
- `updatedAt`: 유효한 Date 객체

### 비즈니스 메서드

**format()**: 가격 포맷팅
```typescript
"USD 325.00"
```

**isExpensive()**: 고가 여부
- $200 이상 (간단한 USD 기준 구현)

**isRecent()**: 최신 정보 여부
- 7일 이내 갱신

**toJSON()**: 직렬화
- updatedAt → ISO 8601 문자열

## 설계 패턴

### Aggregate Pattern

Wine이 Aggregate Root로서 Rating, Price를 포함할 수 있습니다 (현재는 분리되어 있지만 확장 가능).

### Self-Validation

생성자에서 `validate()` 메서드를 호출하여 자가 검증합니다.

```typescript
constructor(...) {
  this.validate();
}

private validate(): void {
  if (!this.region || this.region.trim().length === 0) {
    throw new Error('Wine region is required');
  }
  // ...
}
```

### Immutability

모든 속성이 `readonly`로 선언되어 불변성을 보장합니다.

### Rich Domain Model

비즈니스 로직이 엔티티 내부에 캡슐화되어 있습니다 (anemic model 아님).

## 테스트 전략

### 검증 테스트

```typescript
it('region이 빈 값이면 에러 발생', () => {
  expect(() => new Wine(name, '', winery, variety, vintage))
    .toThrow('Wine region is required');
});
```

### 비즈니스 메서드 테스트

```typescript
it('Napa Valley 지역 와인 확인', () => {
  const wine = new Wine(name, 'Napa Valley', winery, variety, vintage);
  expect(wine.isFromRegion('napa')).toBe(true);
});
```

### 경계값 테스트

```typescript
it('100자 region은 허용', () => {
  const region = 'a'.repeat(100);
  expect(() => new Wine(name, region, winery, variety, vintage))
    .not.toThrow();
});

it('101자 region은 에러', () => {
  const region = 'a'.repeat(101);
  expect(() => new Wine(name, region, winery, variety, vintage))
    .toThrow('Wine region too long');
});
```

## 확장 가이드

### 새 엔티티 추가

1. 파일 생성: `{entity-name}.entity.ts`
2. 클래스 정의: `export class {EntityName}`
3. 속성 정의: `readonly` 사용
4. `validate()` 메서드: 생성자에서 호출
5. 비즈니스 메서드: 도메인 로직 캡슐화
6. `toJSON()` 메서드: 직렬화 지원
7. 테스트 파일: `{entity-name}.entity.spec.ts`

### 엔티티 확장

**새 비즈니스 메서드 추가**:
```typescript
class Wine {
  // ...

  isPremium(): boolean {
    return this.isFromRegion('Napa') && this.vintage.value >= 2015;
  }
}
```

**Aggregate 패턴 구현**:
```typescript
class Wine {
  constructor(
    // ...
    public readonly ratings: Rating[] = [],  // Aggregate 멤버
  ) {}

  addRating(rating: Rating): Wine {
    return new Wine(/* ... */, [...this.ratings, rating]);
  }
}
```
