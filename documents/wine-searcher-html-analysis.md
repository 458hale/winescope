---
title: "Wine-Searcher HTML 구조 분석"
created: 2025-11-09
tags: [poc, crawler, wine-searcher, html-parsing]
---

# Wine-Searcher HTML 구조 분석

## PoC 목표

Wine-Searcher 사이트의 HTML 구조를 분석하여 필수 데이터 추출을 위한 CSS 선택자를 식별합니다.

## 필수 추출 데이터

### 1. 와인 기본 정보
- **와인 이름** (Wine Name)
- **빈티지** (Vintage)
- **지역** (Region)
- **와이너리** (Winery)
- **품종** (Variety)

### 2. 평점 정보
- **전문가 평점** (Expert Ratings)
  - 평가 기관 (Source): Wine-Searcher, Wine Spectator 등
  - 점수 (Score): 0-100 범위
  - 평론가 (Critic): Robert Parker, James Suckling 등
  - 리뷰 수 (Review Count)

### 3. 가격 정보
- **평균 가격** (Average Price)
- **통화** (Currency): USD, EUR 등
- **가격 범위** (Price Range): "$300-$400" 형식
- **업데이트 날짜** (Updated Date)

## PoC 단계

### Phase 1: 실제 HTML 크롤링 ✅

**방법 1: curl-impersonate 사용 (Docker 내부)**
```bash
# Docker crawler 컨테이너 내부에서 실행
docker exec -it winescope-crawler-dev sh

# curl-impersonate로 페이지 크롤링
curl_chrome116 -L -s "https://www.wine-searcher.com/find/opus+one+cabernet+sauvignon+2018+napa+valley" \
  --max-time 10 > /tmp/wine-searcher.html

# HTML 파일 크기 확인
ls -lh /tmp/wine-searcher.html
```

**방법 2: 브라우저 DevTools 사용**
1. Wine-Searcher 페이지 방문
2. 개발자 도구 열기 (F12)
3. Elements 탭에서 HTML 구조 확인
4. 필요한 요소를 우클릭 → Copy → Copy selector

### Phase 2: HTML 구조 분석

#### 예상 CSS 선택자 (가설)

```typescript
// 이 선택자는 실제 HTML을 분석한 후 업데이트 필요
const WINE_SEARCHER_SELECTORS = {
  wineName: 'h1.wine-name, .wine-title h1',
  vintage: '.vintage, .wine-year',
  region: '.region, .wine-region',
  winery: '.winery, .wine-producer',
  variety: '.variety, .wine-varietal',

  // 평점 정보
  ratings: {
    container: '.ratings, .wine-ratings',
    item: '.rating-item',
    source: '.rating-source, .critic-name',
    score: '.rating-score, .wine-score',
    critic: '.critic, .reviewer',
    reviewCount: '.review-count, .num-reviews',
  },

  // 가격 정보
  price: {
    average: '.average-price, .price-avg',
    currency: '.currency, .price-currency',
    priceRange: '.price-range',
    updatedAt: '.price-updated, .last-updated',
  },
};
```

### Phase 3: 파싱 로직 검증

**테스트 시나리오**:
1. **Happy Path**: 모든 데이터가 존재하는 경우
2. **RP 점수 없음**: Robert Parker 점수가 없는 경우
3. **가격 정보 없음**: 가격 데이터가 없는 경우
4. **부분 데이터**: 일부 필드만 존재하는 경우

**검증 기준**:
- ✅ 와인 이름 추출 가능
- ✅ 빈티지 추출 가능 (숫자 형식)
- ✅ 지역 추출 가능
- ✅ 평점 1개 이상 추출 가능
- ✅ 가격 정보 추출 가능 (평균 가격)
- ✅ Robert Parker 점수 추출 가능 (있는 경우)

## 실제 분석 결과

### Wine-Searcher 페이지 특성

