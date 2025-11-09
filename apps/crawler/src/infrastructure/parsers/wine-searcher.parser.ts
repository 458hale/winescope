import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ParserPort, WineData } from '../../domain/ports/parser.port';
import { Wine } from '../../domain/entities/wine.entity';
import { Rating } from '../../domain/entities/rating.entity';
import { Price } from '../../domain/entities/price.entity';
import { WineName } from '../../domain/value-objects/wine-name.vo';
import { Vintage } from '../../domain/value-objects/vintage.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { ParsingError } from '../../domain/errors/crawler.errors';
import { WINE_SEARCHER_SELECTORS } from './wine-searcher.selectors';

/**
 * WineSearcherParser
 *
 * Wine-Searcher 사이트의 HTML을 파싱하여 와인 데이터를 추출합니다.
 * cheerio를 사용하여 SSR HTML을 파싱합니다.
 */
@Injectable()
export class WineSearcherParser implements ParserPort {
  private readonly logger = new Logger(WineSearcherParser.name);

  /**
   * HTML을 파싱하여 와인 데이터를 추출합니다.
   *
   * @param html - 파싱할 HTML 문자열
   * @param sourceUrl - HTML의 원본 URL
   * @returns 파싱된 와인 데이터
   * @throws ParsingError 파싱 실패 시
   */
  async parse(html: string, sourceUrl: string): Promise<WineData> {
    this.logger.debug(`Parsing HTML from ${sourceUrl}`);

    try {
      const $ = cheerio.load(html);

      // Extract wine basic info
      const wine = this.extractWine($);

      // Extract ratings
      const ratings = this.extractRatings($);

      // Extract price
      const price = this.extractPrice($);

      this.logger.debug(
        `Successfully parsed wine: ${wine.name.value}, ${ratings.length} ratings, price: ${price ? 'yes' : 'no'}`,
      );

      return {
        wine,
        ratings,
        price,
        sourceUrl,
        crawledAt: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown parsing error';
      throw new ParsingError(
        `Failed to parse HTML from ${sourceUrl}: ${errorMessage}`,
        sourceUrl,
      );
    }
  }

  /**
   * Wine 엔티티를 추출합니다.
   */
  private extractWine($: cheerio.Root): Wine {
    const selectors = WINE_SEARCHER_SELECTORS.wine;

    const name = this.extractText($, selectors.name);
    if (!name) {
      throw new Error('Wine name not found');
    }

    const vintageText = this.extractText($, selectors.vintage);
    const vintage = this.parseVintage(vintageText);

    const region = this.extractText($, selectors.region) || 'Unknown Region';
    const winery = this.extractText($, selectors.winery) || 'Unknown Winery';
    const variety =
      this.extractText($, selectors.variety) || 'Unknown Variety';

    return new Wine(
      WineName.create(name),
      region,
      winery,
      variety,
      vintage,
    );
  }

  /**
   * Rating 엔티티 배열을 추출합니다.
   */
  private extractRatings($: cheerio.Root): Rating[] {
    const ratings: Rating[] = [];
    const selectors = WINE_SEARCHER_SELECTORS.ratings;

    const ratingElements = $(selectors.container).find(selectors.item);

    ratingElements.each((_, element) => {
      try {
        const source = this.extractText($, selectors.source, element);
        const scoreText = this.extractText($, selectors.score, element);
        const critic = this.extractText($, selectors.critic, element) || null;
        const reviewCountText = this.extractText(
          $,
          selectors.reviewCount,
          element,
        );

        if (source && scoreText) {
          const score = this.parseScore(scoreText);
          const reviewCount = this.parseReviewCount(reviewCountText);

          ratings.push(new Rating(source, score, critic, reviewCount));
        }
      } catch (error) {
        this.logger.warn(`Failed to parse rating: ${error}`);
      }
    });

    return ratings;
  }

  /**
   * Price 엔티티를 추출합니다.
   */
  private extractPrice($: cheerio.Root): Price | null {
    const selectors = WINE_SEARCHER_SELECTORS.price;

    const averageText = this.extractText($, selectors.average);
    const currency = this.extractText($, selectors.currency);

    if (!averageText || !currency) {
      return null;
    }

    const average = this.parsePrice(averageText);
    const priceRange = this.extractText($, selectors.priceRange) || null;
    const updatedAtText = this.extractText($, selectors.updatedAt);
    const updatedAt = this.parseDate(updatedAtText) || new Date();

    return new Price(average, currency, priceRange, updatedAt);
  }

  /**
   * CSS 선택자로 텍스트를 추출합니다.
   */
  private extractText(
    $: cheerio.Root,
    selector: string,
    context?: cheerio.Element,
  ): string | null {
    const element = context ? $(context).find(selector) : $(selector);
    const text = element.first().text().trim();
    return text.length > 0 ? text : null;
  }

  /**
   * 빈티지를 파싱합니다.
   */
  private parseVintage(text: string | null): Vintage {
    if (!text) {
      // Default vintage if not found
      return Vintage.create(new Date().getFullYear());
    }

    // Extract 4-digit year from text
    const match = text.match(/\b(19|20)\d{2}\b/);
    if (match) {
      return Vintage.create(parseInt(match[0], 10));
    }

    // Default vintage
    return Vintage.create(new Date().getFullYear());
  }

  /**
   * 점수를 파싱합니다.
   */
  private parseScore(text: string): Score {
    // Extract number from text (e.g., "95 points" -> 95)
    const match = text.match(/\d+(\.\d+)?/);
    if (match) {
      return Score.create(parseFloat(match[0]));
    }

    throw new Error(`Invalid score format: ${text}`);
  }

  /**
   * 리뷰 수를 파싱합니다.
   */
  private parseReviewCount(text: string | null): number {
    if (!text) {
      return 0;
    }

    // Extract number from text (e.g., "125 reviews" -> 125)
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * 가격을 파싱합니다.
   */
  private parsePrice(text: string): number {
    // Remove currency symbols and commas, then parse
    const cleaned = text.replace(/[$€£,]/g, '');
    const match = cleaned.match(/\d+(\.\d+)?/);

    if (match) {
      return parseFloat(match[0]);
    }

    throw new Error(`Invalid price format: ${text}`);
  }

  /**
   * 날짜를 파싱합니다.
   */
  private parseDate(text: string | null): Date | null {
    if (!text) {
      return null;
    }

    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }
}
