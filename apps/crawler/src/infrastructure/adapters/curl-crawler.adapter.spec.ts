import { CurlCrawlerAdapter } from './curl-crawler.adapter';
import { NetworkError, TimeoutError } from '../../domain/errors/crawler.errors';
import { exec } from 'child_process';

// Mock child_process
jest.mock('child_process');

describe('CurlCrawlerAdapter', () => {
  let adapter: CurlCrawlerAdapter;
  const mockExec = exec as jest.MockedFunction<typeof exec>;

  beforeEach(() => {
    adapter = new CurlCrawlerAdapter();
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('should fetch HTML successfully', async () => {
      const mockHtml = '<html><body>Test content</body></html>';

      // Mock successful execution
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      const result = await adapter.fetch('https://example.com');

      expect(result).toBe(mockHtml);
      expect(mockExec).toHaveBeenCalled();
    });

    it('should use default browser and timeout', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('curl_chrome116');
        expect(cmd).toContain('--max-time 5'); // 5000ms / 1000
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com');
    });

    it('should use custom browser option', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('curl_firefox109');
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com', { browser: 'firefox109' });
    });

    it('should use custom timeout option', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('--max-time 10'); // 10000ms / 1000
        expect(options?.timeout).toBe(10000);
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com', { timeout: 10000 });
    });

    it('should add custom headers', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('-H "Accept: application/json"');
        expect(cmd).toContain('-H "Authorization: Bearer token"');
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token',
        },
      });
    });

    it('should add custom user agent', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('-A "Custom User Agent"');
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com', {
        userAgent: 'Custom User Agent',
      });
    });

    it('should escape shell arguments to prevent command injection', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      const maliciousUrl = 'https://example.com"; rm -rf /;';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        // Should escape dangerous characters (quotes and semicolons)
        expect(cmd).toContain('\\"'); // Escaped quote
        expect(cmd).toContain('\\;'); // Escaped semicolon
        // The escaped version is safe even though "rm -rf" text appears
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch(maliciousUrl);
    });

    it('should throw NetworkError on empty response', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(adapter.fetch('https://example.com')).rejects.toThrow(
        NetworkError,
      );
    });

    it('should throw NetworkError on execution failure', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(new Error('Connection failed'), null);
        return {} as any;
      });

      await expect(adapter.fetch('https://example.com')).rejects.toThrow(
        NetworkError,
      );
    });

    it('should throw TimeoutError on timeout', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Command timeout');
        error.code = 'ETIMEDOUT';
        callback(error, null);
        return {} as any;
      });

      await expect(adapter.fetch('https://example.com')).rejects.toThrow(
        TimeoutError,
      );
    });

    it('should log warnings for stderr output', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      const loggerSpy = jest.spyOn(adapter['logger'], 'warn');

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: mockHtml, stderr: 'Warning message' });
        return {} as any;
      });

      await adapter.fetch('https://example.com');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
      );
    });
  });

  describe('security', () => {
    it('should escape dollar signs in URL', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      const urlWithDollar = 'https://example.com?price=$100';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('\\$');
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch(urlWithDollar);
    });

    it('should escape backticks in headers', async () => {
      const mockHtml = '<html><body>Test</body></html>';

      mockExec.mockImplementation((cmd: any, options, callback: any) => {
        expect(cmd).toContain('\\`');
        callback(null, { stdout: mockHtml, stderr: '' });
        return {} as any;
      });

      await adapter.fetch('https://example.com', {
        headers: { 'X-Custom': 'value`with`backticks' },
      });
    });
  });
});
