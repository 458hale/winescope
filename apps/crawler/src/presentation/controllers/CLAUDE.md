# Presentation Controllers

HTTP 요청을 처리하고 Use Case를 호출하는 Controller들입니다.

## 파일 구조

```
controllers/
└── wine.controller.ts        # 와인 검색 API
```

## WineController

**경로**: `/wines`

**역할**: 와인 검색 API 엔드포인트 제공

### 의존성

```typescript
@Controller('wines')
export class WineController {
  constructor(
    private readonly searchWineUseCase: SearchWineUseCase
  ) {}
}
```

**주입**: `SearchWineUseCase` - 비즈니스 로직 실행

### 엔드포인트

#### POST /wines/search

와인 정보를 검색합니다.

**HTTP Method**: POST
**Path**: `/wines/search`
**Status Code**: 200 OK

**Request Body**:
```typescript
WineSearchRequestDto {
  region: string;      // 1-100자, 필수
  winery: string;      // 1-100자, 필수
  variety: string;     // 1-100자, 필수
  vintage: number;     // 1900~현재+5, 필수
}
```

**Request Example**:
```json
{
  "region": "Napa Valley",
  "winery": "Opus One",
  "variety": "Cabernet Sauvignon",
  "vintage": 2018
}
```

**Response Body**:
```typescript
WineSearchResponseDto {
  wine: WineInfoDto;
  ratings: RatingDto[];
  price: PriceDto | null;
  source: SourceDto;
}
```

