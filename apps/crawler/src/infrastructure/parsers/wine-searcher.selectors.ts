/**
 * Wine-Searcher CSS Selectors
 *
 * Wine-Searcher 사이트의 HTML 구조에서 데이터를 추출하기 위한 CSS 선택자입니다.
 *
 * @remarks
 * 실제 Wine-Searcher HTML을 분석한 후 이 선택자를 업데이트해야 합니다.
 * 현재는 가상의 선택자로 구성되어 있습니다.
 */

export interface WineSearcherSelectors {
  wine: {
    name: string;
    vintage: string;
    region: string;
    winery: string;
    variety: string;
  };
  ratings: {
    container: string;
    item: string;
    source: string;
    score: string;
    critic: string;
    reviewCount: string;
  };
  price: {
    average: string;
    currency: string;
    priceRange: string;
    updatedAt: string;
  };
}

/**
 * Wine-Searcher CSS Selectors (Mock)
 *
 * ⚠️ 주의: 이 선택자는 Mock 데이터입니다.
 * 실제 Wine-Searcher HTML을 분석한 후 업데이트가 필요합니다.
 *
 * TODO: 실제 HTML 구조 분석 후 선택자 업데이트
 * - Wine-Searcher 페이지 크롤링
 * - 브라우저 DevTools로 요소 검사
 * - CSS 선택자 식별 및 검증
 */
export const WINE_SEARCHER_SELECTORS: WineSearcherSelectors = {
  wine: {
    name: 'h1.wine-name, .wine-title h1, h1',
    vintage: '.vintage, .wine-year, [data-vintage]',
    region: '.region, .wine-region, [data-region]',
    winery: '.winery, .wine-producer, [data-winery]',
    variety: '.variety, .wine-varietal, [data-variety]',
  },
  ratings: {
    container: '.ratings, .wine-ratings, [data-ratings]',
    item: '.rating-item, .rating',
    source: '.rating-source, .critic-name, [data-source]',
    score: '.rating-score, .wine-score, [data-score]',
    critic: '.critic, .reviewer, [data-critic]',
    reviewCount: '.review-count, .num-reviews, [data-review-count]',
  },
  price: {
    average: '.average-price, .price-avg, [data-price-avg]',
    currency: '.currency, .price-currency, [data-currency]',
    priceRange: '.price-range, [data-price-range]',
    updatedAt: '.price-updated, .last-updated, [data-updated]',
  },
};
