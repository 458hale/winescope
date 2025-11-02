# 🍷 Product Requirements Document: WineScope

## 1. 개요

**WineScope**는 와인의 핵심 정보(지역, 와이너리, 품종, 빈티지)를 입력하면, 와인 관련 전문 사이트에서 평점, 가격, 리뷰 데이터를 수집하고 이를 정규화하여 사용자가 한눈에 비교할 수 있도록 제공하는 와인 정보 애그리게이터입니다.

---

## 2. 목적 및 배경

- **문제점**
  - 와인 정보가 여러 사이트에 분산되어 있어 사용자가 직접 비교하기 어렵다.
  - 사이트마다 평점 기준과 정보 구조가 달라 혼란스럽다.

- **기회**
  - 와인 시장의 성장과 함께, 신뢰할 수 있는 정보를 빠르게 얻고자 하는 수요 증가
  - 크롤링 기반 데이터 집계로 DTC 와인 소비자를 위한 서비스 제공 가능

- **목표**
  - 사용자 입력 기반으로 와인 정보를 자동 수집 및 정규화
  - 전문가 점수(RP 포함), 가격, 요약 리뷰를 통합 UI로 제공

---

## 3. 사용자 시나리오 (User Stories)

### 🎯 일반 사용자

> “2018년 빈티지의 나파 밸리 Chardonnay 와인을 찾고 싶다. 가격과 평점, 리뷰를 비교해서 구매 결정을 하고 싶다.”

- 사용자는 와인 이름이나 속성 정보를 알고 있지만, 각 사이트를 일일이 방문하며 정보를 찾는 데 불편함을 느낀다.
- WineScope는 단일 입력만으로 해당 정보를 통합적으로 제공한다.

---

## 4. 주요 기능 요약 (MVP 범위)

| 기능 | 설명 |
|------|------|
| 🔍 와인 검색 입력 | 지역, 와이너리, 품종, 빈티지를 사용자로부터 입력받는다. |
| 🕸 사이트별 크롤링 | Wine-Searcher 사이트에서 와인 관련 정보를 비동기 크롤링한다. |
| 🧪 데이터 정규화 | 크롤링된 HTML 데이터를 통합된 WineResult 구조로 정규화한다. |
| 📊 결과 UI 출력 | 평균 가격, 전문가 평점(RP 포함), 리뷰 수 등 정보를 카드형 UI로 보여준다. |

---

## 5. 시스템 아키텍처 개요 (MVP 범위)

| 계층 | 기술 구성 | 설명 |
|------|------------|------|
| **Frontend** | Next.js + TypeScript | 검색 폼 구성, 결과 출력 UI |
| **Backend** | NestJS + TypeScript | 검색 요청 처리, 크롤러 호출, 도메인 로직 분리 |
| **크롤링 엔진** | curl-impersonate + cheerio | 경량 HTTP 크롤링 및 HTML 파싱 |

### 🧱 아키텍처 원칙

- **Hexagonal Architecture (Ports & Adapters)**  
  → 외부 시스템(크롤러, DB, API)과 도메인 로직을 명확히 분리하여 테스트 가능성과 유지보수성을 확보
- **Domain-Driven Design (DDD)**  
  → Entity, Value Object, Repository, UseCase 계층 중심의 명확한 도메인 모델 구성
- **SOLID 원칙**  
  → SRP, OCP, LSP, ISP, DIP 원칙을 준수한 객체지향적 모듈 구성
- **Separation of Concerns (SoC)**  
  → DI, AOP를 통한 관심사 분리 (로깅, 예외처리, 인증 등은 횡단 관심사로 분리)

---

## 6. 확정 크롤링 대상

