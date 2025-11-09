import { Price } from './price.entity';

describe('Price Entity', () => {
  describe('constructor', () => {
    it('should create price with valid data', () => {
      const updatedAt = new Date('2024-11-09');
      const price = new Price(325, 'USD', '$300-$400', updatedAt);

      expect(price.average).toBe(325);
      expect(price.currency).toBe('USD');
      expect(price.priceRange).toBe('$300-$400');
      expect(price.updatedAt).toEqual(updatedAt);
    });

    it('should create price with null price range', () => {
      const price = new Price(325, 'USD', null, new Date());

      expect(price.priceRange).toBeNull();
    });

    it('should throw error for negative average price', () => {
      expect(() => new Price(-1, 'USD', null, new Date())).toThrow(
        'Average price cannot be negative',
      );
    });

    it('should throw error for empty currency', () => {
      expect(() => new Price(325, '', null, new Date())).toThrow(
        'Currency is required',
      );
    });

    it('should throw error for currency exceeding 10 characters', () => {
      const longCurrency = 'A'.repeat(11);
      expect(() => new Price(325, longCurrency, null, new Date())).toThrow(
        'Currency code too long',
      );
    });

    it('should throw error for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(() => new Price(325, 'USD', null, invalidDate)).toThrow(
        'Invalid updatedAt date',
      );
    });
  });

  describe('format', () => {
    it('should format price correctly', () => {
      const price = new Price(325.5, 'USD', null, new Date());
      expect(price.format()).toBe('USD 325.50');
    });

    it('should format price with EUR currency', () => {
      const price = new Price(280, 'EUR', null, new Date());
      expect(price.format()).toBe('EUR 280.00');
    });
  });

  describe('isExpensive', () => {
    it('should return true for price >= $200', () => {
      const price = new Price(200, 'USD', null, new Date());
      expect(price.isExpensive()).toBe(true);
    });

    it('should return false for price < $200', () => {
      const price = new Price(199, 'USD', null, new Date());
      expect(price.isExpensive()).toBe(false);
    });
  });

  describe('isRecent', () => {
    it('should return true for price updated within 7 days', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const price = new Price(325, 'USD', null, recentDate);
      expect(price.isRecent()).toBe(true);
    });

    it('should return false for price updated more than 7 days ago', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const price = new Price(325, 'USD', null, oldDate);
      expect(price.isRecent()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return price data as plain object with ISO date', () => {
      const updatedAt = new Date('2024-11-09T10:00:00Z');
      const price = new Price(325, 'USD', '$300-$400', updatedAt);

      const json = price.toJSON();

      expect(json).toEqual({
        average: 325,
        currency: 'USD',
        priceRange: '$300-$400',
        updatedAt: '2024-11-09T10:00:00.000Z',
      });
    });
  });
});
