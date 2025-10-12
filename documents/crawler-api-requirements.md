---
title: "WineScope Backend - Wine-Searcher 크롤링 API 요구사항"
author: "WineScope Team"
tags: [requirements, crawler, backend, mvp]
created: 2025-10-12 10:10
updated: 2025-10-12 10:10
---

## User Story

나는 **와인 정보를 찾는 사용자**로서, **와인의 기본 정보(지역, 와이너리, 품종, 빈티지)를 입력하면 Wine-Searcher에서 평점, 가격, 리뷰 데이터를 자동으로 수집**하고 싶다. 그 결과 **여러 사이트를 일일이 방문하지 않고도 통합된 와인 정보를 빠르게 얻을 수 있다**.

## Acceptance Criteria (EARS)

### Ubiquitous

- 시스템은 Wine-Searcher 사이트에서 와인 정보를 크롤링하는 REST API를 제공해야 한다.
- 시스템은 크롤링된 HTML 데이터를 정규화된 JSON 형식으로 반환해야 한다.
- 시스템은 curl-impersonate를 사용하여 TLS 핑거프린트를 모방해야 한다.
- 시스템은 cheerio를 사용하여 SSR HTML을 파싱해야 한다.
- 시스템은 Hexagonal Architecture 원칙에 따라 도메인 로직과 인프라를 분리해야 한다.

### Event

- 사용자가 와인 검색 요청(지역, 와이너리, 품종, 빈티지)을 보내면, 시스템은 Wine-Searcher에 HTTP 요청을 전송해야 한다.
- Wine-Searcher로부터 HTML 응답을 받으면, 시스템은 cheerio로 평점, 가격, RP 점수를 추출해야 한다.
- 크롤링이 성공하면, 시스템은 정규화된 WineResult 객체를 반환해야 한다.
- 크롤링이 실패하면(네트워크 오류, 파싱 오류), 시스템은 명확한 에러 메시지와 함께 HTTP 500/502 상태 코드를 반환해야 한다.
- Wine-Searcher에서 404 응답을 받으면, 시스템은 HTTP 404와 "와인을 찾을 수 없음" 메시지를 반환해야 한다.

### State

- Wine-Searcher가 정상 응답하는 동안, 시스템은 500-1000ms 이내에 응답해야 한다.
- Wine-Searcher가 느리게 응답하는 동안(>5초), 시스템은 타임아웃 처리하고 에러를 반환해야 한다.
- 크롤링 요청이 진행 중인 동안, 시스템은 동일한 와인에 대한 중복 요청을 방지해야 한다(요청 디듀플리케이션).

### Optional

- Rate Limiting이 활성화된 경우, 시스템은 초당 최대 N개의 크롤링 요청만 허용해야 한다.
- User-Agent 로테이션이 활성화된 경우, 시스템은 요청마다 다른 브라우저 User-Agent를 사용해야 한다.
- 캐싱이 활성화된 경우, 시스템은 동일한 와인 정보를 메모리에 캐싱하고 TTL 내에는 재크롤링하지 않아야 한다.

### Unwanted

- HTML 파싱 실패 시, 시스템은 빈 응답을 반환해서는 안 되며, 대신 명확한 에러 메시지를 제공해야 한다.
- Wine-Searcher의 봇 탐지에 차단될 경우, 시스템은 계속 재시도해서는 안 되며, 대신 exponential backoff를 적용해야 한다.
- 크롤링 중 예외 발생 시, 시스템은 민감한 내부 정보(스택 트레이스, 환경 변수)를 클라이언트에 노출해서는 안 된다.
- 잘못된 입력(빈 문자열, null)에 대해, 시스템은 500 에러를 반환해서는 안 되며, 대신 400 Bad Request와 검증 메시지를 반환해야 한다.

## Business Rules

