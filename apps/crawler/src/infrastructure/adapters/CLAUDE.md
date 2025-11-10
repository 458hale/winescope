# Infrastructure Adapters

Domain의 Port 인터페이스를 구체적으로 구현하는 Adapter들입니다.

## 파일 구조

```
adapters/
├── curl-crawler.adapter.ts        # CrawlerPort 구현
└── curl-crawler.adapter.spec.ts   # 단위 테스트
```

## CurlCrawlerAdapter

**구현**: `CrawlerPort` 인터페이스

**기술**: curl-impersonate (브라우저 핑거프린트 위장)

### 핵심 메서드

```typescript
async fetch(url: string, options: CrawlOptions = {}): Promise<string>
```

**파라미터**:
- `url`: 크롤링할 URL
- `options`: 선택적 설정 (browser, timeout, headers, userAgent)

**반환**: HTML 문자열

**에러**:
- `NetworkError`: 네트워크 오류
- `TimeoutError`: 타임아웃 발생

### 실행 프로세스

1. **curl 명령어 생성**: `buildCurlCommand()`
   - 브라우저 프로필 선택 (curl_chrome116 등)
   - 타임아웃 설정 (--max-time)
   - 커스텀 헤더 추가 (-H)
   - User-Agent 설정 (-A)

2. **명령어 실행**: `execAsync()`
   - Node.js child_process 사용
   - 비동기 실행
   - 최대 버퍼: 10MB

3. **응답 검증**:
   - 빈 응답 확인
   - stderr 경고 로깅

4. **에러 처리**:
   - 타임아웃 감지 (ETIMEDOUT)
   - 일반 네트워크 에러 변환

### curl-impersonate

**목적**: 일반 curl은 봇으로 감지되므로 브라우저를 위장합니다.

**브라우저 프로필**:
```bash
curl_chrome116   # Chrome 116 (기본값)
curl_chrome110   # Chrome 110
curl_firefox109  # Firefox 109
```

**명령어 예시**:
```bash
curl_chrome116 -s -L "https://wine-searcher.com/find/..." \
  --max-time 5 \
  -H "Accept-Language: en-US"
```

**옵션**:
- `-s`: Silent mode (progress bar 숨김)
- `-L`: 리다이렉트 따라가기
- `--max-time`: 타임아웃 (초 단위)
- `-H`: 커스텀 헤더
- `-A`: User-Agent

### Command Injection 방어

**escapeShellArg()**: Shell 특수문자를 이스케이프합니다.

```typescript
private escapeShellArg(arg: string): string {
  return arg
    .replace(/\\/g, '\\\\')    // backslash
    .replace(/"/g, '\\"')      // double quotes
    .replace(/\$/g, '\\$')     // dollar signs (변수 확장 방지)
    .replace(/`/g, '\\`')      // backticks (명령 치환 방지)
    .replace(/;/g, '\\;')      // semicolons (명령 구분자)
    .replace(/&/g, '\\&')      // ampersands (백그라운드 실행)
    .replace(/\|/g, '\\|')     // pipes (명령 파이프)
    .replace(/>/g, '\\>')      // redirects
    .replace(/</g, '\\<');     // redirects
}
```

**위협 시나리오**:
```typescript
// ❌ 위험: Command Injection 취약점
const url = "https://example.com; rm -rf /";
const command = `curl ${url}`;  // 명령어 실행됨!

// ✅ 안전: 이스케이프 적용
const escaped = escapeShellArg(url);
const command = `curl "${escaped}"`;  // 안전
```

### 타임아웃 처리

**기본값**: 5000ms (5초)

**구현**:
```typescript
const timeout = options.timeout || 5000;

