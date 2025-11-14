/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import app from '../../index';
import * as productsService from '../../services/productsService';

jest.mock('../../services/productsService');

const mockedProductsService = productsService as jest.Mocked<typeof productsService>;

describe('Products Controller (Integration Tests)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products and pagination defaults correctly', async () => {
      const mockServiceResponse = {
        success: true,
        data: [{ name: 'Leche' }],
        total: 1,
        count: 1,
        page: 1,
      };
      mockedProductsService.getProducts.mockResolvedValue(mockServiceResponse as any);

      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].name).toBe('Leche');
      
      expect(mockedProductsService.getProducts).toHaveBeenCalledWith(1, 20);
    });

    it('should pass query params correctly to the service', async () => {
      mockedProductsService.getProducts.mockResolvedValue({ data: [] } as any);

      await request(app).get('/api/products?page=3&limit=15');

      expect(mockedProductsService.getProducts).toHaveBeenCalledWith(3, 15);
    });

    it('should return 500 if the service throws an error', async () => {
      mockedProductsService.getProducts.mockRejectedValue(new Error('DB Error'));

      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Failed to fetch products');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 200 and the product if found', async () => {
      const mockProduct = { _id: '123', name: 'Tomate' };
      mockedProductsService.getProductById.mockResolvedValue(mockProduct as any);

      const res = await request(app).get('/api/products/123');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Tomate');
      expect(mockedProductsService.getProductById).toHaveBeenCalledWith('123');
    });

    it('should return 404 if the service returns null', async () => {
      mockedProductsService.getProductById.mockResolvedValue(null);

      const res = await request(app).get('/api/products/654');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });

    it('should return 500 if the service throws', async () => {
      mockedProductsService.getProductById.mockRejectedValue(new Error('Invalid ID format'));

      const res = await request(app).get('/api/products/bad-id');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Failed to fetch product');
    });
  });

  describe('POST /api/products/sync', () => {
    it('should return 200 and sync results on success', async () => {
      const mockSyncResult = { success: true, syncedCount: 150 };
      mockedProductsService.syncProducts.mockResolvedValue(mockSyncResult as any);

      const res = await request(app).post('/api/products/sync');

      expect(res.statusCode).toBe(200);
      expect(res.body.syncedCount).toBe(150);
      expect(mockedProductsService.syncProducts).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if sync service fails', async () => {
      mockedProductsService.syncProducts.mockRejectedValue(new Error('Scraper failed'));

      const res = await request(app).post('/api/products/sync');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Failed to sync products');
    });
  });

  describe('DELETE /api/products/clean', () => {
    it('should return 200 and delete results on success', async () => {
      const mockCleanResult = { success: true, deletedCount: 150 };
      mockedProductsService.cleanMercadonaProducts.mockResolvedValue(mockCleanResult as any);

      const res = await request(app).delete('/api/products/clean');

      expect(res.statusCode).toBe(200);
      expect(res.body.deletedCount).toBe(150);
      expect(mockedProductsService.cleanMercadonaProducts).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if clean service fails', async () => {
      mockedProductsService.cleanMercadonaProducts.mockRejectedValue(new Error('DB lock'));

      const res = await request(app).delete('/api/products/clean');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Failed to clean products');
    });
  });
});