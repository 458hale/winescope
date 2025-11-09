/**
 * Score Value Object
 *
 * 와인 평점을 나타내는 값 객체입니다.
 * 0부터 100까지의 범위를 허용합니다.
 */
export class Score {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * 점수 값 객체를 생성합니다.
   *
   * @param value - 점수 (0-100)
   * @throws Error 유효하지 않은 점수인 경우
   */
  static create(value: number): Score {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Score must be a valid number, got: ${value}`);
    }

    if (value < 0 || value > 100) {
      throw new Error(`Score must be between 0 and 100, got: ${value}`);
    }

    return new Score(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: Score): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }

  /**
   * 점수가 높은 등급(90점 이상)인지 확인합니다.
   */
  isHighRated(): boolean {
    return this._value >= 90;
  }

  /**
   * 점수가 우수한 등급(85점 이상)인지 확인합니다.
   */
  isExcellent(): boolean {
    return this._value >= 85;
  }
}
