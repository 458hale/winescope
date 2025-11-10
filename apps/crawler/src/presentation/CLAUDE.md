# Presentation Layer

Presentation 계층은 HTTP API 엔드포인트를 제공하고, Application 계층의 Use Case를 호출합니다.

## 구조

```
presentation/
├── controllers/
│   └── wine.controller.ts           # 와인 검색 API
├── filters/
│   └── crawler-exception.filter.ts  # 예외 필터
└── wine.module.ts                   # NestJS 모듈
```

## Controllers

### WineController

**경로**: `/wines`

**엔드포인트**:

#### POST /wines/search

와인 정보를 검색합니다.

**요청**:
```json
{
  "region": "Napa Valley",
  "winery": "Opus One",
  "variety": "Cabernet Sauvignon",
  "vintage": 2018
}
```

**응답** (200 OK):
```json
{
  "wine": {
    "name": "Opus One",
    "region": "Napa Valley",
    "winery": "Opus One",
    "variety": "Cabernet Sauvignon",
    "vintage": 2018
  },
  "ratings": [
    {
      "source": "Wine Spectator",
      "score": 95,
      "critic": "James Suckling",
      "reviewCount": 150
    }
  ],
  "price": {
    "average": 325.00,
    "currency": "USD",
    "priceRange": "$280-$370",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "source": {
    "site": "Wine-Searcher",
    "url": "https://www.wine-searcher.com/find/...",
    "crawledAt": "2024-01-15T12:45:30.000Z"
  }
}
```

**검증**:
- DTO 자동 검증 (class-validator)
- 실패 시 400 Bad Request

**로깅**:
- 요청 수신 로그
- 검색 완료 로그

**의존성**:
```typescript
constructor(private readonly searchWineUseCase: SearchWineUseCase)
```

## Exception Filter

### CrawlerExceptionFilter

도메인 에러를 HTTP 응답으로 변환하는 전역 예외 필터입니다.

**에러 매핑**:

| Domain Error | HTTP Status | Error Type |
|-------------|-------------|------------|
| ValidationError | 400 | Bad Request |
| NetworkError (404) | 404 | Not Found |
| NetworkError | 502 | Bad Gateway |
| TimeoutError | 504 | Gateway Timeout |
| ParsingError | 500 | Internal Server Error |

**응답 포맷**:
```json
{
  "statusCode": 502,
  "message": "Failed to fetch wine data from external source",
  "error": "Bad Gateway",
  "timestamp": "2024-01-15T12:45:30.000Z",
  "path": "/wines/search"
}
```

**환경별 처리**:

**Development**:
- 전체 에러 메시지 노출
- 스택 트레이스 로깅

**Production**:
- 안전한 에러 메시지만 노출
- 민감 정보 제거 (URL, 내부 경로 등)

**예시**:
```typescript
// Development
"Failed to fetch https://wine-searcher.com/find/... : Connection refused"

// Production
"Failed to fetch wine data from external source"
```

**404 감지**:
- NetworkError 메시지에서 "404" 또는 "not found" 키워드 확인
- 해당 시 404 Not Found 반환

**로깅**:
- 모든 예외를 ERROR 레벨로 로깅
- 스택 트레이스 포함

## Module Configuration

### WineModule

**역할**:
- Controller, Use Case, Adapter Provider 등록
- 전역 예외 필터 적용

**구성**:
```typescript
@Module({
  controllers: [WineController],
  providers: [
    SearchWineUseCase,
    { provide: 'CrawlerPort', useClass: CurlCrawlerAdapter },
    { provide: 'ParserPort', useClass: WineSearcherParser },
    { provide: APP_FILTER, useClass: CrawlerExceptionFilter },
  ],
})
export class WineModule {}
```

**Provider 등록**:
- Use Case: `SearchWineUseCase`
- Port 구현체: `CrawlerPort`, `ParserPort`
- 전역 필터: `APP_FILTER`

## 레이어 간 상호작용

### Request Flow

```
Client → WineController → SearchWineUseCase → Domain/Infrastructure
```

1. **HTTP 요청 수신**: WineController.searchWine()
2. **DTO 검증**: class-validator 자동 실행
3. **Use Case 호출**: searchWineUseCase.execute(dto)
4. **Domain 로직 실행**: 크롤링 + 파싱
5. **응답 반환**: DTO 형태로 클라이언트에 전달

### Error Flow

```
Domain Error → CrawlerExceptionFilter → HTTP Response
```

1. **도메인 에러 발생**: NetworkError, TimeoutError 등
2. **예외 필터 catch**: CrawlerExceptionFilter
3. **HTTP 상태 코드 매핑**: getHttpStatus()
4. **안전한 메시지 생성**: getSafeErrorMessage()
5. **JSON 응답 반환**: 표준 에러 포맷

## 테스트 전략

### Controller 테스트

**단위 테스트**:
- Use Case mock
- HTTP 요청/응답 검증
- 로깅 검증

```typescript
const mockUseCase = { execute: jest.fn() };
const controller = new WineController(mockUseCase);
```

**E2E 테스트**:
- 실제 HTTP 요청
- 전체 레이어 통합 검증
- 에러 시나리오

```typescript
await request(app.getHttpServer())
  .post('/wines/search')
  .send(dto)
  .expect(200);
```

### Exception Filter 테스트

**에러 매핑 검증**:
```typescript
const filter = new CrawlerExceptionFilter();
const exception = new TimeoutError('...', 'url', 5000);

// HTTP 상태 코드 확인
expect(filter['getHttpStatus'](exception)).toBe(504);
```

**환경별 메시지 검증**:
```typescript
process.env.NODE_ENV = 'production';
const message = filter['getSafeErrorMessage'](exception);
expect(message).not.toContain('url');
```

## API 문서화

### Swagger/OpenAPI (선택적)

**설치**:
```bash
pnpm add @nestjs/swagger
```

**설정**:
```typescript
import { ApiProperty, ApiTags } from '@nestjs/swagger';

@ApiTags('wines')
@Controller('wines')
export class WineController { ... }

export class WineSearchRequestDto {
  @ApiProperty({ example: 'Napa Valley' })
  region!: string;
}
```

## 확장 가이드

### 새 엔드포인트 추가

1. Controller에 메서드 추가
2. DTO 정의 (요청/응답)
3. Use Case 생성 (Application 계층)
4. E2E 테스트 작성

### 새 예외 처리 추가

1. Domain 계층에 에러 클래스 정의
2. CrawlerExceptionFilter에 매핑 추가
3. 테스트 케이스 추가

### CORS 설정

**main.ts**:
```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

### Rate Limiting

**설치**:
```bash
pnpm add @nestjs/throttler
```

**설정**:
```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

**컨트롤러**:
```typescript
@UseGuards(ThrottlerGuard)
@Controller('wines')
export class WineController { ... }
```
