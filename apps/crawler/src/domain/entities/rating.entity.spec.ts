import { Rating } from './rating.entity';
import { Score } from '../value-objects/score.vo';

describe('Rating Entity', () => {
  describe('constructor', () => {
    it('should create rating with valid data', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(95),
        'Robert Parker',
        125,
      );

      expect(rating.source).toBe('Wine-Searcher');
      expect(rating.score.value).toBe(95);
      expect(rating.critic).toBe('Robert Parker');
      expect(rating.reviewCount).toBe(125);
    });

    it('should create rating with null critic', () => {
      const rating = new Rating('Wine-Searcher', Score.create(95), null, 125);

      expect(rating.critic).toBeNull();
    });

    it('should throw error for empty source', () => {
      expect(
        () => new Rating('', Score.create(95), 'Robert Parker', 125),
      ).toThrow('Rating source is required');
    });

    it('should throw error for source exceeding 100 characters', () => {
      const longSource = 'A'.repeat(101);
      expect(
        () => new Rating(longSource, Score.create(95), 'Robert Parker', 125),
      ).toThrow('Rating source too long');
    });

    it('should throw error for negative review count', () => {
      expect(
        () =>
          new Rating('Wine-Searcher', Score.create(95), 'Robert Parker', -1),
      ).toThrow('Review count cannot be negative');
    });

    it('should throw error for empty string critic (should use null instead)', () => {
      expect(
        () => new Rating('Wine-Searcher', Score.create(95), '', 125),
      ).toThrow('Critic name cannot be empty string');
    });
  });

  describe('isRobertParker', () => {
    it('should return true when critic is Robert Parker', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(97),
        'Robert Parker',
        125,
      );
      expect(rating.isRobertParker()).toBe(true);
    });

    it('should return true when critic contains "parker" (case insensitive)', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(97),
        'parker',
        125,
      );
      expect(rating.isRobertParker()).toBe(true);
    });

    it('should return true when source contains "RP"', () => {
      const rating = new Rating('RP Score', Score.create(97), null, 125);
      expect(rating.isRobertParker()).toBe(true);
    });

    it('should return false when neither critic nor source matches', () => {
      const rating = new Rating(
        'Wine Spectator',
        Score.create(95),
        'James Suckling',
        200,
      );
      expect(rating.isRobertParker()).toBe(false);
    });
  });

  describe('isHighRated', () => {
    it('should return true for score >= 90', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(90),
        null,
        125,
      );
      expect(rating.isHighRated()).toBe(true);
    });

    it('should return false for score < 90', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(89),
        null,
        125,
      );
      expect(rating.isHighRated()).toBe(false);
    });
  });

  describe('isReliable', () => {
    it('should return true for review count >= 10', () => {
      const rating = new Rating('Wine-Searcher', Score.create(95), null, 10);
      expect(rating.isReliable()).toBe(true);
    });

    it('should return false for review count < 10', () => {
      const rating = new Rating('Wine-Searcher', Score.create(95), null, 9);
      expect(rating.isReliable()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return rating data as plain object', () => {
      const rating = new Rating(
        'Wine-Searcher',
        Score.create(95),
        'Robert Parker',
        125,
      );

      const json = rating.toJSON();

      expect(json).toEqual({
        source: 'Wine-Searcher',
        score: 95,
        critic: 'Robert Parker',
        reviewCount: 125,
      });
    });
  });
});
