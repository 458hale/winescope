import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  CrawlRequest,
  CrawlResponse,
  Crawler,
} from '@winescope/contracts/crawler';
import { CRAWLER_CONSTANTS } from '@winescope/common/constants';

const execAsync = promisify(exec);

@Injectable()
export class CrawlerService implements Crawler {
  async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    const startTime = Date.now();
    const browser = request.browser || CRAWLER_CONSTANTS.DEFAULT_BROWSER;
    const timeout = request.timeout || CRAWLER_CONSTANTS.DEFAULT_TIMEOUT;

    try {
      // Build curl-impersonate command
      const curlCommand = this.buildCurlCommand(request, browser, timeout);

      // Execute curl-impersonate
      const { stdout, stderr } = await execAsync(curlCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        console.warn('curl-impersonate stderr:', stderr);
      }

      return {
        html: stdout,
        statusCode: 200, // TODO: Parse actual status code from curl output
        headers: {}, // TODO: Parse headers from curl output
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        html: '',
        statusCode: 500,
        headers: {},
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private buildCurlCommand(
    request: CrawlRequest,
    browser: string,
    timeout: number,
  ): string {
    const curlBinary = `curl_${browser}`;
    const escapedUrl = request.url.replace(/"/g, '\\"');

    let command = `${curlBinary} -s -L "${escapedUrl}"`;

    // Add timeout
    command += ` --max-time ${Math.ceil(timeout / 1000)}`;

    // Add custom headers
    if (request.headers) {
      Object.entries(request.headers).forEach(([key, value]) => {
        command += ` -H "${key}: ${value}"`;
      });
    }

    // Add custom user agent if provided
    if (request.userAgent) {
      command += ` -A "${request.userAgent}"`;
    }

    return command;
  }
}