await execAsync(curlCommand, {
  timeout,  // 밀리초 단위
  maxBuffer: 10 * 1024 * 1024,
});
```

**curl 옵션**: `--max-time ${Math.ceil(timeout / 1000)}`
- execAsync와 curl 모두에 타임아웃 적용
- ms → s 변환 (올림)

**에러 감지**:
```typescript
if (error.message.includes('ETIMEDOUT') ||
    error.message.includes('timeout')) {
  throw new TimeoutError(`Timeout after ${timeout}ms`, url, timeout);
}
```

### 로깅

```typescript
this.logger.debug(`Fetching URL: ${url} with browser: ${browser}, timeout: ${timeout}ms`);
this.logger.warn(`curl-impersonate stderr: ${stderr}`);
this.logger.debug(`Successfully fetched ${stdout.length} bytes from ${url}`);
```

**로그 레벨**:
- `debug`: 요청 시작, 응답 크기
- `warn`: stderr 출력

## 설치 가이드

### curl-impersonate 설치

**macOS**:
```bash
brew install curl-impersonate
```

**Linux (Ubuntu/Debian)**:
```bash
# 릴리스 페이지에서 바이너리 다운로드
wget https://github.com/lwthiker/curl-impersonate/releases/download/v0.5.4/curl-impersonate-v0.5.4.x86_64-linux-gnu.tar.gz
tar -xzf curl-impersonate-v0.5.4.x86_64-linux-gnu.tar.gz
sudo cp curl-impersonate-chrome/curl_chrome116 /usr/local/bin/
```

**Docker**:
```dockerfile
FROM node:20-alpine

# curl-impersonate 설치
RUN apk add --no-cache curl-impersonate

WORKDIR /app
COPY . .
RUN pnpm install
```

### 설치 확인

```bash
curl_chrome116 --version
```

## 테스트

### 단위 테스트

```typescript
describe('CurlCrawlerAdapter', () => {
  let adapter: CurlCrawlerAdapter;

  beforeEach(() => {
    adapter = new CurlCrawlerAdapter();
  });

  it('HTML을 성공적으로 가져온다', async () => {
    const html = await adapter.fetch('https://example.com');
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('타임아웃 시 TimeoutError 발생', async () => {
    await expect(
      adapter.fetch('https://httpbin.org/delay/10', { timeout: 1000 })
    ).rejects.toThrow(TimeoutError);
  });

  it('존재하지 않는 URL은 NetworkError 발생', async () => {
    await expect(
      adapter.fetch('https://this-domain-does-not-exist-12345.com')
    ).rejects.toThrow(NetworkError);
  });
});
```

### Mock 테스트

```typescript
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, opts, callback) => {
    callback(null, { stdout: '<html>Mock HTML</html>', stderr: '' });
  }),
}));

it('curl 명령어를 올바르게 생성한다', async () => {
  const execMock = require('child_process').exec;
  await adapter.fetch('https://example.com', { browser: 'chrome116' });

  expect(execMock).toHaveBeenCalledWith(
    expect.stringContaining('curl_chrome116'),
    expect.any(Object),
    expect.any(Function)
  );
});
```

## 대안 Adapter

### AxiosCrawlerAdapter (예시)

```typescript
@Injectable()
export class AxiosCrawlerAdapter implements CrawlerPort {
  async fetch(url: string, options?: CrawlOptions): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: options?.timeout || 5000,
        headers: options?.headers,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new TimeoutError('Request timeout', url, options?.timeout || 5000);
      }
      throw new NetworkError('Network error', url);
    }
  }
}
```

### PuppeteerCrawlerAdapter (예시)

JavaScript 렌더링이 필요한 동적 페이지용:

```typescript
@Injectable()
export class PuppeteerCrawlerAdapter implements CrawlerPort {
  async fetch(url: string, options?: CrawlOptions): Promise<string> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await page.goto(url, { timeout: options?.timeout || 30000 });
      const html = await page.content();
      return html;
    } finally {
      await browser.close();
    }
  }
}
```

## 확장 가이드

### 새 Adapter 추가

1. `adapters/` 디렉토리에 파일 생성
2. Port 인터페이스 구현
3. `@Injectable()` 데코레이터 추가
4. 에러 처리 (NetworkError, TimeoutError)
5. 단위 테스트 작성
6. Module에 Provider 등록

### Adapter 교체

```typescript
// 개발 환경
{ provide: 'CrawlerPort', useClass: MockCrawlerAdapter }

// 프로덕션
{ provide: 'CrawlerPort', useClass: CurlCrawlerAdapter }

// JavaScript 렌더링 필요 시
{ provide: 'CrawlerPort', useClass: PuppeteerCrawlerAdapter }
```
