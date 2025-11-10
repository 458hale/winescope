# Presentation Filters

예외를 HTTP 응답으로 변환하는 Exception Filter들입니다.

## 파일 구조

```
filters/
└── crawler-exception.filter.ts       # 도메인 에러 → HTTP 응답 변환
```

## CrawlerExceptionFilter

**역할**: 도메인 에러를 적절한 HTTP 응답으로 변환합니다.

### 구현

```typescript
@Catch()
export class CrawlerExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = this.getHttpStatus(exception);

    response.status(status).json({
      statusCode: status,
      message: this.getSafeErrorMessage(exception),
      error: this.getErrorType(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 에러 매핑

#### getHttpStatus()

도메인 에러를 HTTP 상태 코드로 변환합니다.

| Domain Error | HTTP Status | 코드 | 설명 |
|-------------|-------------|------|------|
| ValidationError | BAD_REQUEST | 400 | 잘못된 요청 |
| NetworkError (404) | NOT_FOUND | 404 | 와인 없음 |
| NetworkError | BAD_GATEWAY | 502 | 외부 서비스 오류 |
| TimeoutError | GATEWAY_TIMEOUT | 504 | 타임아웃 |
| ParsingError | INTERNAL_SERVER_ERROR | 500 | 파싱 실패 |
| Unknown | INTERNAL_SERVER_ERROR | 500 | 알 수 없는 에러 |

**404 감지 로직**:
```typescript
if (exception instanceof NetworkError) {
  if (exception.message.includes('404') || exception.message.includes('not found')) {
    return HttpStatus.NOT_FOUND;  // 404
  }
  return HttpStatus.BAD_GATEWAY;  // 502
}
```

#### getErrorType()

에러 타입을 사용자 친화적 문자열로 변환합니다.

```typescript
ValidationError → "Bad Request"
NetworkError (404) → "Not Found"
NetworkError → "Bad Gateway"
TimeoutError → "Gateway Timeout"
ParsingError → "Internal Server Error"
```

#### getSafeErrorMessage()

환경에 따라 안전한 에러 메시지를 생성합니다.

**Production**:
- 민감 정보 제거
- 일반적인 메시지 반환

```typescript
ValidationError → 원본 메시지 (사용자 입력 에러)
TimeoutError → "Request timed out while fetching wine data"
NetworkError (404) → "Wine not found"
NetworkError → "Failed to fetch wine data from external source"
ParsingError → "Failed to parse wine data"
기타 → "An unexpected error occurred"
```

**Development**:
- 전체 에러 메시지 노출
- 디버깅 정보 포함

```typescript
exception.message || 'Unknown error'
```

### 응답 형식

```json
{
  "statusCode": 502,
  "message": "Failed to fetch wine data from external source",
  "error": "Bad Gateway",
  "timestamp": "2024-01-15T12:45:30.000Z",
  "path": "/wines/search"
}
```

### 로깅

```typescript
this.logger.error(
  `Exception occurred: ${exception.message}`,
  exception.stack,
);
```

**로그 레벨**: `error`
**포함 정보**: 메시지, 스택 트레이스

### 전역 등록

**wine.module.ts**:
```typescript
@Module({
  providers: [
    { provide: APP_FILTER, useClass: CrawlerExceptionFilter },
  ],
})
```

**APP_FILTER**: NestJS 전역 필터 토큰

## Exception Filter 설계 원칙

### 1. 전역 필터 사용

모든 예외를 일관되게 처리합니다.

```typescript
// ✅ Good: 전역 필터
{ provide: APP_FILTER, useClass: CrawlerExceptionFilter }

// ❌ Bad: Controller별 필터
@UseFilters(CrawlerExceptionFilter)
export class WineController { ... }
```

### 2. 환경별 메시지 분리

Production과 Development 환경을 구분합니다.

```typescript
if (process.env.NODE_ENV === 'production') {
  return '안전한 메시지';
}
return exception.message;  // 전체 에러 메시지
```

### 3. 민감 정보 보호

URL, 내부 경로, 스택 트레이스를 클라이언트에 노출하지 않습니다.

```typescript
// ❌ 노출하면 안 됨
`Failed to fetch https://internal-service.com/api/secret`