**⚠️ 중요**: 실제 HTML 크롤링 후 이 섹션을 업데이트해야 합니다.

#### 1. 렌더링 방식
- [ ] Pure SSR (서버 사이드 렌더링)
- [ ] Hybrid (SSR + Client-side hydration)
- [ ] CSR (클라이언트 사이드 렌더링)

**확인 방법**:
- `__NEXT_DATA__` 스크립트 태그 존재 여부 확인
- 초기 HTML에 데이터 포함 여부 확인
- cheerio로 파싱 가능 여부 검증

#### 2. 데이터 구조
```html
<!-- 실제 HTML 구조를 여기에 문서화 -->
<!-- 예시: -->
<div class="actual-wine-container">
  <h1 class="actual-wine-name">...</h1>
  <!-- ... -->
</div>
```

#### 3. CSS 선택자 매핑

**최종 선택자** (실제 분석 후 업데이트):

| 데이터 필드 | CSS 선택자 | 예시 추출값 |
|------------|-----------|------------|
| Wine Name | `TBD` | "Opus One 2018" |
| Vintage | `TBD` | "2018" |
| Region | `TBD` | "Napa Valley" |
| Winery | `TBD` | "Opus One" |
| RP Score | `TBD` | "97" |
| Avg Price | `TBD` | "$325" |

### 대체 전략 (Fallback)

만약 Wine-Searcher가 cheerio로 파싱 불가능한 구조라면:

#### Option 1: Playwright 사용
- 실제 브라우저 렌더링 후 데이터 추출
- 메모리 사용량 증가 (5-10MB → 100-500MB)
- 응답 시간 증가 (500ms → 3-5초)

#### Option 2: API 탐색
- Wine-Searcher의 비공식 API 존재 여부 확인
- GraphQL 엔드포인트 확인
- Network 탭에서 데이터 요청 분석

#### Option 3: 다른 사이트 우선
- Vivino, CellarTracker 등 대안 고려
- 더 쉽게 파싱 가능한 사이트 선택

## Next Steps

### 즉시 실행할 작업
1. **Docker 컨테이너에서 실제 HTML 크롤링**
   ```bash
   docker exec -it winescope-crawler-dev \
     curl_chrome116 -L "https://www.wine-searcher.com/find/opus+one+2018" \
     > apps/crawler/test/fixtures/wine-searcher-real.html
   ```

2. **HTML 구조 수동 분석**
   - 브라우저 DevTools로 요소 검사
   - CSS 선택자 식별
   - 데이터 추출 패턴 문서화

3. **선택자 매핑 파일 생성**
   ```typescript
   // apps/crawler/src/infrastructure/parsers/wine-searcher.selectors.ts
   export const WINE_SEARCHER_SELECTORS = {
     // 실제 선택자 정의
   };
   ```

4. **Cheerio 파서 PoC 구현**
   - 간단한 파싱 테스트 스크립트 작성
   - fixture HTML로 데이터 추출 검증
   - 추출 성공률 확인

### 성공 기준
- ✅ 실제 Wine-Searcher HTML 획득
- ✅ 모든 필수 데이터 CSS 선택자 식별
- ✅ Cheerio로 데이터 추출 가능 검증
- ✅ 최소 90% 데이터 추출 성공률

### 예상 리스크
| 리스크 | 가능성 | 영향 | 완화 방안 |
|--------|-------|------|----------|
| CSR로 인한 파싱 불가 | 중 | 높음 | Playwright로 전환 |
| HTML 구조 복잡도 | 중 | 중 | 선택자 매핑 파일 분리 |
| RP 점수 누락 | 낮 | 중 | Optional 처리 |
| 봇 탐지 차단 | 중 | 높음 | curl-impersonate로 완화 |

## 참고 자료
- [cheerio Documentation](https://cheerio.js.org/)
- [curl-impersonate GitHub](https://github.com/lwthiker/curl-impersonate)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
