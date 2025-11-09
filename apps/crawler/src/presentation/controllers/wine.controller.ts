import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SearchWineUseCase } from '../../application/use-cases/search-wine.use-case';
import { WineSearchRequestDto } from '../../application/dto/wine-search-request.dto';
import { WineSearchResponseDto } from '../../application/dto/wine-search-response.dto';

/**
 * WineController
 *
 * 와인 검색 API 엔드포인트를 제공합니다.
 */
@Controller('wines')
export class WineController {
  private readonly logger = new Logger(WineController.name);

  constructor(private readonly searchWineUseCase: SearchWineUseCase) {}

  /**
   * POST /wines/search
   *
   * 와인 정보를 검색합니다.
   *
   * @param request - 와인 검색 요청
   * @returns 와인 검색 결과
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchWine(
    @Body() request: WineSearchRequestDto,
  ): Promise<WineSearchResponseDto> {
    this.logger.log(
      `Received wine search request: ${request.winery} ${request.variety} ${request.vintage}`,
    );

    const result = await this.searchWineUseCase.execute(request);

    this.logger.log(`Wine search completed successfully`);

    return result;
  }
}
