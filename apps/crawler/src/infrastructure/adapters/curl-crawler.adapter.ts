import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CrawlerPort, CrawlOptions } from '../../domain/ports/crawler.port';
import { NetworkError, TimeoutError } from '../../domain/errors/crawler.errors';

const execAsync = promisify(exec);

/**
 * CurlCrawlerAdapter
 *
 * curl-impersonate를 사용하여 HTTP 요청을 수행하는 어댑터입니다.
 * CrawlerPort 인터페이스를 구현하여 도메인 계층과 인프라 계층을 분리합니다.
 */
@Injectable()
export class CurlCrawlerAdapter implements CrawlerPort {
  private readonly logger = new Logger(CurlCrawlerAdapter.name);

  /**
   * 주어진 URL의 HTML을 크롤링합니다.
   *
   * @param url - 크롤링할 URL
   * @param options - 크롤링 옵션
   * @returns HTML 문자열
   * @throws NetworkError 네트워크 오류 발생 시
   * @throws TimeoutError 타임아웃 발생 시
   */
  async fetch(url: string, options: CrawlOptions = {}): Promise<string> {
    const browser = options.browser || 'chrome116';
    const timeout = options.timeout || 5000;

    this.logger.debug(
      `Fetching URL: ${url} with browser: ${browser}, timeout: ${timeout}ms`,
    );

    try {
      const curlCommand = this.buildCurlCommand(url, browser, timeout, options);

      const { stdout, stderr } = await execAsync(curlCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        this.logger.warn(`curl-impersonate stderr: ${stderr}`);
      }

      if (!stdout || stdout.trim().length === 0) {
        throw new NetworkError(`Empty response from URL: ${url}`, url);
      }

      this.logger.debug(`Successfully fetched ${stdout.length} bytes from ${url}`);

      return stdout;
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        throw error;
      }

      // Check if it's a timeout error
      if (
        error instanceof Error &&
        (error.message.includes('ETIMEDOUT') ||
          error.message.includes('timeout') ||
          (error as any).code === 'ETIMEDOUT')
      ) {
        throw new TimeoutError(
          `Request to ${url} timed out after ${timeout}ms`,
          url,
          timeout,
        );
      }

      // Generic network error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new NetworkError(
        `Failed to fetch URL ${url}: ${errorMessage}`,
        url,
      );
    }
  }

  /**
   * curl-impersonate 명령어를 생성합니다.
   */
  private buildCurlCommand(
    url: string,
    browser: string,
    timeout: number,
    options: CrawlOptions,
  ): string {
    const curlBinary = `curl_${browser}`;
    const escapedUrl = this.escapeShellArg(url);

    let command = `${curlBinary} -s -L ${escapedUrl}`;

    // Add timeout (convert ms to seconds)
    command += ` --max-time ${Math.ceil(timeout / 1000)}`;

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        const escapedKey = this.escapeShellArg(key);
        const escapedValue = this.escapeShellArg(value);
        command += ` -H "${escapedKey}: ${escapedValue}"`;
      });
    }

    // Add custom user agent if provided
    if (options.userAgent) {
      const escapedUA = this.escapeShellArg(options.userAgent);
      command += ` -A "${escapedUA}"`;
    }

    return command;
  }

  /**
   * Shell argument를 이스케이프합니다 (command injection 방지).
   */
  private escapeShellArg(arg: string): string {
    // Escape special shell characters to prevent command injection
    return arg
      .replace(/\\/g, '\\\\') // backslash first
      .replace(/"/g, '\\"') // double quotes
      .replace(/\$/g, '\\$') // dollar signs
      .replace(/`/g, '\\`') // backticks
      .replace(/;/g, '\\;') // semicolons
      .replace(/&/g, '\\&') // ampersands
      .replace(/\|/g, '\\|') // pipes
      .replace(/>/g, '\\>') // redirects
      .replace(/</g, '\\<'); // redirects
  }
}
