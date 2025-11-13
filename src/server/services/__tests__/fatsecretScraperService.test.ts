/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { getMercadonaProductsFromFatSecret } from '../fatsecretScraperService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FatSecret Scraper Service', () => {
  // 1. CONSTANTES GLOBALES
  // Definimos los HTMLs base que no cambian
  const MOCK_LIST_HTML = `
    <html>
      <body>
        <div class="searchResult">
            <a class="prominent" href="/calor%C3%ADas-nutrici%C3%B3n/mercadona/leche-entera">
            Leche Entera Hacendado
            </a>
        </div>
      </body>
    </html>
  `;

  const MOCK_EMPTY_HTML = `<html><body></body></html>`;

  // HTMLs específicos para cada caso (Happy path vs Error path)
  const VALID_DETAIL_HTML = `
    <html>
      <body>
        <div class="nutrition_facts eu">
          <div class="serving_size black serving_size_value">100 ml</div>
          <div class="nutrient left w1">Energía</div><div class="tRight w2">60 kcal</div>
          <div class="nutrient left w1">Proteína</div><div class="tRight w2">3,2 g</div>
          <div class="nutrient left w1">Carbohidrato</div><div class="tRight w2">4,6 g</div>
          <div class="nutrient left w1">Grasa</div><div class="tRight w2">3,6 g</div>
        </div>
      </body>
    </html>
  `;

  const setupScraperMock = (detailHtml: string = VALID_DETAIL_HTML) => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      // Case A: Search results (Page 1)
      if (url.includes('search') && !url.includes('pg=2')) {
        return { data: MOCK_LIST_HTML, status: 200 } as any;
      }

      // Case B: Product detail (Here we inject the HTML variable)
      if (url.includes('leche-entera') || url.includes('calor%C3%ADas')) {
        return { data: detailHtml, status: 200 } as any;
      }

      // Case C: Pagination (End of the loop)
      if (url.includes('pg=2')) {
        return { data: MOCK_EMPTY_HTML, status: 404 } as any;
      }

      return { status: 404 } as any;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupScraperMock(VALID_DETAIL_HTML);
  });

  it('should scrape products and extract nutrition data correctly (Happy Path)', async () => {
    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products).toHaveLength(1);
    expect(products[0].nutritionalInfo).toEqual(
      expect.objectContaining({
        calories: 60,
        protein: 3.2,
      })
    );
  });

  it('should handle parsing errors gracefully (Mixed Valid/Invalid Data)', async () => {
    // arrange
    const mixedHtml = `
      <html>
        <body>
          <div class="nutrition_facts eu">
            <div class="serving_size black serving_size_value">100 g</div>
            <div class="nutrient left w1">Energía</div><div class="tRight w2">N/A</div>
            <div class="nutrient left w1">Proteína</div>
            <div class="tRight w2">10 g</div>
          </div>
        </body>
      </html>
    `;
    setupScraperMock(mixedHtml);

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products).toHaveLength(1);
    expect(products[0].nutritionalInfo.calories).toBe(0); // Falló
    expect(products[0].nutritionalInfo.protein).toBe(10); // Funcionó
  });

  it('should correctly parse kJ and convert to kcal', async () => {
    // arrange
    const kjHtml = `
      <html>
        <body>
          <div class="nutrition_facts eu">
            <div class="serving_size black serving_size_value">100 g</div>
            <div class="nutrient left w1">Energía</div><div class="tRight w2">418 kj</div>
          </div>
        </body>
      </html>
    `;
    setupScraperMock(kjHtml);

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products[0].nutritionalInfo.calories).toBeCloseTo(99.9, 1);
  });

  it('should handle network errors without crashing', async () => {
    // arrange
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products).toEqual([]);
  });
  it('should parse all detailed nutrients (saturated fat, sugar, fiber, sodium)', async () => {
    // arrange
    const fullNutrientHtml = `
      <html><body>
        <div class="nutrition_facts eu">
          <div class="serving_size black serving_size_value">100 g</div>
          <div class="nutrient left w1">Energía</div><div class="tRight w2">100 kcal</div>
          <div class="nutrient left w1">Grasa</div><div class="tRight w2">10 g</div>
          <div class="nutrient left w1">Grasa saturada</div><div class="tRight w2">2,5 g</div>
          <div class="nutrient left w1">Azúcar</div><div class="tRight w2">5,5 g</div>
          <div class="nutrient left w1">Fibra</div><div class="tRight w2">3 g</div>
          <div class="nutrient left w1">Sal</div><div class="tRight w2">1,2 g</div>
        </div>
      </body></html>
    `;

    setupScraperMock(fullNutrientHtml);

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products[0].nutritionalInfo).toEqual(
      expect.objectContaining({
        fat: 10,
        saturatedFat: 2.5,
        sugar: 5.5,
        fiber: 3,
        sodium: 1.2,
      })
    );
  });

  it('should iterate through multiple pages until no more pages exist', async () => {
    // arrange
    mockedAxios.get.mockImplementation(async (url: string) => {
      // 1. Page 1 or Page 2 search results
      if (url.includes('search')) {
        if (!url.includes('pg=')) {
          // Page 1
          return {
            data: `<html>
            <body>
              <div class="searchResult">
                <a class="prominent" href="/calor%C3%ADas-nutrici%C3%B3n/mercadona/prod1">Prod1</a>
              </div>
            </body>
          </html>`,
            status: 200,
          } as any;
        }
        if (url.includes('pg=2')) {
          // Page 2
          return {
            data: `<html>
            <body>
              <div class="searchResult">
                <a class="prominent" href="/calor%C3%ADas-nutrici%C3%B3n/mercadona/prod2">Prod2</a>
              </div>
            </body>
          </html>`,
            status: 200,
          } as any;
        }
        if (url.includes('pg=3')) {
          // Page 3 (End of loop)
          return { status: 404 } as any;
        }
      }

      // 2. Product details (Generic valid response for any product)
      return { data: VALID_DETAIL_HTML, status: 200 } as any;
    });

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    // Should have 2 products (one from page 1, one from page 2)
    expect(products).toHaveLength(2);
    expect(products[0].name).toBe('Prod1');
    expect(products[1].name).toBe('Prod2');

    // Verify calls: Page 1, Check Page 2, Page 2, Check Page 3
    // Note: Logic calls "hasNextPage" which triggers a GET to next page
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('pg=2'),
      expect.anything()
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('pg=3'),
      expect.anything()
    );
  });

  it('should correctly resolve relative URLs to absolute FatSecret URLs', async () => {
    // arrange
    const relativeUrlHtml = `
      <html><body><div class="searchResult">
        <a class="prominent" href="/calor%C3%ADas-nutrici%C3%B3n/mercadona/relativo">Producto Relativo</a>
      </div></body></html>
    `;

    mockedAxios.get.mockImplementation(async url => {
      if (url.includes('search') && !url.includes('pg=2'))
        return { data: relativeUrlHtml, status: 200 } as any;

      // Check if the scraper requests the FULL URL correctly
      if (url === 'https://www.fatsecret.es/calor%C3%ADas-nutrici%C3%B3n/mercadona/relativo') {
        return { data: VALID_DETAIL_HTML, status: 200 } as any;
      }

      return { status: 404 } as any;
    });

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Producto Relativo');
  });

  it('should stop scraping if a page returns 200 OK but contains no product links', async () => {
    // arrange
    const emptyListHtml = `
      <html><body>
        <h1>No results found</h1>
        </body></html>
    `;

    mockedAxios.get.mockImplementation(async url => {
      if (url.includes('search')) return { data: emptyListHtml, status: 200 } as any;
      return { status: 404 } as any;
    });

    // act
    const products = await getMercadonaProductsFromFatSecret();

    // assert
    expect(products).toHaveLength(0);
    // Should verify it didn't try to fetch any product details
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