**Response Example**:
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
    "url": "https://www.wine-searcher.com/find/opus+one+cabernet+2018+napa",
    "crawledAt": "2024-01-15T12:45:30.000Z"
  }
}
```

### 구현

```typescript
@Post('search')
@HttpCode(HttpStatus.OK)
async searchWine(
  @Body() request: WineSearchRequestDto,
): Promise<WineSearchResponseDto> {
  this.logger.log(
    `Received wine search request: ${request.winery} ${request.variety} ${request.vintage}`
  );

  const result = await this.searchWineUseCase.execute(request);

  this.logger.log(`Wine search completed successfully`);

  return result;
}
```

### 데코레이터

**@Controller('wines')**:
- 컨트롤러 경로 prefix 설정
- 모든 메서드가 `/wines/*` 경로를 가짐

**@Post('search')**:
- HTTP POST 메서드 처리
- 경로: `/wines/search`

**@HttpCode(HttpStatus.OK)**:
- 성공 시 200 OK 반환 (기본값: 201 Created)

**@Body()**:
- Request body를 DTO로 변환
- class-validator 자동 검증 적용

### 자동 검증

NestJS의 ValidationPipe가 자동으로 DTO 검증을 수행합니다.

**검증 통과**: Use Case 실행
**검증 실패**: 400 Bad Request 자동 반환

**에러 응답 예시**:
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

### 로깅

**요청 수신**:
```typescript
this.logger.log(`Received wine search request: Opus One Cabernet Sauvignon 2018`);
```

**작업 완료**:
```typescript
this.logger.log(`Wine search completed successfully`);
```

**로그 레벨**: `log` (정보성 메시지)

### 에러 처리

Controller는 에러를 직접 처리하지 않습니다.

**에러 흐름**:
1. Use Case에서 도메인 에러 발생
2. CrawlerExceptionFilter가 catch
3. HTTP 응답으로 변환

**에러 예시**:
```typescript
// NetworkError 발생
await this.searchWineUseCase.execute(request);

// CrawlerExceptionFilter가 처리
// → 502 Bad Gateway 응답
```

## Controller 설계 원칙

### 1. Thin Controller

Controller는 최소한의 로직만 포함합니다.

**Controller의 역할**:
- HTTP 요청 수신
- DTO 변환
- Use Case 호출
- 로깅

**Controller가 하지 않는 것**:
- 비즈니스 로직 (Use Case)
- 데이터 변환 로직 (Use Case)
- 에러 처리 (Exception Filter)

### 2. DTO 기반 통신

Request와 Response는 모두 DTO를 사용합니다.

```typescript
// ✅ Good: DTO 사용
async searchWine(@Body() request: WineSearchRequestDto)

// ❌ Bad: 개별 파라미터
async searchWine(
  @Body('region') region: string,
  @Body('winery') winery: string,
  // ...
)
```

### 3. HTTP 상태 코드 명시

성공 응답의 상태 코드를 명시합니다.

```typescript
@HttpCode(HttpStatus.OK)       // 200 (조회/검색)
@HttpCode(HttpStatus.CREATED)  // 201 (생성)
@HttpCode(HttpStatus.NO_CONTENT) // 204 (삭제)
```

### 4. 단일 책임

각 엔드포인트는 하나의 Use Case를 호출합니다.

```typescript
// ✅ Good: 1 endpoint = 1 use case
@Post('search')
async searchWine() {
  return this.searchWineUseCase.execute(request);
}

// ❌ Bad: 1 endpoint = 여러 use case
@Post('search')
async searchWine() {
  const result = await this.searchUseCase.execute();
  await this.logUseCase.execute();
  await this.cacheUseCase.execute();
  // ...
}
```

## 테스트

### 단위 테스트

```typescript
describe('WineController', () => {
  let controller: WineController;
  let mockUseCase: jest.Mocked<SearchWineUseCase>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new WineController(mockUseCase);
  });

  it('Use Case를 호출한다', async () => {
    const request = new WineSearchRequestDto();
    mockUseCase.execute.mockResolvedValue(mockResponse);

    await controller.searchWine(request);

    expect(mockUseCase.execute).toHaveBeenCalledWith(request);
  });

  it('Use Case 결과를 반환한다', async () => {
    mockUseCase.execute.mockResolvedValue(mockResponse);

    const result = await controller.searchWine(request);

    expect(result).toEqual(mockResponse);
  });
});
```

### E2E 테스트

```typescript
describe('POST /wines/search', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [WineController],
      providers: [SearchWineUseCase, /* ... */],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('와인 검색 성공', () => {
    return request(app.getHttpServer())
      .post('/wines/search')
      .send({
        region: 'Napa Valley',
        winery: 'Opus One',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.wine).toBeDefined();
        expect(res.body.ratings).toBeInstanceOf(Array);
      });
  });

  it('유효하지 않은 요청은 400 에러', () => {
    return request(app.getHttpServer())
      .post('/wines/search')
      .send({
        region: '',  // 빈 값
        vintage: 1800,  // 범위 밖
      })
      .expect(400);
  });
});
```

## 확장 가이드

### 새 엔드포인트 추가

1. Controller 메서드 작성
2. HTTP 메서드 데코레이터 (@Post, @Get 등)
3. DTO 정의 (Request, Response)
4. Use Case 주입 및 호출
5. 로깅 추가
6. E2E 테스트 작성

**예시**: 와인 상세 조회

```typescript
@Get(':id')
@HttpCode(HttpStatus.OK)
async getWine(@Param('id') id: string): Promise<WineDetailResponseDto> {
  this.logger.log(`Fetching wine details for ID: ${id}`);

  const result = await this.getWineDetailUseCase.execute({ id });

  this.logger.log(`Wine details fetched successfully`);

  return result;
}
```

### Query Parameter 사용

```typescript
@Get()
async searchWinesByRegion(
  @Query() query: WineSearchQueryDto,
): Promise<WineSearchResponseDto[]> {
  return this.searchByRegionUseCase.execute(query);
}
```

### Path Parameter 사용

```typescript
@Get(':id')
async getWine(@Param('id') id: string) {
  return this.getWineUseCase.execute({ id });
}
```

### Custom Decorator 사용

```typescript
@UseGuards(AuthGuard)
@ApiBearerAuth()
@Post('search')
async searchWine(@User() user: UserDto, @Body() request: WineSearchRequestDto) {
  return this.searchWineUseCase.execute(request, user);
}
```
