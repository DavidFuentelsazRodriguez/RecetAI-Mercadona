/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorMessages } from '../../utils/validation';
import { Product } from '../../models/Product';
import { getMercadonaProductsFromFatSecret } from '../fatsecretScraperService';
import { 
  getProducts, 
  cleanMercadonaProducts, 
  syncProducts, 
  getProductById 
} from '../productsService';

// Mock scraper service
jest.mock('../fatsecretScraperService', () => ({
  getMercadonaProductsFromFatSecret: jest.fn(),
}));

// Mock mongoose model
const mockLean = jest.fn();
const mockLimit = jest.fn(() => ({ lean: mockLean }));
const mockSkip = jest.fn(() => ({ limit: mockLimit }));
const mockSort = jest.fn(() => ({ skip: mockSkip }));

jest.mock('../../models/Product', () => ({
  Product: {
    // We mock the static methods used by the service 
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
    find: jest.fn(() => ({ sort: mockSort })),
    countDocuments: jest.fn(),
    findById: jest.fn(),
  },
}));

// Mock typescript types
const mockedGetMercadonaProducts = getMercadonaProductsFromFatSecret as jest.Mock;
const mockedProduct = Product as jest.Mocked<typeof Product>;


// Test data
const mockProducts = [
  { name: 'Leche', category: 'Lácteos' },
  { name: 'Pan', category: 'Panadería' },
];

// -----------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------
describe('ProductsService', () => {

  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks(); 
    mockLean.mockClear();
    mockSort.mockClear();
    mockSkip.mockClear();
    mockLimit.mockClear();
  });

  describe('getProducts', () => {
    
    it('should return products and pagination correctly', async () => {
      // Arrange
      mockLean.mockResolvedValue(mockProducts); 
      mockedProduct.countDocuments.mockResolvedValue(2);

      // Act
      const result = await getProducts(1, 20);

      // Assert
      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.count).toBe(2);
      expect(result.page).toBe(1);
      expect(result.data).toEqual(mockProducts); 

      // Verify that the database was called with the correct parameters
      expect(mockedProduct.find).toHaveBeenCalledWith({}); // Empty query
      expect(mockSort).toHaveBeenCalledWith({ name: 1 }); // Correct order
      expect(mockSkip).toHaveBeenCalledWith(0); // Correct pagination
      expect(mockLimit).toHaveBeenCalledWith(20); // Correct Limit
      expect(mockedProduct.countDocuments).toHaveBeenCalledWith({}); // Empty query
    });
  });

  describe('cleanMercadonaProducts', () => {
    
    it('should clean Mercadona products', async () => {
      // Arrange
      // Simulate that the DB deleted 10 products
      mockedProduct.deleteMany.mockResolvedValue({ deletedCount: 10, acknowledged: true });

      // Act
      const result = await cleanMercadonaProducts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(10);
      expect(result.message).toContain('10');
      
      // Verify that deleteMany was called with the correct filter
      expect(mockedProduct.deleteMany).toHaveBeenCalledWith({ isMercadona: true });
    });

    it('should throw an error if the DB fails', async () => {
      // Arrange
      const mockError = new Error('Error de BBDD');
      mockedProduct.deleteMany.mockRejectedValue(mockError);

      // Act and Assert
      await expect(cleanMercadonaProducts()).rejects.toThrow(
        ErrorMessages.failedToCleanProducts()
      );
    });
  });

  
  describe('syncProducts', () => {
    // Test data that simulates the scraper response
    const mockScrapedProducts = [
      { name: 'Chicken', brand: 'Hacendado', nutritionalInfo: { calories: 150 } },
      { name: 'Cheese', brand: 'Hacendado', nutritionalInfo: { calories: 300 } },
    ];

    it('should sync products and call bulkWrite correctly', async () => {
      // Arrange 
      mockedGetMercadonaProducts.mockResolvedValue(mockScrapedProducts);
      
      // Mock the database response (bulkWrite)
      const mockBulkResult = { upsertedCount: 2, modifiedCount: 0 };
      mockedProduct.bulkWrite.mockResolvedValue(mockBulkResult as any);

      // Act
      const result = await syncProducts();

      // Assert 
      // Verify the service response
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(2);
      expect(result.stats).toEqual(mockBulkResult);

      // Verify the scraper was called
      expect(mockedGetMercadonaProducts).toHaveBeenCalledTimes(1);

      // Verify bulkWrite was called
      expect(mockedProduct.bulkWrite).toHaveBeenCalledTimes(1);

      const expectedBulkOps = mockScrapedProducts.map(product => ({
        updateOne: {
          filter: { name: product.name },
          update: {
            $set: product,
          },
          upsert: true,
        },
      }));

      // Check that bulkWrite was called with the correct operations
      expect(mockedProduct.bulkWrite).toHaveBeenCalledWith(expectedBulkOps);
    });

    it('should not call bulkWrite if there are no products', async () => {
      // Arrange
      // Scraper returns no products
      mockedGetMercadonaProducts.mockResolvedValue([]);

      // Act
      const result = await syncProducts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
      
      // Verify bulkWrite was NOT called
      expect(mockedProduct.bulkWrite).not.toHaveBeenCalled();
    });

    it('should throw an error if the scraper fails', async () => {
      // Arrange
      const mockError = new Error('Scraper failed');
      mockedGetMercadonaProducts.mockRejectedValue(mockError);

      // Act and Assert
      await expect(syncProducts()).rejects.toThrow(ErrorMessages.failedToSyncProducts());

      // Verify bulkWrite was not even attempted
      expect(mockedProduct.bulkWrite).not.toHaveBeenCalled();
    });

    it('should throw an error if bulkWrite fails', async () => {
      // Arrange
      const mockError = new Error('DB failed');
      // Scraper returns products
      mockedGetMercadonaProducts.mockResolvedValue(mockScrapedProducts);
      // But database fails
      mockedProduct.bulkWrite.mockRejectedValue(mockError);

      // Act and Assert
      await expect(syncProducts()).rejects.toThrow(ErrorMessages.failedToSyncProducts());
    });
  });

  describe('getProductById', () => {
    
    it('should return a product if found', async () => {
      // Arrange
      const mockProductId = '12345';
      const mockSingleProduct = { _id: mockProductId, name: 'Tomato' };
      
      // Configure the findById mock to return the product
      mockedProduct.findById.mockResolvedValue(mockSingleProduct);

      // Act
      const result = await getProductById(mockProductId);

      // Assert
      expect(result).toEqual(mockSingleProduct); 
      
      // Verify the database was called with the correct ID
      expect(mockedProduct.findById).toHaveBeenCalledWith(mockProductId);
      expect(mockedProduct.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null if product is not found', async () => {
      // Arrange
      const mockProductId = 'abcde';
      
      // Configure the findById mock to return null
      mockedProduct.findById.mockResolvedValue(null);

      // Act
      const result = await getProductById(mockProductId);

      // Assert
      expect(result).toBeNull(); 
      expect(mockedProduct.findById).toHaveBeenCalledWith(mockProductId);
    });

    it('should throw an error if the database fails', async () => {
      // Arrange
      const mockError = new Error('Invalid ID format');
      mockedProduct.findById.mockRejectedValue(mockError);

      // Act and Assert
      await expect(getProductById('bad-id')).rejects.toThrow(
        ErrorMessages.failedToGetProductById()
      );
    });
  });

});
