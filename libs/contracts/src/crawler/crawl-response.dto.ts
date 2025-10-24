/**
 * Crawl response DTO
 * Returned by Crawler service
 */
export class CrawlResponse {
  /**
   * HTML content retrieved from the URL
   */
  html: string;

  /**
   * HTTP status code
   * @example 200, 403, 404
   */
  statusCode: number;

  /**
   * Response headers
   */
  headers: Record<string, string>;

  /**
   * Timestamp when the crawl was performed
   */
  timestamp: Date;

  /**
   * Time taken to complete the request in milliseconds
   */
  duration: number;

  /**
   * Error message if crawl failed
   */
  error?: string;
}
