/**
 * WineName Value Object
 *
 * 와인 이름을 나타내는 값 객체입니다.
 * 1자 이상 100자 이하의 문자열을 허용합니다.
 */
export class WineName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * 와인 이름 값 객체를 생성합니다.
   *
   * @param value - 와인 이름 (1-100자)
   * @throws Error 유효하지 않은 이름인 경우
   */
  static create(value: string): WineName {
    if (typeof value !== 'string') {
      throw new Error(`Wine name must be a string, got: ${typeof value}`);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Wine name cannot be empty');
    }

    if (trimmed.length > 100) {
      throw new Error(
        `Wine name cannot exceed 100 characters, got: ${trimmed.length}`,
      );
    }

    return new WineName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: WineName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  /**
   * 와인 이름에 특정 키워드가 포함되어 있는지 확인합니다.
   */
  contains(keyword: string): boolean {
    return this._value.toLowerCase().includes(keyword.toLowerCase());
  }
}
