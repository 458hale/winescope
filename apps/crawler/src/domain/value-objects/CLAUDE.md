# Domain Value Objects

비즈니스 개념을 불변 값으로 캡슐화한 Value Object들입니다.

## 파일 구조

```
value-objects/
├── wine-name.vo.ts       # 와인 이름
├── vintage.vo.ts         # 빈티지 (연도)
├── score.vo.ts           # 평점
└── *.spec.ts            # 단위 테스트
```

## Value Object 패턴

### 핵심 특징

1. **불변성**: 생성 후 변경 불가
2. **자가 검증**: 생성 시 유효성 검증
3. **동등성**: 값이 같으면 동일한 객체
4. **정적 팩토리**: `create()` 메서드로 생성

### 공통 구조

```typescript
export class SomeVO {
  private readonly _value: T;

  private constructor(value: T) {
    this._value = value;
  }

  static create(value: T): SomeVO {
    // 검증 로직
    return new SomeVO(value);
  }

  get value(): T {
    return this._value;
  }

  equals(other: SomeVO): boolean {
    return this._value === other._value;
  }
}
```

## WineName

**용도**: 와인 이름을 캡슐화합니다.

### 검증 규칙

- 타입: string
- 길이: 1-100자
- 자동 trim 처리

### 생성

```typescript
const name = WineName.create('Opus One');
console.log(name.value);  // "Opus One"
```

### 메서드

**contains(keyword: string)**: 키워드 포함 여부
- 대소문자 무시

```typescript
const name = WineName.create('Château Margaux');
name.contains('margaux');  // true
name.contains('MARGAUX');  // true
```

### 에러 예시

```typescript
WineName.create('');       // Error: Wine name cannot be empty
WineName.create('a'.repeat(101));  // Error: Wine name cannot exceed 100 characters
WineName.create(123);      // Error: Wine name must be a string
```

## Vintage

**용도**: 와인의 빈티지(연도)를 캡슐화합니다.

### 검증 규칙

- 타입: number (정수)
- 범위: 1900 ~ 현재 연도

### 생성

```typescript
const vintage = Vintage.create(2018);
console.log(vintage.value);  // 2018
```

### 동적 범위

```typescript
// 현재 연도가 2024년이라면
Vintage.create(2024);  // ✅ 유효
Vintage.create(2025);  // ❌ Error: Vintage cannot be in the future
```

### 에러 예시

```typescript
Vintage.create(1899);       // Error: Vintage must be at least 1900
Vintage.create(2025);       // Error: Vintage cannot be in the future
Vintage.create(2018.5);     // Error: Vintage must be an integer
```

## Score

**용도**: 평점을 캡슐화합니다.

### 검증 규칙

- 타입: number
- 범위: 0-100
- 소수점 허용

### 생성

```typescript
const score = Score.create(95.5);
console.log(score.value);  // 95.5
```

### 비즈니스 메서드

**isHighRated()**: 고평점 여부
- 90점 이상

```typescript
Score.create(95).isHighRated();   // true
Score.create(89).isHighRated();   // false
Score.create(90).isHighRated();   // true (경계값)
```

### 에러 예시

```typescript
Score.create(-1);     // Error: Score must be between 0 and 100
Score.create(101);    // Error: Score must be between 0 and 100
Score.create('95');   // Error: Score must be a number
```

## Value Object vs Entity

| 특징 | Value Object | Entity |
|------|--------------|--------|
| 식별자 | 없음 (값으로 식별) | 있음 (ID) |
| 동등성 | 값 기반 | ID 기반 |
| 불변성 | 항상 불변 | 가변 가능 |
| 생명주기 | 없음 | 있음 |
| 예시 | WineName, Score | Wine, Rating |

## 설계 원칙

### Private Constructor

외부에서 직접 생성하지 못하도록 생성자를 private으로 선언합니다.

```typescript
// ✅ Good
const name = WineName.create('Opus One');

// ❌ Bad - 컴파일 에러
const name = new WineName('Opus One');
```

### Immutability

`readonly` 필드와 getter만 제공하여 불변성을 보장합니다.

```typescript
class WineName {
  private readonly _value: string;  // private + readonly

  get value(): string {  // getter만 제공
    return this._value;
  }
}
```

### Self-Contained Validation

모든 검증 로직이 VO 내부에 캡슐화되어 있습니다.

```typescript
static create(value: string): WineName {
  if (typeof value !== 'string') {
    throw new Error('Wine name must be a string');
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error('Wine name cannot be empty');
  }
  // ...
}
```

## 테스트 전략

### 정상 케이스

```typescript
it('유효한 값으로 VO 생성', () => {
  const name = WineName.create('Opus One');
  expect(name.value).toBe('Opus One');
});
```

### 경계값 테스트

```typescript
it('1자 이름 허용', () => {
  expect(() => WineName.create('A')).not.toThrow();
});

it('100자 이름 허용', () => {
  const name = 'A'.repeat(100);
  expect(() => WineName.create(name)).not.toThrow();
});

it('101자 이름 거부', () => {
  const name = 'A'.repeat(101);
  expect(() => WineName.create(name)).toThrow();
});
```

### 동등성 테스트

```typescript
it('같은 값이면 동등', () => {
  const name1 = WineName.create('Opus One');
  const name2 = WineName.create('Opus One');
  expect(name1.equals(name2)).toBe(true);
});

it('다른 값이면 비동등', () => {
  const name1 = WineName.create('Opus One');
  const name2 = WineName.create('Margaux');
  expect(name1.equals(name2)).toBe(false);
});
```

## 확장 가이드

### 새 Value Object 추가

1. 파일 생성: `{vo-name}.vo.ts`
2. Private constructor 정의
3. `static create()` 팩토리 메서드
4. 검증 로직 구현
5. `get value()` getter
6. `equals()` 메서드
7. 비즈니스 메서드 (선택적)
8. 테스트 파일: `{vo-name}.vo.spec.ts`

### 예시: Email VO

```typescript
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    return new Email(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  getDomain(): string {
    return this._value.split('@')[1];
  }
}
```
