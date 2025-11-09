import { Vintage } from './vintage.vo';

describe('Vintage Value Object', () => {
  describe('create', () => {
    it('should create vintage with valid year', () => {
      const vintage = Vintage.create(2018);
      expect(vintage.value).toBe(2018);
    });

    it('should create vintage with minimum year (1900)', () => {
      const vintage = Vintage.create(1900);
      expect(vintage.value).toBe(1900);
    });

    it('should create vintage with future year (current + 5)', () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 5;
      const vintage = Vintage.create(futureYear);
      expect(vintage.value).toBe(futureYear);
    });

    it('should throw error for year below 1900', () => {
      expect(() => Vintage.create(1899)).toThrow(
        'Vintage must be between 1900 and',
      );
    });

    it('should throw error for year beyond current + 5', () => {
      const currentYear = new Date().getFullYear();
      const tooFarFuture = currentYear + 10;
      expect(() => Vintage.create(tooFarFuture)).toThrow(
        'Vintage must be between 1900 and',
      );
    });

    it('should throw error for non-integer value', () => {
      expect(() => Vintage.create(2018.5)).toThrow(
        'Vintage must be an integer',
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal vintages', () => {
      const vintage1 = Vintage.create(2018);
      const vintage2 = Vintage.create(2018);
      expect(vintage1.equals(vintage2)).toBe(true);
    });

    it('should return false for different vintages', () => {
      const vintage1 = Vintage.create(2018);
      const vintage2 = Vintage.create(2019);
      expect(vintage1.equals(vintage2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return vintage as string', () => {
      const vintage = Vintage.create(2018);
      expect(vintage.toString()).toBe('2018');
    });
  });
});
