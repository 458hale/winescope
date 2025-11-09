/**
 * Wine Search Response DTO
 *
 * 와인 검색 결과를 클라이언트에 전달합니다.
 */

export class WineInfoDto {
  name!: string;
  region!: string;
  winery!: string;
  variety!: string;
  vintage!: number;
}

export class RatingDto {
  source!: string;
  score!: number;
  critic!: string | null;
  reviewCount!: number;
}

export class PriceDto {
  average!: number;
  currency!: string;
  priceRange!: string | null;
  updatedAt!: string; // ISO 8601 format
}

export class SourceDto {
  site!: string;
  url!: string;
  crawledAt!: string; // ISO 8601 format
}

export class WineSearchResponseDto {
  wine!: WineInfoDto;
  ratings!: RatingDto[];
  price!: PriceDto | null;
  source!: SourceDto;
}
