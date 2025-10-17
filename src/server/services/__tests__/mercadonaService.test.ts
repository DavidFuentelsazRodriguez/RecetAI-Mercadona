// src/server/services/__tests__/mercadonaService.test.ts

import axios from 'axios';
import {
  fetchCategories,
  fetchProductsByCategory,
  fetchAllProducts,
  transformToProduct,
  getTransformedProducts,
  MercadonaCategoryBase,
  MercadonaProduct,
} from '../mercadonaService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function createMockResponse<T>(data: T, status = 200, statusText = 'OK') {
  return {
    data,
    status,
    statusText,
    headers: {},
    config: {} as any,
  };
}

describe('Mercadona Service', () => {
  // Sample test data
  const mockCategory: MercadonaCategoryBase = {
    id: 123,
    name: 'Test Category',
    order: 1,
    published: true,
    is_extended: false,
  };

  const mockProduct: MercadonaProduct = {
    display_name: 'Test Product',
    thumbnail: 'http://example.com/image.jpg',
    categories: [{ name: 'Test Category' }],
    price_instructions: {
      unit_price: '1.99',
      unit_size: 1,
      size_format: 'unit',
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCategories', () => {
    it('should fetch and flatten categories', async () => {
      // Mock API response
      const mockResponse = createMockResponse({
        results: [
            {
              ...mockCategory,
              categories: [{ ...mockCategory, id: 124, name: 'Subcategory' }],
            },
          ],
      });

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchCategories();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/categories/'),
        expect.any(Object)
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Category');
      expect(result[1].name).toBe('Subcategory');
    });
  });

  describe('fetchProductsByCategory', () => {
    it('should fetch and extract products from a category', async () => {
      const mockResponse = createMockResponse({
        categories: [
            {
              ...mockCategory,
              products: [mockProduct],
            },
          ],
      });
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchProductsByCategory(123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/categories/123/'),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0].display_name).toBe('Test Product');
    });
  });

  describe('transformToProduct', () => {
    it('should transform Mercadona product to our format', () => {
      const result = transformToProduct(mockProduct);

      expect(result).toEqual({
        name: 'Test Product',
        brand: 'Mercadona',
        category: 'Test Category',
        imageUrl: 'http://example.com/image.jpg',
        price: 1.99,
        unit: '1 unit',
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        isMercadona: true,
        lastUpdated: expect.any(Date),
      });
    });

    it('should handle missing optional fields', () => {
      const minimalProduct = { ...mockProduct } as Partial<MercadonaProduct>;
      delete minimalProduct.thumbnail;
      minimalProduct.categories = [];

      const result = transformToProduct(minimalProduct as MercadonaProduct);

      expect(result.category).toBe('Otros');
      expect(result.imageUrl).toBe('');
    });
  });

  describe('fetchAllProducts', () => {
    it('should fetch products from all categories', async () => {
      // Mock fetchCategories
      jest
        .spyOn(require('../mercadonaService'), 'fetchCategories')
        .mockResolvedValue([mockCategory]);

      // Mock fetchProductsByCategory
      jest
        .spyOn(require('../mercadonaService'), 'fetchProductsByCategory')
        .mockResolvedValue([mockProduct]);

      const result = await fetchAllProducts();

      expect(result).toHaveLength(1);
      expect(result[0].display_name).toBe('Test Product');
    });
  });

  describe('getTransformedProducts', () => {
    it('should fetch and transform all products', async () => {
      // Mock fetchAllProducts
      jest
        .spyOn(require('../mercadonaService'), 'fetchAllProducts')
        .mockResolvedValue([mockProduct]);

      const result = await getTransformedProducts();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].isMercadona).toBe(true);
    });
  });
});
