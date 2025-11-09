# Docker 환경 구축 가이드 - Monorepo 구조

## 개요

WineScope Monorepo를 로컬 Docker 환경에서 실행하기 위한 가이드입니다.

이 프로젝트는 **마이크로서비스 아키텍처**를 채택하여 두 개의 독립적인 서비스로 구성됩니다:

- **API Service** (ARM64): 메인 WineScope 백엔드 서비스
- **Crawler Service** (AMD64): curl-impersonate 기반 웹 크롤링 서비스

## 사전 요구사항

- Docker Desktop 설치 (Mac: Apple Silicon 또는 Intel)
- pnpm 10.18.2+ (로컬 개발 시)

## 빠른 시작

### 1. 프로덕션 모드 실행

```bash
# 모든 서비스 빌드 및 실행
pnpm run docker:up

# 로그 확인
pnpm run docker:logs

# API 서비스 테스트
curl http://localhost:3000

# Crawler 서비스 Health Check
curl http://localhost:3001/crawl/health
```

### 2. 개발 모드 실행 (Hot Reload)

```bash
# 개발 모드로 실행 (소스 코드 변경 시 자동 재시작)
pnpm run docker:up:dev

# 로그 확인
pnpm run docker:logs
```

### 3. 디버그 모드 실행 (VSCode Cursor 디버깅)

```bash
# 디버그 모드로 실행 (디버거 포트 9229 노출)
pnpm run debug:start

# VSCode Cursor에서 디버거 연결
# 1. F5 키 누르기
# 2. "Docker: Attach to API (Debug Mode)" 선택
# 3. 브레이크포인트 설정 후 API 호출

# 자세한 내용은 documents/docker-local-development-guide.md 참고
```

### 4. 컨테이너 종료

```bash
# 컨테이너 종료
pnpm run docker:down

# 이미지까지 완전히 삭제
pnpm run docker:clean
```

## 사용 가능한 Docker 명령어

```bash
# 이미지 빌드
pnpm run docker:build              # 모든 서비스 빌드
pnpm run docker:build:api          # API 서비스만 빌드 (ARM64)
pnpm run docker:build:crawler      # Crawler 서비스만 빌드 (AMD64)

# 컨테이너 실행
pnpm run docker:up                 # 프로덕션 모드 (백그라운드)
pnpm run docker:up:dev             # 개발 모드 (Hot Reload)
pnpm run docker:debug              # 디버그 모드 (디버거 포트 9229)
pnpm run docker:debug:build        # 디버그 모드 (이미지 재빌드)

# 개발 환경 빠른 시작/종료
pnpm run dev:start                 # 개발 환경 시작 (스크립트)
pnpm run dev:stop                  # 개발 환경 종료 (스크립트)
pnpm run debug:start               # 디버그 환경 시작 (스크립트)

# 컨테이너 관리
pnpm run docker:down               # 모든 컨테이너 종료
pnpm run docker:logs               # 모든 서비스 로그 확인
pnpm run docker:logs:api           # API 개발 모드 로그
pnpm run docker:logs:api:debug     # API 디버그 모드 로그
pnpm run docker:logs:crawler       # Crawler 서비스 로그

# 컨테이너 쉘 접속
pnpm run docker:shell:api          # API 개발 모드 쉘 접속
pnpm run docker:shell:api:debug    # API 디버그 모드 쉘 접속
pnpm run docker:shell:crawler      # Crawler 컨테이너 쉘 접속

# curl-impersonate 테스트
pnpm run docker:test:curl          # curl-impersonate 버전 확인

# 완전 삭제
pnpm run docker:clean              # 컨테이너, 볼륨, 이미지 모두 삭제
```

## Monorepo 아키텍처

### 프로젝트 구조

```
winescope-monorepo/
├── apps/
│   ├── api/                    # API Service (ARM64)
│   │   ├── src/
│   │   ├── test/
│   │   └── Dockerfile          # ARM64 최적화 Dockerfile
│   └── crawler/                # Crawler Service (AMD64)
│       ├── src/
│       ├── test/
│       └── Dockerfile          # AMD64 + curl-impersonate Dockerfile
├── libs/
│   ├── contracts/              # 공유 인터페이스 및 DTO
│   │   └── src/
│   │       └── crawler/
│   │           ├── crawler.interface.ts
│   │           ├── crawl-request.dto.ts
│   │           └── crawl-response.dto.ts
│   └── common/                 # 공유 유틸리티 및 상수
│       └── src/
│           └── constants/
│               └── crawler.constants.ts
├── docker-compose.yml          # Multi-service orchestration
└── DOCKER.md                   # 본 문서
```

