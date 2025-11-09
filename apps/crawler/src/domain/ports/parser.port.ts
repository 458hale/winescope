import { Wine } from '../entities/wine.entity';
import { Rating } from '../entities/rating.entity';
import { Price } from '../entities/price.entity';

/**
 * WineData Interface
 *
 * 파싱된 와인 데이터를 나타내는 인터페이스입니다.
 */
export interface WineData {
  wine: Wine;
  ratings: Rating[];
  price: Price | null;
  sourceUrl: string;
  crawledAt: Date;
}

/**
 * ParserPort Interface
 *
 * HTML 파싱을 위한 포트 인터페이스입니다.
 * 인프라 계층의 CheerioParserAdapter가 이 인터페이스를 구현합니다.
 *
 * @remarks
 * NestJS 컨벤션을 따라 I prefix를 사용하지 않습니다.
 */
export interface ParserPort {
  /**
   * HTML을 파싱하여 와인 데이터를 추출합니다.
   *
   * @param html - 파싱할 HTML 문자열
   * @param sourceUrl - HTML의 원본 URL
   * @returns 파싱된 와인 데이터
   * @throws ParsingError 파싱 실패 시
   */
  parse(html: string, sourceUrl: string): Promise<WineData>;
}