// ✅ 안전한 메시지
`Failed to fetch wine data from external source`
```

### 4. 일관된 응답 형식

모든 에러 응답이 동일한 구조를 가집니다.

```typescript
{
  statusCode: number,
  message: string,
  error: string,
  timestamp: string,
  path: string,
}
```

## 테스트

### 에러 매핑 테스트

```typescript
describe('CrawlerExceptionFilter', () => {
  let filter: CrawlerExceptionFilter;

  beforeEach(() => {
    filter = new CrawlerExceptionFilter();
  });

  it('NetworkError를 502로 변환', () => {
    const error = new NetworkError('Failed', 'http://example.com');
    expect(filter['getHttpStatus'](error)).toBe(502);
  });

  it('TimeoutError를 504로 변환', () => {
    const error = new TimeoutError('Timeout', 'http://example.com', 5000);
    expect(filter['getHttpStatus'](error)).toBe(504);
  });

  it('NetworkError with 404를 404로 변환', () => {
    const error = new NetworkError('404 not found', 'http://example.com');
    expect(filter['getHttpStatus'](error)).toBe(404);
  });
});
```

### 메시지 안전성 테스트

```typescript
describe('getSafeErrorMessage', () => {
  let filter: CrawlerExceptionFilter;

  beforeEach(() => {
    filter = new CrawlerExceptionFilter();
    process.env.NODE_ENV = 'production';
  });

  it('Production에서 민감 정보 제거', () => {
    const error = new NetworkError('Failed to fetch https://secret.com', 'url');
    const message = filter['getSafeErrorMessage'](error);

    expect(message).not.toContain('https://secret.com');
    expect(message).toBe('Failed to fetch wine data from external source');
  });

  it('Development에서 전체 메시지 반환', () => {
    process.env.NODE_ENV = 'development';
    const error = new NetworkError('Detailed error message', 'url');
    const message = filter['getSafeErrorMessage'](error);

    expect(message).toBe('Detailed error message');
  });
});
```

### E2E 테스트

```typescript
describe('Exception Filter E2E', () => {
  it('NetworkError 시 502 반환', async () => {
    // Mock: Use Case가 NetworkError 발생
    mockUseCase.execute.mockRejectedValue(
      new NetworkError('Connection refused', 'http://example.com')
    );

    return request(app.getHttpServer())
      .post('/wines/search')
      .send(validRequest)
      .expect(502)
      .expect((res) => {
        expect(res.body.error).toBe('Bad Gateway');
        expect(res.body.statusCode).toBe(502);
      });
  });

  it('TimeoutError 시 504 반환', async () => {
    mockUseCase.execute.mockRejectedValue(
      new TimeoutError('Timeout', 'http://example.com', 5000)
    );

    return request(app.getHttpServer())
      .post('/wines/search')
      .send(validRequest)
      .expect(504);
  });
});
```

## 확장 가이드

### 새 도메인 에러 추가

1. Domain 계층에 에러 클래스 정의
2. `getHttpStatus()`에 매핑 추가
3. `getErrorType()`에 타입 문자열 추가
4. `getSafeErrorMessage()`에 메시지 로직 추가
5. 테스트 작성

**예시**: RateLimitError

```typescript
// Domain Error
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly retryAfter: number,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Exception Filter 매핑
private getHttpStatus(exception: Error): HttpStatus {
  // ...
  if (exception instanceof RateLimitError) {
    return HttpStatus.TOO_MANY_REQUESTS;  // 429
  }
  // ...
}

private getErrorType(exception: Error): string {
  // ...
  if (exception instanceof RateLimitError) {
    return 'Too Many Requests';
  }
  // ...
}

private getSafeErrorMessage(exception: Error): string {
  if (process.env.NODE_ENV === 'production') {
    if (exception instanceof RateLimitError) {
      return `Rate limit exceeded. Retry after ${exception.retryAfter} seconds`;
    }
    // ...
  }
  return exception.message;
}
```

### Retry-After 헤더 추가

```typescript
catch(exception: Error, host: ArgumentsHost) {
  const response = ctx.getResponse<Response>();
  const status = this.getHttpStatus(exception);

  if (exception instanceof RateLimitError) {
    response.setHeader('Retry-After', exception.retryAfter);
  }

  response.status(status).json({ /* ... */ });
}
```

### 커스텀 응답 형식

```typescript
response.status(status).json({
  statusCode: status,
  message: this.getSafeErrorMessage(exception),
  error: this.getErrorType(exception),
  timestamp: new Date().toISOString(),
  path: request.url,
  // 추가 필드
  requestId: request.headers['x-request-id'],
  details: this.getErrorDetails(exception),
});
```