### 서비스 간 통신

API Service와 Crawler Service는 **REST API**로 통신합니다:

```typescript
// API Service에서 Crawler Service 호출 예시
const response = await fetch('http://crawler:3001/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.wine-searcher.com/find/...',
    browser: 'chrome116',
    timeout: 5000
  })
});

const result = await response.json();
// { html: '...', statusCode: 200, timestamp: '...', duration: 1234 }
```

향후 **gRPC** 및 **Message Queue**로 단계적 전환 예정입니다.

## Docker Compose 서비스

### api (프로덕션, ARM64)

- **포트**: 3000:3000
- **환경**: NODE_ENV=production
- **플랫폼**: ARM64 네이티브 (Apple Silicon 최적화)
- **의존성**: crawler 서비스 healthy 상태 필요
- **실행 명령**: `docker compose up api`

### crawler (프로덕션, AMD64 + curl-impersonate)

- **포트**: 3001:3001
- **환경**: NODE_ENV=production
- **플랫폼**: AMD64 (Rosetta 2 에뮬레이션)
- **curl-impersonate**: ✅ 포함 (Chrome 116)
- **실행 명령**: `docker compose up crawler`

### api-dev (개발, ARM64)

- **포트**: 3000:3000
- **환경**: NODE_ENV=development
- **플랫폼**: ARM64 네이티브
- **볼륨 마운트**: `./apps/api/src`, `./libs` (Hot Reload)
- **실행 명령**: `docker compose --profile development up api-dev`

### crawler-dev (개발, AMD64)

- **포트**: 3001:3001
- **환경**: NODE_ENV=development
- **플랫폼**: AMD64
- **볼륨 마운트**: `./apps/crawler/src`, `./libs` (Hot Reload)
- **실행 명령**: `docker compose --profile development up crawler-dev`

### api-debug (디버그, ARM64)

- **포트**: 3000:3000, 9229:9229 (디버거)
- **환경**: NODE_ENV=development
- **플랫폼**: ARM64 네이티브
- **볼륨 마운트**: `./apps/api/src`, `./libs` (Hot Reload)
- **디버거 지원**: ✅ VSCode Cursor 연결 가능
- **실행 명령**: `docker compose --profile debug up api-debug`

> **참고**: Docker Compose V2 문법 (`docker compose`)을 사용합니다. 구버전 `docker-compose` 명령어는 deprecated되었습니다.

## curl-impersonate 지원

### 아키텍처 결정: 마이크로서비스 분리

**문제**: Apple Silicon (ARM64)에서 curl-impersonate AMD64 바이너리 호환성 이슈

**해결책**: 서비스 분리 및 네트워크 통신

#### 구현된 해결 방법

1. **Crawler Service (AMD64 전용)**:
   - 모든 stage에서 `--platform=linux/amd64` 명시
   - curl-impersonate 바이너리 포함
   - 독립적인 REST API 제공

2. **API Service (ARM64 네이티브)**:
   - 네이티브 ARM64 실행으로 최고 성능
   - Crawler Service와 HTTP 통신
   - curl-impersonate 의존성 없음

3. **docker-compose.yml**:
   - 서비스 간 네트워크 구성
   - Health check 기반 의존성 관리
   - 프로덕션/개발 모드 분리

#### 성능 특성 비교

| 항목 | API Service (ARM64) | Crawler Service (AMD64) |
|------|---------------------|-------------------------|
| **NestJS 실행** | 네이티브 (빠름) | Rosetta 2 (약간 느림) |
| **curl-impersonate** | ❌ 없음 (네트워크 호출) | ✅ 정상 작동 |
| **빌드 시간** | ~30초 | ~40초 (크로스 빌드) |
| **메모리 사용** | ~150MB | ~150MB |
| **권장 용도** | API, 비즈니스 로직 | 크롤링 전용 |

