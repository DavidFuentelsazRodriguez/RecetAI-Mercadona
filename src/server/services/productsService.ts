import { Product, ProductData } from '../models/Product';
import { getMercadonaProductsFromFatSecret } from './fatsecretScraperService';
import logger from '../config/logger';
import { ErrorMessages } from '../utils/validation';
import { initVectorStore, indexProducts } from './vectorStoreService';

/**
 * Cleans all existing Mercadona products from database
 * @returns Object with deletion result
 */
export const cleanMercadonaProducts = async () => {
  try {
    const result = await Product.deleteMany({ isMercadona: true });
    return {
      success: true,
      message: `Deleted ${result.deletedCount} existing Mercadona products`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error('Error cleaning products:', error);
    throw new Error(ErrorMessages.failedToCleanProducts());
  }
};

/**
 * Fetches products from FatSecret Spain and stores them in the database
 * @returns Object with sync result
 */
export const syncProducts = async () => {
  try {
    
    await initVectorStore();

    const products: ProductData[] = await getMercadonaProductsFromFatSecret();

    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { name: product.name },
        update: {
          $set: product,
        },
        upsert: true,
      },
    }));

    let result;
    if (bulkOps.length > 0) {
      result = await Product.bulkWrite(bulkOps);

      const productNames = products.map(p => p.name);
      const productsWithIds = await Product.find({ name: { $in: productNames } }).lean();
      
      await indexProducts(productsWithIds);
    }

    return {
      success: true,
      message: `Successfully synced and indexed ${products.length} products`,
      syncedCount: products.length,
      stats: result,
    };
  } catch (error) {
    logger.error('Error syncing products:', error);
    throw new Error(ErrorMessages.failedToSyncProducts());
  }
};

/**
 * Gets all products with optional filtering and pagination
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 20, max: 100)
 * @returns Object with products and pagination info
 */
export const getProducts = async (page = 1, limit = 20) => {
  try {
    const query: Record<string, unknown> = {};

    const pageNum = parseInt(page.toString(), 10);
    const limitNum = Math.min(parseInt(limit.toString(), 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    return {
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    };
  } catch (error) {
    logger.error('Error fetching products:', error);
    throw new Error(ErrorMessages.failedToGetProducts());
  }
};

/**
 * Gets a single product by ID
 * @param id Product ID
 * @returns The product if found, null otherwise
 */
export const getProductById = async (id: string) => {
  try {
    const product = await Product.findById(id);
    return product;
  } catch (error) {
    logger.error('Error fetching product:', error);
    throw new Error(ErrorMessages.failedToGetProductById());
  }
};
