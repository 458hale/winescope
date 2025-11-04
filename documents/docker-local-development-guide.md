# Docker 로컬 개발 환경 완전 가이드 - VSCode Cursor 통합 디버깅

WineScope API 앱을 Docker 환경에서 개발하고 디버깅하는 완전 가이드입니다.

## 목차

1. [개요](#개요)
2. [빠른 시작](#빠른-시작)
3. [개발 모드별 사용법](#개발-모드별-사용법)
4. [VSCode Cursor 디버깅 완전 가이드](#vscode-cursor-디버깅-완전-가이드)
5. [환경 변수 관리](#환경-변수-관리)
6. [트러블슈팅](#트러블슈팅)
7. [Best Practices](#best-practices)

---

## 개요

### Docker 환경에서 개발하는 이유

#### 장점
- ✅ **환경 일관성**: 모든 개발자가 동일한 환경에서 작업
- ✅ **빠른 온보딩**: 신규 개발자가 5분 내 개발 환경 구축
- ✅ **격리된 환경**: 로컬 시스템에 영향 없이 개발
- ✅ **프로덕션 유사성**: 프로덕션과 동일한 환경에서 테스트
- ✅ **의존성 관리**: 모든 서비스(API, Crawler)가 자동으로 시작

#### 이 가이드에서 배울 것
- 로컬에서 개발한 코드를 Docker에서 실행 (Hot Reload)
- 로컬에서 API 요청을 Docker 컨테이너로 전송
- VSCode Cursor에서 Docker 내부 앱을 실시간 디버깅

---

## 빠른 시작

### 사전 요구사항
- Docker Desktop 설치 및 실행 중
- pnpm 10.18.2+ 설치
- VSCode Cursor 설치

### 3단계 시작

#### 1단계: 개발 환경 시작
```bash
# 방법 1: 스크립트 사용 (권장)
pnpm run dev:start

# 방법 2: 직접 명령어 실행
pnpm run docker:up:dev
```

#### 2단계: 서비스 확인
```bash
# API 서비스 테스트
curl http://localhost:3000

# Crawler 서비스 테스트
curl http://localhost:3001/crawl/health
```

#### 3단계: 코드 수정 및 Hot Reload 확인
```bash
# apps/api/src/app.controller.ts 파일 수정
# → Docker 컨테이너가 자동으로 재시작 (2-3초)
# → 변경사항이 즉시 반영됨
```

---

## 개발 모드별 사용법

### 1. 개발 모드 (Hot Reload)

**용도**: 일반적인 개발 작업, 코드 변경 시 자동 재시작

#### 시작 방법
```bash
# 스크립트 사용 (권장)
pnpm run dev:start

# 또는 직접 명령어
pnpm run docker:up:dev
```

#### 특징
- ✅ 소스 코드 변경 시 자동 재시작 (Hot Reload)
- ✅ 로컬 파일이 Docker 컨테이너에 마운트됨
- ✅ API (3000) + Crawler (3001) 서비스 모두 실행
- ⚠️ 디버거 포트 없음 (브레이크포인트 불가)

#### 로그 확인
```bash
# 모든 서비스 로그
pnpm run docker:logs

# API 서비스 로그만
pnpm run docker:logs:api
```

#### 종료
```bash
pnpm run dev:stop
# 또는
pnpm run docker:down
```

---

### 2. 디버그 모드 (VSCode Cursor 연결)

**용도**: 브레이크포인트를 사용한 단계별 디버깅

#### 시작 방법
```bash
# 스크립트 사용 (권장)
pnpm run debug:start

# 또는 직접 명령어
pnpm run docker:debug
```

#### 특징
- ✅ Hot Reload 지원
- ✅ 디버거 포트 9229 노출
- ✅ VSCode Cursor에서 브레이크포인트 설정 가능
- ✅ 변수 검사 및 단계별 실행 가능

#### VSCode Cursor 디버거 연결
```bash
# 1. 디버그 모드 시작
pnpm run debug:start

# 2. VSCode Cursor에서
#    - F5 누르기
#    - "Docker: Attach to API (Debug Mode)" 선택

# 3. 브레이크포인트 설정
#    - apps/api/src/app.controller.ts 파일 열기
#    - 라인 번호 왼쪽 클릭하여 브레이크포인트 설정

# 4. API 호출하여 브레이크포인트 트리거
curl http://localhost:3000
```

#### 로그 확인
```bash
pnpm run docker:logs:api:debug
```

#### 종료
```bash
pnpm run docker:down
```

---

### 3. 하이브리드 모드 (로컬 개발 + Docker 의존성)

**용도**: API를 로컬에서 개발하고, Crawler만 Docker에서 실행

#### 시작 방법
```bash
# 1. Crawler만 Docker에서 실행
docker compose up crawler -d

# 2. 로컬에서 API 개발
cd apps/api
cp ../../.env.development .env
pnpm run start:debug

# 3. VSCode Cursor 디버거 연결
#    - F5 누르기
#    - "Local: Debug API" 선택
```

#### 장점
- ✅ 로컬에서 더 빠른 개발 속도
- ✅ IDE 통합이 더 원활함
- ✅ 파일 시스템 접근이 더 빠름

#### 단점
- ⚠️ 로컬 환경 설정 필요 (Node.js, pnpm)
- ⚠️ 환경 차이로 인한 잠재적 이슈

---

## VSCode Cursor 디버깅 완전 가이드

### 1단계: 디버그 환경 시작

```bash
pnpm run debug:start
```

출력 예시:
```
🐛 Starting WineScope Debug Environment...
📦 Starting Docker services in debug mode...
✅ Debug environment started successfully!

📊 API Service: http://localhost:3000
🐛 Debugger Port: 9229
🕷️  Crawler Service: http://localhost:3001
```

---

### 2단계: VSCode Cursor 디버거 연결

#### 방법 1: 자동 연결 (권장)
1. VSCode Cursor에서 **F5** 키 누르기
2. **"Docker: Attach to API (Debug Mode)"** 선택
3. 자동으로 Docker 컨테이너에 연결됨

#### 방법 2: 수동 연결
1. VSCode Cursor에서 **Run > Start Debugging** 클릭
2. **"Docker: Attach to API (Manual)"** 선택
3. 포트 9229로 연결 확인

#### 연결 성공 확인
- VSCode Cursor 하단 상태바에 주황색 표시
- Debug Console에 연결 메시지 출력

---

### 3단계: 브레이크포인트 설정

#### 브레이크포인트 설정 방법
1. 디버깅하려는 파일 열기 (예: `apps/api/src/app.controller.ts`)
2. 라인 번호 **왼쪽 클릭** → 빨간 점 생성
3. 또는 **F9** 키로 현재 라인에 브레이크포인트 토글

#### 예시 코드
```typescript
// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    const message = this.appService.getHello(); // ← 여기에 브레이크포인트 설정
    return message;
  }
}
```

---

### 4단계: 디버깅 시작

#### API 호출하여 브레이크포인트 트리거
```bash
curl http://localhost:3000
```

#### VSCode Cursor에서 확인할 것
1. **코드 실행 멈춤**: 브레이크포인트 라인에서 실행 중지
2. **변수 패널**: 현재 스코프의 모든 변수 확인
3. **콜 스택**: 함수 호출 경로 확인
4. **Watch**: 특정 표현식 모니터링

---

### 5단계: 단계별 실행

#### 디버깅 컨트롤
| 버튼 | 단축키 | 설명 |
|------|--------|------|
| **Continue** | F5 | 다음 브레이크포인트까지 실행 |
| **Step Over** | F10 | 현재 라인 실행 후 다음 라인으로 |
| **Step Into** | F11 | 함수 내부로 진입 |
| **Step Out** | Shift+F11 | 현재 함수에서 빠져나감 |
| **Restart** | Ctrl+Shift+F5 | 디버깅 세션 재시작 |
| **Stop** | Shift+F5 | 디버깅 중지 |

#### 변수 검사
1. **Variables 패널**: 자동으로 모든 변수 표시
2. **마우스 오버**: 변수 위에 마우스를 올려 값 확인
3. **Debug Console**: 표현식 입력하여 즉시 평가

#### Debug Console 사용 예시
```typescript
// Debug Console에서 실행
message
// 출력: "Hello World!"

this.appService.getHello()
// 출력: "Hello World!"

message.toUpperCase()
// 출력: "HELLO WORLD!"
```

---

### 6단계: Watch 표현식 추가

#### Watch 사용법
1. **Watch 패널** 열기
2. **+ 아이콘** 클릭
3. 모니터링할 표현식 입력

#### 유용한 Watch 표현식 예시
```typescript
message                    // 변수 값 모니터링
message.length            // 속성 모니터링
this.appService           // 객체 전체 모니터링
process.env.NODE_ENV      // 환경 변수 확인
```

---

### 7단계: 조건부 브레이크포인트

#### 설정 방법
1. 브레이크포인트 **우클릭**
2. **Edit Breakpoint...** 선택
3. 조건식 입력

#### 예시
```typescript
// message가 특정 값일 때만 멈춤
message === "Hello World!"

// 특정 반복에서만 멈춤
i > 10

// 복잡한 조건
user && user.role === 'admin'
```

---

### 8단계: Logpoint 사용

#### Logpoint란?
코드를 수정하지 않고 로그를 출력하는 비침투적 디버깅 방법

#### 설정 방법
1. 라인 번호 **우클릭**
2. **Add Logpoint...** 선택
3. 로그 메시지 입력

#### 예시
```typescript
// Logpoint 메시지
Message value: {message}
Service: {this.appService}
```

---

## 환경 변수 관리

### 환경 변수 파일 구조

```
.env.example          # 템플릿 (Git 커밋됨)
.env.development      # 로컬 개발용
.env.docker          # Docker 개발용
.env.production      # 프로덕션용
```

### 파일별 용도

#### `.env.development` (로컬 개발)
```bash
NODE_ENV=development
PORT=3000
CRAWLER_SERVICE_URL=http://localhost:3001
LOG_LEVEL=debug
```

#### `.env.docker` (Docker 개발)
```bash
NODE_ENV=development
PORT=3000
CRAWLER_SERVICE_URL=http://crawler:3001  # Docker 네트워크 내부
LOG_LEVEL=debug
```

#### `.env.production` (프로덕션)
```bash
NODE_ENV=production
PORT=3000
CRAWLER_SERVICE_URL=http://crawler:3001
LOG_LEVEL=info
```

### 환경 변수 사용 예시

#### NestJS에서 환경 변수 사용
```typescript
// apps/api/src/main.ts
const port = parseInt(process.env.PORT || '3000', 10);
const crawlerUrl = process.env.CRAWLER_SERVICE_URL;
```

### 보안 주의사항
- ⚠️ `.env.*` 파일은 Git에 커밋하지 않음 (`.gitignore`에 포함)
- ✅ `.env.example`만 Git에 커밋 (팀원들을 위한 템플릿)
- ⚠️ 민감한 정보(API 키, 비밀번호)는 절대 하드코딩하지 않음

---

## 트러블슈팅

### 1. 디버거가 연결되지 않음

#### 증상
VSCode Cursor에서 "Could not connect to debug target" 오류

#### 해결 방법
```bash
# 1. 디버그 서비스가 실행 중인지 확인
docker compose ps

# 2. 포트 9229가 열려 있는지 확인
lsof -i :9229

# 3. 디버그 로그 확인
pnpm run docker:logs:api:debug

# 4. 디버그 서비스 재시작
pnpm run docker:down
pnpm run debug:start
```

---

### 2. Hot Reload가 작동하지 않음

#### 증상
코드를 수정해도 Docker 컨테이너가 재시작되지 않음

#### 해결 방법
```bash
# 1. 볼륨 마운트 확인
docker inspect winescope-api-dev | grep Mounts -A 20

# 2. 컨테이너 로그 확인
pnpm run docker:logs:api

# 3. 컨테이너 재시작
pnpm run docker:down
pnpm run dev:start
```

---

### 3. 포트 충돌 오류

#### 증상
"Port 3000 is already in use" 오류

#### 해결 방법
```bash
# 1. 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :3001
lsof -i :9229

# 2. 프로세스 종료
kill -9 <PID>

# 3. Docker 서비스 종료 후 재시작
pnpm run docker:down
pnpm run dev:start
```

---

### 4. 브레이크포인트가 멈추지 않음

#### 증상
브레이크포인트를 설정했지만 코드가 멈추지 않음

#### 해결 방법
```bash
# 1. Source maps 확인
# .vscode/launch.json에서 sourceMaps: true 확인

# 2. 컴파일된 코드 경로 확인
# remoteRoot와 localRoot가 올바른지 확인

# 3. 디버거 재연결
# VSCode Cursor에서 디버깅 중지 후 재시작

# 4. 캐시 삭제 후 재빌드
pnpm run docker:down
docker compose build --no-cache api-debug
pnpm run debug:start
```

---

### 5. Docker 컨테이너 내부 파일 확인

#### 컨테이너 쉘 접속
```bash
# 개발 모드 컨테이너
pnpm run docker:shell:api

# 디버그 모드 컨테이너
pnpm run docker:shell:api:debug
```

#### 내부에서 확인할 것
```bash
# 파일 구조 확인
ls -la /app/apps/api/src

# 환경 변수 확인
env | grep NODE

# Node.js 프로세스 확인
ps aux | grep node
```

---

## Best Practices

### 1. 개발 워크플로우

#### 일반 개발
```bash
# 아침에 시작
pnpm run dev:start

# 코드 작성 및 수정
# → Hot Reload 자동 적용

# 저녁에 종료
pnpm run dev:stop
```

#### 디버깅이 필요한 경우
```bash
# 디버그 모드 시작
pnpm run debug:start

# VSCode Cursor 디버거 연결 (F5)

# 디버깅 완료 후 종료
pnpm run docker:down
```

---

### 2. 효율적인 디버깅 팁

#### Tip 1: Logpoint 활용
- 코드를 수정하지 않고 로그 출력
- 재배포 없이 즉시 디버깅

#### Tip 2: 조건부 브레이크포인트
- 특정 조건에서만 멈춤
- 반복문 디버깅 시 유용

#### Tip 3: Watch 표현식
- 복잡한 객체 모니터링
- 실시간 값 변화 추적

#### Tip 4: Debug Console 활용
- 런타임에 코드 실행
- 변수 값 즉시 확인

---

### 3. 성능 최적화

#### Docker 이미지 캐싱
```bash
# 첫 빌드 후 의존성 변경이 없으면 캐시 사용
# 빌드 시간 단축: 5분 → 30초
```

#### 볼륨 마운트 최적화
```bash
# node_modules는 컨테이너 내부 유지
# 소스 코드만 마운트
```

#### 로그 레벨 조정
```bash
# 개발: LOG_LEVEL=debug
# 프로덕션: LOG_LEVEL=info
```

---

### 4. 팀 협업 가이드

#### 신규 개발자 온보딩
```bash
# 1. 저장소 클론
git clone <repository-url>
cd winescope-monorepo

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.development

# 4. 개발 환경 시작
pnpm run dev:start

# 5. 브라우저에서 확인
open http://localhost:3000
```

#### 환경 변수 공유
- `.env.example` 파일을 최신 상태로 유지
- 민감한 정보는 별도로 공유 (Slack, 1Password)

#### 코드 리뷰 시 디버깅
```bash
# 1. PR 브랜치 체크아웃
git checkout feature/new-feature

# 2. 디버그 모드로 실행
pnpm run debug:start

# 3. 리뷰 중 문제 발견 시 즉시 디버깅
```

---

## 추가 리소스

### 공식 문서
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [VSCode 디버깅 가이드](https://code.visualstudio.com/docs/editor/debugging)

### 프로젝트 문서
- [DOCKER.md](../DOCKER.md) - Docker 환경 구축 상세 가이드
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 개요 및 개발 가이드
- [WineScope PRD](./winescope-prd.md) - 프로젝트 요구사항 문서

### 도움 받기
- GitHub Issues: 버그 리포트 및 기능 요청
- Team Slack: 실시간 질문 및 토론

---

## 요약

### 개발 모드 비교

| 모드 | 명령어 | Hot Reload | 디버거 | 용도 |
|------|--------|------------|--------|------|
| **개발** | `pnpm run dev:start` | ✅ | ❌ | 일반 개발 |
| **디버그** | `pnpm run debug:start` | ✅ | ✅ | 디버깅 |
| **하이브리드** | `docker compose up crawler -d` | ✅ | ✅ | 로컬 개발 |

### 핵심 명령어

```bash
# 개발 환경
pnpm run dev:start        # 개발 모드 시작
pnpm run dev:stop         # 개발 모드 종료

# 디버그 환경
pnpm run debug:start      # 디버그 모드 시작
pnpm run docker:down      # 모든 서비스 종료

# 로그 확인
pnpm run docker:logs      # 모든 서비스 로그
pnpm run docker:logs:api  # API 로그만

# 컨테이너 접속
pnpm run docker:shell:api # API 쉘 접속
```

### VSCode Cursor 디버깅 단축키

| 작업 | 단축키 |
|------|--------|
| 디버깅 시작 | F5 |
| 브레이크포인트 토글 | F9 |
| Step Over | F10 |
| Step Into | F11 |
| Step Out | Shift+F11 |
| Continue | F5 |
| Stop | Shift+F5 |

---

**문서 버전**: 1.0.0
**최종 수정**: 2025-01-21
**작성자**: WineScope Development Team
