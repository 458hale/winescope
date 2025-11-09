/**
 * Price Entity
 *
 * 와인의 가격 정보를 나타내는 엔티티입니다.
 */
export class Price {
  constructor(
    public readonly average: number,
    public readonly currency: string,
    public readonly priceRange: string | null,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.average < 0) {
      throw new Error(`Average price cannot be negative: ${this.average}`);
    }

    if (!this.currency || this.currency.length === 0) {
      throw new Error('Currency is required');
    }

    if (this.currency.length > 10) {
      throw new Error(
        `Currency code too long (max 10 chars): ${this.currency}`,
      );
    }

    if (!(this.updatedAt instanceof Date) || isNaN(this.updatedAt.getTime())) {
      throw new Error(`Invalid updatedAt date: ${this.updatedAt}`);
    }
  }

  /**
   * 가격을 포맷팅하여 반환합니다.
   * @example "$325.00 USD"
   */
  format(): string {
    return `${this.currency} ${this.average.toFixed(2)}`;
  }

  /**
   * 가격이 고가인지 확인합니다 (평균 $200 이상).
   */
  isExpensive(): boolean {
    // USD 기준으로 판단 (간단한 구현)
    const usdEquivalent =
      this.currency.toUpperCase() === 'USD' ? this.average : this.average;
    return usdEquivalent >= 200;
  }

  /**
   * 가격 정보가 최근 것인지 확인합니다 (7일 이내).
   */
  isRecent(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.updatedAt >= sevenDaysAgo;
  }

  toJSON(): {
    average: number;
    currency: string;
    priceRange: string | null;
    updatedAt: string;
  } {
    return {
      average: this.average,
      currency: this.currency,
      priceRange: this.priceRange,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
