import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  NetworkError,
  TimeoutError,
  ParsingError,
  ValidationError,
} from '../../domain/errors/crawler.errors';

/**
 * CrawlerExceptionFilter
 *
 * 크롤러 도메인 에러를 HTTP 응답으로 변환합니다.
 */
@Catch()
export class CrawlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CrawlerExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = this.getHttpStatus(exception);

    this.logger.error(
      `Exception occurred: ${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message: this.getSafeErrorMessage(exception),
      error: this.getErrorType(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * 에러를 HTTP 상태 코드로 매핑합니다.
   */
  private getHttpStatus(exception: Error): HttpStatus {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof ValidationError) {
      return HttpStatus.BAD_REQUEST; // 400
    }

    if (exception instanceof TimeoutError) {
      return HttpStatus.GATEWAY_TIMEOUT; // 504
    }

    if (exception instanceof NetworkError) {
      // Check if it's a 404 from Wine-Searcher
      if (exception.message.includes('404') || exception.message.includes('not found')) {
        return HttpStatus.NOT_FOUND; // 404
      }
      return HttpStatus.BAD_GATEWAY; // 502
    }

    if (exception instanceof ParsingError) {
      return HttpStatus.INTERNAL_SERVER_ERROR; // 500
    }

    // Unknown error
    return HttpStatus.INTERNAL_SERVER_ERROR; // 500
  }

  /**
   * 에러 타입을 문자열로 반환합니다.
   */
  private getErrorType(exception: Error): string {
    if (exception instanceof HttpException) {
      return exception.constructor.name;
    }

    if (exception instanceof ValidationError) {
      return 'Bad Request';
    }

    if (exception instanceof TimeoutError) {
      return 'Gateway Timeout';
    }

    if (exception instanceof NetworkError) {
      if (exception.message.includes('404') || exception.message.includes('not found')) {
        return 'Not Found';
      }
      return 'Bad Gateway';
    }

    if (exception instanceof ParsingError) {
      return 'Internal Server Error';
    }

    return 'Internal Server Error';
  }

  /**
   * 안전한 에러 메시지를 반환합니다 (민감 정보 제거).
   */
  private getSafeErrorMessage(exception: Error): string {
    // Don't expose internal details in production
    if (process.env.NODE_ENV === 'production') {
      if (exception instanceof ValidationError) {
        return exception.message;
      }

      if (exception instanceof TimeoutError) {
        return 'Request timed out while fetching wine data';
      }

      if (exception instanceof NetworkError) {
        if (exception.message.includes('404') || exception.message.includes('not found')) {
          return 'Wine not found';
        }
        return 'Failed to fetch wine data from external source';
      }

      if (exception instanceof ParsingError) {
        return 'Failed to parse wine data';
      }

      return 'An unexpected error occurred';
    }

    // Development: show full error message
    return exception.message || 'Unknown error';
  }
}
