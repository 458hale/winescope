import { CrawlRequest } from './crawl-request.dto';
import { CrawlResponse } from './crawl-response.dto';

/**
 * Crawler service interface
 * Both API and Crawler services implement this contract
 */
export interface Crawler {
  /**
   * Crawl a URL and return HTML content
   * @param request Crawl request with URL and options
   * @returns Crawl response with HTML and metadata
   */
  crawl(request: CrawlRequest): Promise<CrawlResponse>;
}
