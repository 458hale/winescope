/**
 * Crawler service constants
 */
export const CRAWLER_CONSTANTS = {
  /**
   * Default timeout for crawl requests in milliseconds
   */
  DEFAULT_TIMEOUT: 5000,

  /**
   * Default browser fingerprint
   */
  DEFAULT_BROWSER: 'chrome116' as const,

  /**
   * Maximum concurrent crawl requests
   */
  MAX_CONCURRENT_REQUESTS: 5,

  /**
   * Retry attempts for failed requests
   */
  MAX_RETRIES: 3,

  /**
   * Delay between retries in milliseconds
   */
  RETRY_DELAY: 1000,
} as const;

/**
 * Supported browser fingerprints
 */
export const SUPPORTED_BROWSERS = [
  'chrome116',
  'chrome110',
  'chrome107',
  'chrome104',
  'chrome101',
  'chrome100',
  'chrome99',
  'firefox109',
] as const;

export type SupportedBrowser = (typeof SUPPORTED_BROWSERS)[number];