### curl-impersonate 테스트 예제

```bash
# 모든 서비스 시작
pnpm run docker:up

# curl-impersonate 버전 확인
pnpm run docker:test:curl
# 출력: curl 8.1.1 (x86_64-pc-linux-musl) libcurl/8.1.1 BoringSSL...

# Crawler 컨테이너 내부에서 직접 테스트
docker exec -it winescope-crawler sh
curl_chrome116 -V
curl_chrome116 -s -I https://www.wine-searcher.com

# 종료
pnpm run docker:down
```

### Crawler Service API 사용법

```bash
# Health Check
curl http://localhost:3001/crawl/health

# 크롤링 요청
curl -X POST http://localhost:3001/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.wine-searcher.com",
    "browser": "chrome116",
    "timeout": 5000
  }'

# 응답 예시:
# {
#   "html": "<!DOCTYPE html>...",
#   "statusCode": 200,
#   "headers": {},
#   "timestamp": "2025-01-21T10:30:00.000Z",
#   "duration": 1234
# }
```

## Dockerfile 구조

### apps/api/Dockerfile (ARM64 최적화)

**용도**: API 서버 실행 (curl-impersonate 불필요)

1. **deps**: pnpm 의존성 설치
2. **builder**: TypeScript → JavaScript 빌드
3. **debug**: 개발 이미지 + 디버거 지원 (포트 9229)
4. **production**: 최종 경량 이미지 (Node.js 22 Alpine)

**특징**:

- ARM64 네이티브 실행 (Apple Silicon 최적화)
- curl-impersonate 미포함 (경량화)
- 빠른 빌드 및 실행 속도
- **디버그 모드**: VSCode Cursor 디버거 연결 지원

### apps/crawler/Dockerfile (curl-impersonate 지원)

**용도**: 크롤링 기능 전용 서비스

1. **deps**: pnpm 의존성 설치 (AMD64)
2. **builder**: TypeScript → JavaScript 빌드 (AMD64)
3. **curl-impersonate**: Chrome 브라우저 TLS 핑거프린트 바이너리 (AMD64)
4. **production**: 최종 이미지 + curl-impersonate (AMD64)

**특징**:

- 모든 stage에서 `--platform=linux/amd64` 명시
- curl-impersonate 완전 호환
- Apple Silicon에서 Rosetta 2 사용 (약간의 성능 오버헤드)
- REST API 엔드포인트 제공

### 보안 기능

- Non-root user (nestjs:1001) 실행
- Alpine Linux 기반 최소 패키지
- 프로덕션 의존성만 설치
- Health check 자동 실행

### 최적화

- 레이어 캐싱으로 빌드 속도 향상
- pnpm store prune으로 디스크 사용량 최소화
- .dockerignore로 불필요한 파일 제외
- 멀티 스테이지 빌드로 이미지 크기 최소화

## 트러블슈팅

### 포트 3000 또는 3001이 이미 사용 중

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :3001

# 기존 컨테이너 종료
pnpm run docker:down
```

### 빌드 캐시 문제

```bash
# 캐시 없이 재빌드
docker compose build --no-cache

# 특정 서비스만 재빌드
docker compose build --no-cache api
docker compose build --no-cache crawler
```

### curl-impersonate 작동 확인

```bash
# 1. Crawler 컨테이너 실행 확인
docker compose ps
# winescope-crawler가 "healthy" 상태여야 함

# 2. curl-impersonate 버전 확인
pnpm run docker:test:curl

# 3. 실제 크롤링 테스트
docker exec winescope-crawler curl_chrome116 -s https://example.com

# 4. 로그 확인 (에러 메시지 확인)
pnpm run docker:logs:crawler
```

### 서비스 간 통신 문제

```bash
# API 서비스에서 Crawler 서비스 연결 확인
docker exec -it winescope-api sh
wget -O- http://crawler:3001/crawl/health

# 네트워크 확인
docker network inspect winescope-monorepo_winescope-network
```

### Rosetta 2 성능 이슈

Crawler Service (AMD64)가 느린 경우:

```bash
# 개발 단계에서는 로컬 실행 고려
pnpm install
pnpm run start:dev crawler

