import { WineName } from '../value-objects/wine-name.vo';
import { Vintage } from '../value-objects/vintage.vo';

/**
 * Wine Entity
 *
 * 와인의 기본 정보를 나타내는 엔티티입니다.
 * Aggregate Root 역할을 합니다.
 */
export class Wine {
  constructor(
    public readonly name: WineName,
    public readonly region: string,
    public readonly winery: string,
    public readonly variety: string,
    public readonly vintage: Vintage,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.region || this.region.trim().length === 0) {
      throw new Error('Wine region is required');
    }

    if (this.region.trim().length > 100) {
      throw new Error(`Wine region too long (max 100 chars): ${this.region}`);
    }

    if (!this.winery || this.winery.trim().length === 0) {
      throw new Error('Winery is required');
    }

    if (this.winery.trim().length > 100) {
      throw new Error(`Winery name too long (max 100 chars): ${this.winery}`);
    }

    if (!this.variety || this.variety.trim().length === 0) {
      throw new Error('Wine variety is required');
    }

    if (this.variety.trim().length > 100) {
      throw new Error(`Wine variety too long (max 100 chars): ${this.variety}`);
    }
  }

  /**
   * 와인의 전체 설명을 반환합니다.
   * @example "Opus One 2018, Napa Valley, Cabernet Sauvignon"
   */
  getFullDescription(): string {
    return `${this.name.value} ${this.vintage.value}, ${this.region}, ${this.variety}`;
  }

  /**
   * 와인이 특정 지역에서 생산되었는지 확인합니다.
   */
  isFromRegion(regionName: string): boolean {
    return this.region.toLowerCase().includes(regionName.toLowerCase());
  }

  /**
   * 와인이 특정 와이너리에서 생산되었는지 확인합니다.
   */
  isFromWinery(wineryName: string): boolean {
    return this.winery.toLowerCase().includes(wineryName.toLowerCase());
  }

  toJSON(): {
    name: string;
    region: string;
    winery: string;
    variety: string;
    vintage: number;
  } {
    return {
      name: this.name.value,
      region: this.region,
      winery: this.winery,
      variety: this.variety,
      vintage: this.vintage.value,
    };
  }
}