| 항목 | 내용 |
|------|------|
| ✅ 대상 사이트 | [Wine-Searcher](https://www.wine-searcher.com) |
| ✅ 제공 정보 | 전문가 평점 (RP 포함), 평균 가격, 지역, 와인 이름, 빈티지별 정보 등 |
| ✅ RP 점수 포함 여부 | 포함됨 |
| ✅ 구조 | SSR 기반 HTML (curl-impersonate + cheerio로 경량 크롤링) |

---

## 7. 비기능 요건 (요약)

| 항목 | 요구사항 |
|------|-----------|
| 응답 시간 | 3초 이내 (크롤링 캐싱 시) - curl-impersonate 사용 시 500-1000ms 목표 |
| 안정성 | 사이트 차단 방지 위한 TLS 핑거프린트 모방 (curl-impersonate) 및 속도 제한 |
| 확장성 | Hexagonal Architecture 기반 크롤러 모듈화로 Vivino 등 확장 가능 |
| 리소스 효율 | 메모리 사용량 최소화 (5-10MB vs Playwright 100-500MB) |

---

## 8. 크롤링 전략 상세 (curl-impersonate 기반)

### 🎯 경량 크롤링 전략

#### curl-impersonate + cheerio

- **목적**: 성능 최적화 및 리소스 효율성
- **구현**:
  - curl-impersonate로 Chrome/Firefox TLS 핑거프린트 모방
  - cheerio로 SSR HTML 파싱 (CSS 선택자 기반)
  - 응답 시간 목표: 500-1000ms
- **장점**:
  - 패키지 크기: ~15-25MB (경량)
  - 메모리 사용: 5-10MB (효율적)
  - 빠른 응답 속도 (브라우저 초기화 불필요)
  - TLS 핑거프린트 모방으로 봇 탐지 우회

### 🏗️ 아키텍처 설계

#### Hexagonal Architecture 기반 구조

```text
Domain Layer
└── ports/
    └── crawler.interface.ts (Crawler 인터페이스)

Infrastructure Layer
└── crawler/
    ├── curl-crawler.ts (HTTP 요청)
    └── wine-searcher.parser.ts (HTML 파싱)

Application Layer
└── wine/
    └── wine-search.service.ts (UseCase)
```

#### 구현 계층

- **Domain Layer**: `Crawler` 포트 정의 (I 접두사 없음, NestJS 컨벤션), 도메인 모델 (Wine, Rating, Price)
- **Infrastructure Layer**:
  - `CurlCrawler` implements `Crawler` (child_process로 네이티브 바이너리 실행)
  - `WineSearcherParser` (cheerio 기반 HTML 파싱)
- **Application Layer**: `WineSearchService`로 비즈니스 로직 처리

### 📊 예상 성능

| 지표 | 목표값 |
|------|--------|
| 패키지 크기 | ~15-25MB |
| 메모리 사용 | 5-10MB |
| 초기화 시간 | <100ms |
| 응답 시간 | 500-1000ms |
| TLS 핑거프린트 | ✅ Chrome/Firefox 모방 |

### ⚠️ 리스크 및 완화 방안

| 리스크 | 완화 방안 |
|--------|-----------|
| Wine-Searcher가 순수 SSR이 아닐 수 있음 | PoC 단계에서 조기 검증 (Phase 1) |
| HTML 구조 변경 시 파싱 로직 수정 필요 | 선택자 매핑을 설정 파일로 분리, 버전 관리 |
| 봇 탐지 강화 시 차단 가능성 | User-Agent 로테이션, Rate Limiting 구현 |
| curl-impersonate 설치 복잡도 | Docker 이미지에 사전 설치, 설치 스크립트 제공 |

### 🔄 구현 로드맵 (PoC 중심)

#### Phase 1 - PoC (Proof of Concept)

1. curl-impersonate로 Wine-Searcher 샘플 요청
2. 응답 HTML에서 필요 데이터(평점, 가격, RP) 확인
3. cheerio 선택자 매핑 및 파싱 테스트
4. **PoC 성공 기준**: 모든 필수 데이터 추출 가능 여부

#### Phase 2 - MVP Implementation

1. `Crawler` 인터페이스 정의 (Domain Layer)
2. `CurlCrawler` 구현 (Infrastructure)
3. `WineSearcherParser` 구현 (cheerio 기반)
4. `WineSearchService` 구현 (Application Layer)
5. Unit/Integration 테스트 작성

#### Phase 3 - Production Readiness

1. 에러 핸들링 및 재시도 로직
2. Rate Limiting 및 User-Agent 로테이션
3. 캐싱 전략 (메모리 캐시)
4. 로깅 및 모니터링

---