# 프로덕션 환경에서는 Linux AMD64 서버 사용 권장
```

### Apple Silicon 플랫폼 경고

```text
The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8)
```

**정상 동작**: Rosetta 2를 통해 AMD64 이미지가 ARM64에서 실행됨을 알리는 정보성 메시지입니다. 무시해도 됩니다.

## 다음 단계

### Phase 1 - 현재 상태 (REST API)

✅ API Service와 Crawler Service 분리
✅ REST API로 서비스 간 통신
✅ curl-impersonate 정상 작동
⏳ API Service에서 Crawler Service 호출 구현

```bash
# API Service 구현 예정
# apps/api/src/crawler/crawler.client.ts
```

### Phase 2 - gRPC 전환

- Protocol Buffers 정의
- gRPC 서버/클라이언트 구현
- 성능 비교 및 최적화

### Phase 3 - Message Queue 도입

- RabbitMQ 또는 Redis Queue 추가
- 비동기 크롤링 처리
- 작업 큐 관리 및 모니터링

### Phase 4 - Production 배포

- CI/CD 파이프라인 구축
- GitHub Actions 멀티플랫폼 빌드
- Docker Hub 자동 배포
- Linux 서버 배포 (ARM64/AMD64 모두 지원)

## 프로덕션 배포

### Linux 서버 (권장)

```bash
# AMD64 Linux 서버
docker compose -f docker-compose.yml up -d

# ARM64 Linux 서버 (AWS Graviton, Raspberry Pi)
# Crawler Service는 여전히 AMD64로 실행됨 (QEMU 사용)
docker compose -f docker-compose.yml up -d
```

### 클라우드 플랫폼

- **AWS ECS/Fargate**: 멀티 컨테이너 태스크 정의 사용
- **Google Cloud Run**: 각 서비스를 별도 Cloud Run 서비스로 배포
- **Fly.io**: 멀티플랫폼 자동 감지 및 배포

## VSCode Cursor 디버깅

### 빠른 시작

```bash
# 1. 디버그 모드 시작
pnpm run debug:start

# 2. VSCode Cursor에서 F5 누르기
# 3. "Docker: Attach to API (Debug Mode)" 선택
# 4. 브레이크포인트 설정 후 API 호출
curl http://localhost:3000
```

### 디버깅 기능

- ✅ **Hot Reload**: 코드 변경 시 자동 재시작
- ✅ **브레이크포인트**: 코드 실행 중지 및 검사
- ✅ **변수 검사**: 실시간 변수 값 확인
- ✅ **단계별 실행**: Step Over, Step Into, Step Out
- ✅ **Watch 표현식**: 특정 표현식 모니터링
- ✅ **Debug Console**: 런타임 코드 실행

### 자세한 가이드

완전한 디버깅 가이드는 [Docker 로컬 개발 환경 완전 가이드](documents/docker-local-development-guide.md)를 참고하세요.

## 환경 변수 관리

### 환경 변수 파일

```
.env.example          # 템플릿 (Git 커밋됨)
.env.development      # 로컬 개발용
.env.docker          # Docker 개발용
.env.production      # 프로덕션용
```

### 사용 예시

```bash
# .env.docker
NODE_ENV=development
PORT=3000
CRAWLER_SERVICE_URL=http://crawler:3001
LOG_LEVEL=debug
```

### 보안

- ⚠️ `.env.*` 파일은 Git에 커밋하지 않음
- ✅ `.env.example`만 Git에 커밋 (템플릿용)

## 참고 자료

### 공식 문서

- [NestJS Monorepo 공식 가이드](https://docs.nestjs.com/cli/monorepo)
- [NestJS Docker 공식 가이드](https://docs.nestjs.com/deployment)
- [curl-impersonate GitHub](https://github.com/lwthiker/curl-impersonate)
- [Docker Multi-platform Build](https://docs.docker.com/build/building/multi-platform/)
- [VSCode 디버깅 가이드](https://code.visualstudio.com/docs/editor/debugging)

### 프로젝트 문서

- [Docker 로컬 개발 환경 완전 가이드](documents/docker-local-development-guide.md) - **디버깅 완전 가이드**
- [WineScope PRD](documents/winescope-prd.md) - 프로젝트 요구사항 문서
- [CLAUDE.md](CLAUDE.md) - 프로젝트 개요 및 개발 가이드
