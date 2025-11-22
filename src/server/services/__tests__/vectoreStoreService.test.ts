/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../../config/gemini';
import logger from '../../config/logger';


const mockQdrantInstance = {
  getCollections: jest.fn(),
  createCollection: jest.fn(),
  upsert: jest.fn(),
  search: jest.fn(),
};

jest.mock('@qdrant/js-client-rest', () => {
  return {
    QdrantClient: jest.fn(() => mockQdrantInstance)
  };
});

jest.mock('../../config/gemini', () => ({
  gemini: {
    genAI: {
      getGenerativeModel: jest.fn(),
    },
  },
}));
jest.mock('../../config/logger');

// Import the service after mocking QdrantClient
import { initVectorStore, indexProducts, searchProductsByTheme } from '../vectorStoreService';

describe('VectorStoreService', () => {
  let mockEmbedContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configure default responses to avoid errors in tests that do not configure them explicitly
    mockQdrantInstance.getCollections.mockResolvedValue({ collections: [] });
    mockQdrantInstance.createCollection.mockResolvedValue({});
    mockQdrantInstance.upsert.mockResolvedValue({});
    mockQdrantInstance.search.mockResolvedValue([]);

    // Set up a mock of Gemini to return a fake embedding by default
    mockEmbedContent = jest.fn();
    (gemini.genAI.getGenerativeModel as jest.Mock).mockReturnValue({
      embedContent: mockEmbedContent,
    });
    // Set up a default value for embeddings
    mockEmbedContent.mockResolvedValue({ embedding: { values: [0.1, 0.2, 0.3] } });
  });

  describe('initVectorStore', () => {
    it('should create the collection if it does not exist', async () => {
      // Arrange: Simulate getCollections returning an empty list
      mockQdrantInstance.getCollections.mockResolvedValue({ collections: [] });

      // Act
      await initVectorStore();

      // Assert
      expect(mockQdrantInstance.getCollections).toHaveBeenCalled();
      expect(mockQdrantInstance.createCollection).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          vectors: expect.anything(),
        })
      );
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('created'));
    });

    it('should NOT create the collection if it already exists', async () => {
      // Arrange: Simulate that the 'products' collection already exists
      mockQdrantInstance.getCollections.mockResolvedValue({
        collections: [{ name: 'products' }],
      });

      // Act
      await initVectorStore();

      // Assert
      expect(mockQdrantInstance.createCollection).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockQdrantInstance.getCollections.mockRejectedValue(error);

      // Act
      await initVectorStore();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(error, expect.stringContaining('Error'));
    });
  });

  describe('indexProducts', () => {
    const mockProducts = [
      { _id: '507f1f77bcf86cd799439011', name: 'Product A', brand: 'Brand A' },
      { _id: '507f1f77bcf86cd799439012', name: 'Product B', brand: 'Brand B' },
    ];

    it('should do nothing if products array is empty', async () => {
      await indexProducts([]);
      expect(mockEmbedContent).not.toHaveBeenCalled();
      expect(mockQdrantInstance.upsert).not.toHaveBeenCalled();
    });

    it('should generate embeddings and upsert points for valid products', async () => {
      // Act
      await indexProducts(mockProducts as any);

      // Assert
      // 1. Verify Gemini
      expect(mockEmbedContent).toHaveBeenCalledTimes(2);

      // 2. Verify Qdrant Upsert
      expect(mockQdrantInstance.upsert).toHaveBeenCalledTimes(1);
      expect(mockQdrantInstance.upsert).toHaveBeenCalledWith('products', {
        points: expect.arrayContaining([
          expect.objectContaining({
            payload: expect.objectContaining({ name: 'Product A' }),
            vector: [0.1, 0.2, 0.3],
          }),
        ]),
      });
    });

    it('should handle errors during embedding generation and skip that product', async () => {
      // Arrange: Make the first call fail
      mockEmbedContent
        .mockRejectedValueOnce(new Error('API Error')) // Fail prod A
        .mockResolvedValueOnce({ embedding: { values: [0.9, 0.9] } }); // Success prod B

      // Act
      await indexProducts(mockProducts as any);

      // Assert
      expect(logger.warn).toHaveBeenCalled(); // Should log a warning

      // Should call upsert ONLY with product B (1 point)
      expect(mockQdrantInstance.upsert).toHaveBeenCalledTimes(1);
      const upsertCallArg = mockQdrantInstance.upsert.mock.calls[0][1];
      expect(upsertCallArg.points).toHaveLength(1);
      expect(upsertCallArg.points[0].payload.name).toBe('Product B');
      expect(upsertCallArg.points[0].vector).toEqual([0.9, 0.9]);
    });
  });

  describe('searchProductsByTheme', () => {
    const mockSearchResult = [
      {
        id: 'uuid-1',
        score: 0.95,
        payload: { mongoId: 'mongo-1', name: 'Prod 1', brand: 'Brand 1' },
      },
    ];

    beforeEach(() => {
      // Configure what Qdrant returns when searching
      mockQdrantInstance.search.mockResolvedValue(mockSearchResult);
    });

    it('should generate embedding for the theme and search in Qdrant', async () => {
      await searchProductsByTheme('healthy food', 5);

      expect(mockEmbedContent).toHaveBeenCalledWith('healthy food');
      expect(mockQdrantInstance.search).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          limit: 5
        })
      );
    });

    it('should map the Qdrant results to ProductScore interface', async () => {
      const results = await searchProductsByTheme('query', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'mongo-1',
        name: 'Prod 1',
        brand: 'Brand 1',
        score: 0.95,
      });
    });
  });
});