- R1. **크롤링 대상 사이트**: Wine-Searcher ([https://www.wine-searcher.com](https://www.wine-searcher.com))만 지원 (MVP 범위)
- R2. **필수 추출 데이터**: 전문가 평점, Robert Parker(RP) 점수, 평균 가격, 와인 이름, 지역, 빈티지
- R3. **TLS 핑거프린트 모방**: curl-impersonate로 Chrome 또는 Firefox 브라우저를 모방하여 봇 탐지 우회
- R4. **응답 시간 목표**: 첫 요청 1-3초, 캐시 히트 시 500ms 이내 (P95 기준)
- R5. **크롤링 윤리**: robots.txt 존중, 과도한 요청 방지를 위한 Rate Limiting 구현

## Data Contract

### Request Schema (POST /api/wines/search)

```typescript
{
  "region": string,      // 필수, 비어있지 않음, 예: "Napa Valley"
  "winery": string,      // 필수, 비어있지 않음, 예: "Opus One"
  "variety": string,     // 필수, 비어있지 않음, 예: "Cabernet Sauvignon"
  "vintage": number      // 필수, 1900-현재년도, 예: 2018
}
```

**제약 조건**:

- `region`, `winery`, `variety`: 1-100자 이내, 특수문자 허용
- `vintage`: 1900 ≤ vintage ≤ 현재년도 + 5 (미래 빈티지 고려)

### Response Schema (200 OK)

```typescript
{
  "wine": {
    "name": string,           // 와인 전체 이름
    "region": string,         // 지역
    "winery": string,         // 와이너리
    "variety": string,        // 품종
    "vintage": number         // 빈티지 연도
  },
  "ratings": [
    {
      "source": string,       // "Wine-Searcher"
      "score": number,        // 0-100 점수
      "critic": string | null,// "Robert Parker" 등, 없으면 null
      "reviewCount": number   // 리뷰 수
    }
  ],
  "price": {
    "average": number,        // 평균 가격 (USD)
    "currency": string,       // "USD", "EUR" 등
    "priceRange": string | null, // "300-400" 형식, 없으면 null
    "updatedAt": string       // ISO 8601 날짜
  },
  "source": {
    "site": string,           // "Wine-Searcher"
    "url": string,            // 크롤링한 페이지 URL
    "crawledAt": string       // ISO 8601 크롤링 시각
  }
}
```

### Error Schema (4xx, 5xx)

```typescript
{
  "statusCode": number,       // HTTP 상태 코드
  "message": string,          // 사용자 친화적 에러 메시지
  "error": string,            // 에러 타입 ("Bad Request", "Not Found" 등)
  "timestamp": string,        // ISO 8601 에러 발생 시각
  "path": string              // 요청 경로
}
```

**에러 케이스**:

- `400 Bad Request`: 입력 검증 실패 (빈 문자열, 잘못된 빈티지 등)
- `404 Not Found`: Wine-Searcher에서 와인을 찾을 수 없음
- `429 Too Many Requests`: Rate Limit 초과
- `502 Bad Gateway`: Wine-Searcher 접근 실패 (네트워크 오류, 타임아웃)
- `500 Internal Server Error`: HTML 파싱 실패, 예상치 못한 서버 오류

## Non-functional Requirements

### Performance

- **Latency**: P95 ≤ 3초 (첫 요청), P95 ≤ 500ms (캐시 히트)
- **Throughput**: ≥ 10 RPS (requests per second) 지원
- **Timeout**: Wine-Searcher HTTP 요청 타임아웃 5초

### Reliability

- **Availability**: ≥ 99% (Wine-Searcher 가용성에 종속)
- **Error Handling**: 모든 예외 상황에 대해 명확한 에러 메시지 제공
- **Retry Strategy**: 네트워크 오류 시 최대 3회 재시도 (exponential backoff: 1s, 2s, 4s)

### Scalability

- **Memory Usage**: 프로세스당 ≤ 10MB (curl-impersonate 실행 제외)
- **Concurrent Requests**: 최대 50개 동시 크롤링 요청 처리

### Observability

- **Metrics**:
  - `crawler.requests.total`: 총 크롤링 요청 수 (counter)
  - `crawler.requests.duration`: 크롤링 소요 시간 (histogram)
  - `crawler.requests.errors`: 크롤링 실패 수 (counter, error type별)
  - `crawler.cache.hits`: 캐시 히트 수 (counter)
- **Logs**:
  - 모든 크롤링 요청: 입력 와인 정보, 소요 시간
  - 파싱 실패: 실패 원인, HTML 구조 변경 감지
  - Rate Limit 초과: 클라이언트 IP, 요청 횟수
- **Trace**:
  - 분산 추적: 요청 → 크롤링 → 파싱 → 응답 전체 경로 추적

### Security

- **TLS 핑거프린트 모방**: curl-impersonate로 실제 브라우저처럼 행동
- **Rate Limiting**: IP당 분당 최대 N개 요청 (DoS 방지)
- **Input Validation**: SQL Injection, XSS 등 공격 벡터 검증
- **민감 정보 보호**: 에러 응답에 스택 트레이스, 환경 변수 노출 금지

### Maintainability

- **Code Architecture**: Hexagonal Architecture (Ports & Adapters) 준수
- **Test Coverage**: 단위 테스트 ≥ 80%, 통합 테스트 주요 시나리오 커버
- **Configuration**: HTML 선택자를 설정 파일로 분리 (Wine-Searcher 구조 변경 대응)
- **Documentation**: API 스펙 Swagger/OpenAPI 문서화

## Technical Constraints

- **Language**: TypeScript 5.1+
- **Framework**: NestJS 10.x
- **HTTP Client**: curl-impersonate (네이티브 바이너리)
- **HTML Parser**: cheerio
- **Node.js**: v20.x LTS
- **Package Manager**: pnpm

## Dependencies

- **External Service**: Wine-Searcher (<https://www.wine-searcher.com>)
  - 가용성: Wine-Searcher 다운타임 시 서비스 불가
  - HTML 구조 변경: 파싱 로직 수정 필요 (유지보수 부담)
- **System Binary**: curl-impersonate
  - 설치 필요: macOS/Linux에 사전 설치 또는 Docker 이미지에 포함
  - 플랫폼 종속성: Windows는 별도 지원 필요

## Out of Scope (MVP 범위 외)

- Vivino, Cellar Tracker 등 다른 사이트 크롤링
- 데이터베이스 저장 (인메모리 캐시만 사용)
- 사용자 인증/인가
- Frontend UI (Backend API만 제공)
- 실시간 가격 업데이트 알림
- 와인 추천 알고리즘
