import { IsString, IsInt, Min, Max, IsNotEmpty, Length } from 'class-validator';

/**
 * Wine Search Request DTO
 *
 * 와인 검색 요청 데이터를 검증하고 전송합니다.
 */
export class WineSearchRequestDto {
  /**
   * 와인 지역 (예: "Napa Valley")
   */
  @IsString()
  @IsNotEmpty({ message: 'Region is required' })
  @Length(1, 100, { message: 'Region must be between 1 and 100 characters' })
  region!: string;

  /**
   * 와이너리 이름 (예: "Opus One")
   */
  @IsString()
  @IsNotEmpty({ message: 'Winery is required' })
  @Length(1, 100, { message: 'Winery must be between 1 and 100 characters' })
  winery!: string;

  /**
   * 와인 품종 (예: "Cabernet Sauvignon")
   */
  @IsString()
  @IsNotEmpty({ message: 'Variety is required' })
  @Length(1, 100, { message: 'Variety must be between 1 and 100 characters' })
  variety!: string;

  /**
   * 빈티지 연도 (1900 ~ 현재년도+5)
   */
  @IsInt({ message: 'Vintage must be an integer' })
  @Min(1900, { message: 'Vintage must be at least 1900' })
  @Max(new Date().getFullYear() + 5, {
    message: `Vintage cannot exceed ${new Date().getFullYear() + 5}`,
  })
  vintage!: number;
}
