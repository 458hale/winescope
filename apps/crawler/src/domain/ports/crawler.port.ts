/**
 * CrawlerPort Interface
 *
 * HTTP 크롤링을 위한 포트 인터페이스입니다.
 * 인프라 계층의 CurlCrawlerAdapter가 이 인터페이스를 구현합니다.
 *
 * @remarks
 * NestJS 컨벤션을 따라 I prefix를 사용하지 않습니다.
 */

export interface CrawlOptions {
  /**
   * 브라우저 핑거프린트 타입
   */
  browser?: 'chrome116' | 'chrome110' | 'firefox109';

  /**
   * 타임아웃 (밀리초)
   * @default 5000
   */
  timeout?: number;

  /**
   * 커스텀 HTTP 헤더
   */
  headers?: Record<string, string>;

  /**
   * User-Agent 문자열
   */
  userAgent?: string;
}

export interface CrawlerPort {
  /**
   * 주어진 URL의 HTML을 크롤링합니다.
   *
   * @param url - 크롤링할 URL
   * @param options - 크롤링 옵션
   * @returns HTML 문자열
   * @throws NetworkError 네트워크 오류 발생 시
   * @throws TimeoutError 타임아웃 발생 시
   */
  fetch(url: string, options?: CrawlOptions): Promise<string>;
}
