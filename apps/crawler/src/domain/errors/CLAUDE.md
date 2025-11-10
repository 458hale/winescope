# Domain Errors

도메인 계층에서 발생하는 비즈니스 에러를 정의합니다.

## 파일 구조

```
errors/
└── crawler.errors.ts       # 크롤러 도메인 에러
```

## Error Classes

### NetworkError

**용도**: 네트워크 요청 실패 시 발생

**속성**:
- `message: string` - 에러 메시지
- `url: string` - 실패한 URL
- `name: 'NetworkError'`

**발생 시점**:
- HTTP 요청 실패
- DNS 해석 실패
- 연결 거부

**HTTP 매핑**: 502 Bad Gateway

**예시**:
```typescript
throw new NetworkError(
  'Failed to fetch URL: Connection refused',
  'https://wine-searcher.com/find/...'
);
```

### TimeoutError

**용도**: 요청 타임아웃 시 발생

**속성**:
- `message: string` - 에러 메시지
- `url: string` - 타임아웃된 URL
- `timeoutMs: number` - 타임아웃 시간 (ms)
- `name: 'TimeoutError'`

**발생 시점**:
- 지정된 시간 내 응답 없음

**HTTP 매핑**: 504 Gateway Timeout

**예시**:
```typescript
throw new TimeoutError(
  'Request timed out after 5000ms',
  'https://wine-searcher.com/find/...',
  5000
);
```

### ParsingError

**용도**: HTML 파싱 실패 시 발생

**속성**:
- `message: string` - 에러 메시지
- `sourceUrl: string` - 파싱 실패한 URL
- `name: 'ParsingError'`

**발생 시점**:
- 필수 HTML 요소 없음
- CSS 선택자로 데이터 추출 실패
- 데이터 형식 불일치

**HTTP 매핑**: 500 Internal Server Error

**예시**:
```typescript
throw new ParsingError(
  'Wine name not found in HTML',
  'https://wine-searcher.com/find/...'
);
```

### ValidationError

**용도**: 도메인 규칙 위반 시 발생

**속성**:
- `message: string` - 에러 메시지
- `field: string` - 위반된 필드명
- `name: 'ValidationError'`

**발생 시점**:
- Entity/VO 생성 시 검증 실패
- 비즈니스 규칙 위반

**HTTP 매핑**: 400 Bad Request

**예시**:
```typescript
throw new ValidationError(
  'Wine name cannot be empty',
  'name'
);
```

## Error Hierarchy

```
Error (built-in)
├── NetworkError
├── TimeoutError
├── ParsingError
└── ValidationError
```

모든 도메인 에러는 표준 `Error`를 상속합니다.

## 사용 예시

### CrawlerPort 구현체

```typescript
async fetch(url: string): Promise<string> {
  try {
    const response = await httpClient.get(url);
    return response.data;
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      throw new TimeoutError(`Timeout for ${url}`, url, 5000);
    }
    throw new NetworkError(`Failed to fetch ${url}`, url);
  }
}
```

### ParserPort 구현체

```typescript
async parse(html: string, sourceUrl: string): Promise<WineData> {
  const $ = cheerio.load(html);
  const name = $('.wine-name').text();

  if (!name) {
    throw new ParsingError('Wine name not found', sourceUrl);
  }

  // ...
}
```

### Entity 검증

```typescript
class Wine {
  private validate(): void {
    if (!this.region || this.region.trim().length === 0) {
      throw new ValidationError('Wine region is required', 'region');
    }
  }
}
```

## Exception Filter

Presentation 계층의 `CrawlerExceptionFilter`가 도메인 에러를 HTTP 응답으로 변환합니다.

### 에러 매핑

| Domain Error | HTTP Status | Response Error Type |
|-------------|-------------|---------------------|
| ValidationError | 400 | Bad Request |
| NetworkError | 502 | Bad Gateway |
| NetworkError (404) | 404 | Not Found |
| TimeoutError | 504 | Gateway Timeout |
| ParsingError | 500 | Internal Server Error |

### 응답 예시

```json
{
  "statusCode": 502,
  "message": "Failed to fetch wine data from external source",
  "error": "Bad Gateway",
  "timestamp": "2024-01-15T12:45:30.000Z",
  "path": "/wines/search"
}
```

## 설계 원칙

### 1. 의미 있는 에러 클래스

일반적인 `Error` 대신 도메인 의미를 담은 클래스를 사용합니다.

```typescript
// ✅ Good: 의미 명확
throw new TimeoutError('...', url, timeout);

// ❌ Bad: 의미 불명확
throw new Error('Request failed');
```

### 2. 컨텍스트 정보 포함

에러 메시지뿐 아니라 관련 컨텍스트(URL, 필드명 등)를 포함합니다.

```typescript
class NetworkError extends Error {
  constructor(
    message: string,
    public readonly url: string,  // 컨텍스트
  ) {
    super(message);
  }
}
```

### 3. name 속성 설정

에러 타입 식별을 위해 `name` 속성을 설정합니다.

```typescript
constructor(message: string, url: string) {
  super(message);
  this.name = 'NetworkError';  // 타입 식별
}
```

### 4. Domain 계층에 정의

에러 클래스는 Domain 계층에 정의하여, Application/Infrastructure가 사용합니다.

## 테스트

### 에러 발생 테스트

```typescript
it('타임아웃 시 TimeoutError 발생', async () => {
  mockHttpClient.get.mockRejectedValue({ code: 'ETIMEDOUT' });

  await expect(adapter.fetch(url))
    .rejects
    .toThrow(TimeoutError);
});
```

### 에러 속성 테스트

```typescript
it('TimeoutError는 URL과 타임아웃 정보 포함', async () => {
  try {
    await adapter.fetch(url);
  } catch (error) {
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.url).toBe(url);
    expect(error.timeoutMs).toBe(5000);
  }
});
```

### Exception Filter 테스트

```typescript
it('NetworkError를 502로 변환', () => {
  const error = new NetworkError('Failed', 'http://...');
  const filter = new CrawlerExceptionFilter();

  expect(filter['getHttpStatus'](error)).toBe(502);
});
```

## 확장 가이드

### 새 에러 클래스 추가

1. `crawler.errors.ts`에 클래스 정의
2. `Error` 상속
3. 생성자에서 `super(message)` 호출
4. `this.name` 설정
5. 컨텍스트 속성 추가 (필요 시)
6. Exception Filter에 HTTP 매핑 추가
7. 테스트 작성

### 예시: RateLimitError

```typescript
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly retryAfter: number,  // seconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Exception Filter 매핑
if (exception instanceof RateLimitError) {
  return HttpStatus.TOO_MANY_REQUESTS;  // 429
}
```
