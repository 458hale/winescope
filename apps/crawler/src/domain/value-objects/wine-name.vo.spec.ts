import { WineName } from './wine-name.vo';

describe('WineName Value Object', () => {
  describe('create', () => {
    it('should create wine name with valid value', () => {
      const name = WineName.create('Opus One');
      expect(name.value).toBe('Opus One');
    });

    it('should trim whitespace from wine name', () => {
      const name = WineName.create('  Opus One  ');
      expect(name.value).toBe('Opus One');
    });

    it('should throw error for empty string', () => {
      expect(() => WineName.create('')).toThrow('Wine name cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => WineName.create('   ')).toThrow(
        'Wine name cannot be empty',
      );
    });

    it('should throw error for name exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(() => WineName.create(longName)).toThrow(
        'Wine name cannot exceed 100 characters',
      );
    });

    it('should throw error for non-string value', () => {
      expect(() => WineName.create(123 as unknown as string)).toThrow(
        'Wine name must be a string',
      );
    });
  });

  describe('contains', () => {
    it('should return true when keyword is found (case insensitive)', () => {
      const name = WineName.create('Opus One Napa Valley');
      expect(name.contains('opus')).toBe(true);
      expect(name.contains('OPUS')).toBe(true);
      expect(name.contains('napa')).toBe(true);
    });

    it('should return false when keyword is not found', () => {
      const name = WineName.create('Opus One');
      expect(name.contains('Chateau')).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal wine names', () => {
      const name1 = WineName.create('Opus One');
      const name2 = WineName.create('Opus One');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different wine names', () => {
      const name1 = WineName.create('Opus One');
      const name2 = WineName.create('Chateau Margaux');
      expect(name1.equals(name2)).toBe(false);
    });
  });
});
