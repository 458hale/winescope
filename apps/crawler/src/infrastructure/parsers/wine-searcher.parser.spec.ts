import { WineSearcherParser } from './wine-searcher.parser';
import * as fs from 'fs';
import * as path from 'path';

describe('WineSearcherParser', () => {
  let parser: WineSearcherParser;
  let mockHtml: string;

  beforeAll(() => {
    // Load mock HTML fixture
    const fixturePath = path.join(
      __dirname,
      '../../../test/fixtures/wine-searcher-sample.html',
    );
    mockHtml = fs.readFileSync(fixturePath, 'utf-8');
  });

  beforeEach(() => {
    parser = new WineSearcherParser();
  });

  describe('parse', () => {
    it('should parse wine data from HTML fixture', async () => {
      const sourceUrl = 'https://www.wine-searcher.com/find/opus+one+2018';

      const result = await parser.parse(mockHtml, sourceUrl);

      expect(result).toBeDefined();
      expect(result.sourceUrl).toBe(sourceUrl);
      expect(result.crawledAt).toBeInstanceOf(Date);
    });

    it('should extract wine basic information', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      expect(result.wine).toBeDefined();
      expect(result.wine.name.value).toBe('Opus One 2018');
      expect(result.wine.vintage.value).toBe(2018);
      expect(result.wine.region).toBe('Napa Valley');
      expect(result.wine.winery).toBe('Opus One Winery');
      expect(result.wine.variety).toBe('Cabernet Sauvignon');
    });

    it('should extract ratings information', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      expect(result.ratings).toBeDefined();
      expect(result.ratings.length).toBeGreaterThan(0);

      // Check first rating (Robert Parker)
      const rpRating = result.ratings.find((r) => r.isRobertParker());
      expect(rpRating).toBeDefined();
      expect(rpRating!.score.value).toBe(97);
      expect(rpRating!.source).toBe('Wine Advocate');
      expect(rpRating!.critic).toBe('Robert Parker');
      expect(rpRating!.reviewCount).toBe(125);
    });

    it('should extract multiple ratings', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      expect(result.ratings.length).toBe(3);

      const sources = result.ratings.map((r) => r.source);
      expect(sources).toContain('Wine Advocate');
      expect(sources).toContain('Wine-Searcher');
      expect(sources).toContain('Wine Spectator');
    });

    it('should extract price information', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      expect(result.price).toBeDefined();
      expect(result.price!.average).toBe(325);
      expect(result.price!.currency).toBe('USD');
      expect(result.price!.priceRange).toBe('$300-$400');
      expect(result.price!.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ParsingError when HTML is invalid', async () => {
      const invalidHtml = '<html><body></body></html>';

      await expect(parser.parse(invalidHtml, 'test-url')).rejects.toThrow(
        'Failed to parse HTML',
      );
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalHtml = `
        <html>
          <body>
            <h1>Test Wine 2020</h1>
            <span class="vintage">2020</span>
          </body>
        </html>
      `;

      const result = await parser.parse(minimalHtml, 'test-url');

      expect(result.wine.name.value).toBe('Test Wine 2020');
      expect(result.wine.vintage.value).toBe(2020);
      expect(result.ratings.length).toBe(0);
      expect(result.price).toBeNull();
    });
  });

  describe('Robert Parker detection', () => {
    it('should correctly identify Robert Parker ratings', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      const rpRating = result.ratings.find((r) => r.isRobertParker());
      expect(rpRating).toBeDefined();
      expect(rpRating!.isRobertParker()).toBe(true);
    });

    it('should identify non-Parker ratings', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      const wsRating = result.ratings.find((r) => r.source === 'Wine-Searcher');
      expect(wsRating).toBeDefined();
      expect(wsRating!.isRobertParker()).toBe(false);
    });
  });

  describe('data validation', () => {
    it('should create valid Wine entity', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      expect(result.wine.getFullDescription()).toContain('Opus One');
      expect(result.wine.getFullDescription()).toContain('2018');
      expect(result.wine.getFullDescription()).toContain('Napa Valley');
    });

    it('should create valid Rating entities', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      result.ratings.forEach((rating) => {
        expect(rating.score.value).toBeGreaterThanOrEqual(0);
        expect(rating.score.value).toBeLessThanOrEqual(100);
        expect(rating.reviewCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should create valid Price entity when present', async () => {
      const result = await parser.parse(mockHtml, 'test-url');

      if (result.price) {
        expect(result.price.average).toBeGreaterThan(0);
        expect(result.price.currency).toBeTruthy();
        expect(result.price.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
