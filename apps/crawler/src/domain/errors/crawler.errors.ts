/**
 * Domain Errors for Crawler
 *
 * 크롤러 도메인에서 발생할 수 있는 에러를 정의합니다.
 */

export class NetworkError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly timeoutMs: number,
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ParsingError extends Error {
  constructor(message: string, public readonly sourceUrl: string) {
    super(message);
    this.name = 'ParsingError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
