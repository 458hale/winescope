import { Injectable, Inject, Logger } from '@nestjs/common';
import type { CrawlerPort } from '../../domain/ports/crawler.port';
import type { ParserPort } from '../../domain/ports/parser.port';
import { WineSearchRequestDto } from '../dto/wine-search-request.dto';
import { WineSearchResponseDto } from '../dto/wine-search-response.dto';

/**
 * SearchWineUseCase
 *
 * 와인 검색 비즈니스 로직을 담당하는 유스케이스입니다.
 * Hexagonal Architecture의 Application Layer에 위치합니다.
 */
@Injectable()
export class SearchWineUseCase {
  private readonly logger = new Logger(SearchWineUseCase.name);

  constructor(
    @Inject('CrawlerPort') private readonly crawler: CrawlerPort,
    @Inject('ParserPort') private readonly parser: ParserPort,
  ) {}

  /**
   * 와인을 검색하고 정보를 반환합니다.
   *
   * @param request - 와인 검색 요청 DTO
   * @returns 와인 검색 결과 DTO
   */
  async execute(
    request: WineSearchRequestDto,
  ): Promise<WineSearchResponseDto> {
    this.logger.log(
      `Searching wine: ${request.winery} ${request.variety} ${request.vintage}, ${request.region}`,
    );

    // 1. Construct Wine-Searcher URL
    const url = this.constructWineSearcherUrl(request);
    this.logger.debug(`Wine-Searcher URL: ${url}`);

    // 2. Crawl HTML from Wine-Searcher
    const html = await this.crawler.fetch(url, {
      browser: 'chrome116',
      timeout: 5000,
    });

    this.logger.debug(
      `Fetched ${html.length} bytes of HTML from Wine-Searcher`,
    );

    // 3. Parse HTML to extract wine data
    const wineData = await this.parser.parse(html, url);

    this.logger.log(
      `Successfully parsed wine: ${wineData.wine.name.value}, ${wineData.ratings.length} ratings`,
    );

    // 4. Convert domain model to DTO
    const response = this.mapToResponseDto(wineData);

    return response;
  }

  /**
   * Wine-Searcher URL을 생성합니다.
   */
  private constructWineSearcherUrl(request: WineSearchRequestDto): string {
    // Wine-Searcher URL format:
    // https://www.wine-searcher.com/find/{winery}+{variety}+{vintage}+{region}
    const query = [
      request.winery,
      request.variety,
      request.vintage.toString(),
      request.region,
    ]
      .join(' ')
      .toLowerCase()
      .replace(/\s+/g, '+')
      .replace(/[^a-z0-9+]/g, ''); // Remove special characters

    return `https://www.wine-searcher.com/find/${query}`;
  }

  /**
   * Domain model을 Response DTO로 변환합니다.
   */
  private mapToResponseDto(wineData: any): WineSearchResponseDto {
    return {
      wine: {
        name: wineData.wine.name.value,
        region: wineData.wine.region,
        winery: wineData.wine.winery,
        variety: wineData.wine.variety,
        vintage: wineData.wine.vintage.value,
      },
      ratings: wineData.ratings.map((rating: any) => ({
        source: rating.source,
        score: rating.score.value,
        critic: rating.critic,
        reviewCount: rating.reviewCount,
      })),
      price: wineData.price
        ? {
            average: wineData.price.average,
            currency: wineData.price.currency,
            priceRange: wineData.price.priceRange,
            updatedAt: wineData.price.updatedAt.toISOString(),
          }
        : null,
      source: {
        site: 'Wine-Searcher',
        url: wineData.sourceUrl,
        crawledAt: wineData.crawledAt.toISOString(),
      },
    };
  }
}
