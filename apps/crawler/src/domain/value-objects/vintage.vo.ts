/**
 * Vintage Value Object
 *
 * 빈티지 연도를 나타내는 값 객체입니다.
 * 1900년부터 현재+5년까지의 범위를 허용합니다.
 */
export class Vintage {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * 빈티지 값 객체를 생성합니다.
   *
   * @param value - 빈티지 연도 (1900 ~ 현재년도+5)
   * @throws Error 유효하지 않은 빈티지 값인 경우
   */
  static create(value: number): Vintage {
    const currentYear = new Date().getFullYear();
    const minYear = 1900;
    const maxYear = currentYear + 5; // 미래 빈티지 고려

    if (!Number.isInteger(value)) {
      throw new Error(`Vintage must be an integer, got: ${value}`);
    }

    if (value < minYear || value > maxYear) {
      throw new Error(
        `Vintage must be between ${minYear} and ${maxYear}, got: ${value}`,
      );
    }

    return new Vintage(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: Vintage): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
