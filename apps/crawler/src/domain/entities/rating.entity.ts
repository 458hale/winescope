import { Score } from '../value-objects/score.vo';

/**
 * Rating Entity
 *
 * 와인의 평점 정보를 나타내는 엔티티입니다.
 */
export class Rating {
  constructor(
    public readonly source: string,
    public readonly score: Score,
    public readonly critic: string | null,
    public readonly reviewCount: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.source || this.source.trim().length === 0) {
      throw new Error('Rating source is required');
    }

    if (this.source.trim().length > 100) {
      throw new Error(
        `Rating source too long (max 100 chars): ${this.source}`,
      );
    }

    if (this.reviewCount < 0) {
      throw new Error(`Review count cannot be negative: ${this.reviewCount}`);
    }

    if (this.critic !== null && this.critic.trim().length === 0) {
      throw new Error('Critic name cannot be empty string (use null instead)');
    }
  }

  /**
   * Robert Parker(RP) 평점인지 확인합니다.
   */
  isRobertParker(): boolean {
    const rpKeywords = ['parker', 'rp', 'robert parker'];
    const critLower = (this.critic || '').toLowerCase();
    const sourceLower = this.source.toLowerCase();

    return rpKeywords.some(
      (keyword) =>
        critLower.includes(keyword) || sourceLower.includes(keyword),
    );
  }

  /**
   * 평점이 높은 등급인지 확인합니다 (90점 이상).
   */
  isHighRated(): boolean {
    return this.score.isHighRated();
  }

  /**
   * 평점이 신뢰할 수 있는지 확인합니다 (리뷰 수 10개 이상).
   */
  isReliable(): boolean {
    return this.reviewCount >= 10;
  }

  toJSON(): {
    source: string;
    score: number;
    critic: string | null;
    reviewCount: number;
  } {
    return {
      source: this.source,
      score: this.score.value,
      critic: this.critic,
      reviewCount: this.reviewCount,
    };
  }
}
