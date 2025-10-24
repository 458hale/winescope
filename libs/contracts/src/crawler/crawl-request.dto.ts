/**
 * Crawl request DTO
 * Shared between API and Crawler services
 */
export class CrawlRequest {
  /**
   * Target URL to crawl
   * @example "https://www.wine-searcher.com/find/..."
   */
  url: string;

  /**
   * Browser fingerprint to use
   * @default "chrome116"
   */
  browser?: 'chrome116' | 'chrome110' | 'firefox109';

  /**
   * Request timeout in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * Additional headers to send
   */
  headers?: Record<string, string>;

  /**
   * User agent override (optional, browser preset will be used if not provided)
   */
  userAgent?: string;
}
