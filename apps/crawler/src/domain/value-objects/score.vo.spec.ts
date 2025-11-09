import { Score } from './score.vo';

describe('Score Value Object', () => {
  describe('create', () => {
    it('should create score with valid value', () => {
      const score = Score.create(95);
      expect(score.value).toBe(95);
    });

    it('should create score with minimum value (0)', () => {
      const score = Score.create(0);
      expect(score.value).toBe(0);
    });

    it('should create score with maximum value (100)', () => {
      const score = Score.create(100);
      expect(score.value).toBe(100);
    });

    it('should throw error for negative value', () => {
      expect(() => Score.create(-1)).toThrow(
        'Score must be between 0 and 100',
      );
    });

    it('should throw error for value above 100', () => {
      expect(() => Score.create(101)).toThrow(
        'Score must be between 0 and 100',
      );
    });

    it('should throw error for NaN', () => {
      expect(() => Score.create(NaN)).toThrow('Score must be a valid number');
    });

    it('should throw error for non-number', () => {
      expect(() => Score.create('95' as unknown as number)).toThrow(
        'Score must be a valid number',
      );
    });
  });

  describe('isHighRated', () => {
    it('should return true for score >= 90', () => {
      const score = Score.create(90);
      expect(score.isHighRated()).toBe(true);
    });

    it('should return false for score < 90', () => {
      const score = Score.create(89);
      expect(score.isHighRated()).toBe(false);
    });
  });

  describe('isExcellent', () => {
    it('should return true for score >= 85', () => {
      const score = Score.create(85);
      expect(score.isExcellent()).toBe(true);
    });

    it('should return false for score < 85', () => {
      const score = Score.create(84);
      expect(score.isExcellent()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal scores', () => {
      const score1 = Score.create(95);
      const score2 = Score.create(95);
      expect(score1.equals(score2)).toBe(true);
    });

    it('should return false for different scores', () => {
      const score1 = Score.create(95);
      const score2 = Score.create(90);
      expect(score1.equals(score2)).toBe(false);
    });
  });
});
