import { Product } from '../models/Product';
import { getTransformedProducts } from './mercadonaService';
import { ProductData } from '../models/Product';

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
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Error cleaning products:', error);
    throw new Error('Failed to clean products');
  }
};

/**
 * Fetches products from Mercadona API and stores them in the database
 * @returns Object with sync result
 */
export const syncProducts = async () => {
  try {
    console.log('Starting product sync from Mercadona...');
    const products: ProductData[] = await getTransformedProducts();
    console.log(`Fetched ${products.length} products from Mercadona. Updating database...`);

    // Prepare bulk operations for efficient update/insert
    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { name: product.name, brand: product.brand },
        update: {
          $set: product
        },
        upsert: true
      }
    }));

    // Execute bulk operations
    let result;
    if (bulkOps.length > 0) {
      result = await Product.bulkWrite(bulkOps);
    }

    console.log('Product sync completed successfully');
    return {
      success: true,
      message: `Successfully synced ${products.length} products`,
      stats: result
    };
  } catch (error) {
    console.error('Error syncing products:', error);
    throw new Error('Failed to sync products');
  }
};

/**
 * Gets all products with optional filtering and pagination
 * @param category Filter by category (optional)
 * @param search Search term (optional)
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 20, max: 100)
 * @returns Object with products and pagination info
 */
export const getProducts = async (category?: string, search?: string, page = 1, limit = 20) => {
  try {
    const query: any = {};

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page.toString(), 10);
    const limitNum = Math.min(parseInt(limit.toString(), 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    return {
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
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
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
};
