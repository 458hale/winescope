import { Wine } from './wine.entity';
import { WineName } from '../value-objects/wine-name.vo';
import { Vintage } from '../value-objects/vintage.vo';

describe('Wine Entity', () => {
  describe('constructor', () => {
    it('should create wine with valid data', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.name.value).toBe('Opus One');
      expect(wine.region).toBe('Napa Valley');
      expect(wine.winery).toBe('Opus One Winery');
      expect(wine.variety).toBe('Cabernet Sauvignon');
      expect(wine.vintage.value).toBe(2018);
    });

    it('should throw error for empty region', () => {
      expect(
        () =>
          new Wine(
            WineName.create('Opus One'),
            '',
            'Opus One Winery',
            'Cabernet Sauvignon',
            Vintage.create(2018),
          ),
      ).toThrow('Wine region is required');
    });

    it('should throw error for region exceeding 100 characters', () => {
      const longRegion = 'A'.repeat(101);
      expect(
        () =>
          new Wine(
            WineName.create('Opus One'),
            longRegion,
            'Opus One Winery',
            'Cabernet Sauvignon',
            Vintage.create(2018),
          ),
      ).toThrow('Wine region too long');
    });

    it('should throw error for empty winery', () => {
      expect(
        () =>
          new Wine(
            WineName.create('Opus One'),
            'Napa Valley',
            '',
            'Cabernet Sauvignon',
            Vintage.create(2018),
          ),
      ).toThrow('Winery is required');
    });

    it('should throw error for empty variety', () => {
      expect(
        () =>
          new Wine(
            WineName.create('Opus One'),
            'Napa Valley',
            'Opus One Winery',
            '',
            Vintage.create(2018),
          ),
      ).toThrow('Wine variety is required');
    });
  });

  describe('getFullDescription', () => {
    it('should return full wine description', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.getFullDescription()).toBe(
        'Opus One 2018, Napa Valley, Cabernet Sauvignon',
      );
    });
  });

  describe('isFromRegion', () => {
    it('should return true when wine is from specified region (case insensitive)', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.isFromRegion('Napa Valley')).toBe(true);
      expect(wine.isFromRegion('napa')).toBe(true);
      expect(wine.isFromRegion('VALLEY')).toBe(true);
    });

    it('should return false when wine is not from specified region', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.isFromRegion('Bordeaux')).toBe(false);
    });
  });

  describe('isFromWinery', () => {
    it('should return true when wine is from specified winery (case insensitive)', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.isFromWinery('Opus One')).toBe(true);
      expect(wine.isFromWinery('opus')).toBe(true);
    });

    it('should return false when wine is not from specified winery', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      expect(wine.isFromWinery('Chateau Margaux')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return wine data as plain object', () => {
      const wine = new Wine(
        WineName.create('Opus One'),
        'Napa Valley',
        'Opus One Winery',
        'Cabernet Sauvignon',
        Vintage.create(2018),
      );

      const json = wine.toJSON();

      expect(json).toEqual({
        name: 'Opus One',
        region: 'Napa Valley',
        winery: 'Opus One Winery',
        variety: 'Cabernet Sauvignon',
        vintage: 2018,
      });
    });
  });
});
