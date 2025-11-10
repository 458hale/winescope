# DTOs (Data Transfer Objects)

Application 계층의 데이터 전송 객체로, HTTP 요청/응답과 도메인 모델 간 변환을 담당합니다.

## 파일 구조

```
dto/
├── wine-search-request.dto.ts   # 와인 검색 요청 DTO
└── wine-search-response.dto.ts  # 와인 검색 응답 DTO
```

## WineSearchRequestDto

**용도**: HTTP 요청 → Use Case 입력 데이터 변환

### 필드 및 검증

| 필드 | 타입 | 검증 규칙 | 예시 |
|------|------|----------|------|
| region | string | 1-100자, 필수 | "Napa Valley" |
| winery | string | 1-100자, 필수 | "Opus One" |
| variety | string | 1-100자, 필수 | "Cabernet Sauvignon" |
| vintage | number | 1900~(현재+5), 정수 | 2018 |

### class-validator 데코레이터

```typescript
@IsString()
@IsNotEmpty({ message: 'Region is required' })
@Length(1, 100, { message: 'Region must be between 1 and 100 characters' })
region!: string;

@IsInt({ message: 'Vintage must be an integer' })
@Min(1900, { message: 'Vintage must be at least 1900' })
@Max(new Date().getFullYear() + 5)
vintage!: number;
```

### 자동 검증

NestJS의 ValidationPipe가 자동으로 DTO 검증을 수행합니다.

**검증 실패 시**:
- 400 Bad Request 응답
- 에러 메시지에 검증 실패 상세 포함

**예시 에러**:
```json
{
  "statusCode": 400,
  "message": [
    "Region is required",
    "Vintage must be at least 1900"
  ],
  "error": "Bad Request"
}
```

## WineSearchResponseDto

**용도**: Use Case 출력 → HTTP 응답 데이터 변환

### 구조

```typescript
{
  wine: WineInfoDto,
  ratings: RatingDto[],
  price: PriceDto | null,
  source: SourceDto
}
```

### 하위 DTO

**WineInfoDto**:
- `name: string` - 와인 이름
- `region: string` - 생산 지역
- `winery: string` - 와이너리
- `variety: string` - 품종
- `vintage: number` - 빈티지 연도

**RatingDto**:
- `source: string` - 평점 출처
- `score: number` - 점수
- `critic: string | null` - 평론가
- `reviewCount: number` - 리뷰 수

**PriceDto**:
- `average: number` - 평균 가격
- `currency: string` - 통화
- `priceRange: string | null` - 가격 범위
- `updatedAt: string` - ISO 8601 날짜 (예: "2024-01-15T10:30:00.000Z")

**SourceDto**:
- `site: string` - 크롤링 사이트 이름
- `url: string` - 소스 URL
- `crawledAt: string` - ISO 8601 크롤링 시각

### Domain Model 변환

Use Case의 `mapToResponseDto()` 메서드가 도메인 모델 → DTO 변환을 담당합니다.

```typescript
// Wine Entity → WineInfoDto
wine: {
  name: wineData.wine.name.value,           // WineName VO → string
  vintage: wineData.wine.vintage.value,     // Vintage VO → number
  // ...
}

// Rating Entity → RatingDto
ratings: wineData.ratings.map(rating => ({
  score: rating.score.value,                // Score VO → number
  // ...
}))

// Date → ISO 8601 string
updatedAt: wineData.price.updatedAt.toISOString()
```

## DTO 설계 원칙

### 1. Presentation 계층 전용

DTO는 HTTP 통신에만 사용되며, 도메인 로직에서는 사용하지 않습니다.

```typescript
// ✅ Good: Controller에서 DTO 사용
@Post('search')
async searchWine(@Body() request: WineSearchRequestDto)

// ❌ Bad: Domain Entity에서 DTO 사용
class Wine {
  toDto(): WineInfoDto { ... }  // 도메인 → DTO 변환은 Use Case에서
}
```

### 2. 검증은 DTO에서만

비즈니스 규칙은 Domain, 입력 형식 검증은 DTO에서 수행합니다.

**DTO 검증**: 타입, 길이, 형식
**Domain 검증**: 비즈니스 규칙, 불변 조건

### 3. 불변 객체 지향

DTO 필드는 `readonly`가 아니지만, 생성 후 변경하지 않는 것이 원칙입니다.

### 4. 명시적 타입

`!` (definite assignment assertion)을 사용하여 필드가 검증 후 반드시 존재함을 표시합니다.

## 테스트

### Request DTO 테스트

```typescript
import { validate } from 'class-validator';

it('유효하지 않은 vintage는 검증 실패', async () => {
  const dto = new WineSearchRequestDto();
  dto.vintage = 1800;  // 1900 미만

  const errors = await validate(dto);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toBe('vintage');
});
```

### Response DTO 테스트

Response DTO는 class-validator를 사용하지 않으므로, Use Case에서 변환 로직을 테스트합니다.

## 확장 가이드

### 새 필드 추가

**Request DTO**:
1. 필드 선언
2. class-validator 데코레이터 추가
3. Use Case에서 필드 사용

**Response DTO**:
1. 필드 선언
2. Use Case의 `mapToResponseDto()`에서 변환 로직 추가
3. E2E 테스트로 검증

### 검증 규칙 커스터마이징

```typescript
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isValidRegion' })
export class IsValidRegion implements ValidatorConstraintInterface {
  validate(region: string) {
    return ['Napa Valley', 'Bordeaux', ...].includes(region);
  }
}
```
