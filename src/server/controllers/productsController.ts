import { Request, Response } from 'express';
import { getTransformedProducts } from '../services/mercadonaService';
import { Product } from '../models/Product';
import { ProductData } from '../models/Product';

/**
 * Cleans all existing Mercadona products from database
 */
export const cleanMercadonaProducts = async (req: Request, res: Response) => {
  try {
    const result = await Product.deleteMany({ isMercadona: true });
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} existing Mercadona products`
    });
  } catch (error) {
    console.error('Error cleaning products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Fetches products from Mercadona API and stores them in the database
 */
export const syncProducts = async (req: Request, res: Response) => {
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
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    console.log('Product sync completed successfully');
    res.status(200).json({
      success: true,
      message: `Successfully synced ${products.length} products`
    });

  } catch (error) {
    console.error('Error syncing products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Gets all products from the database
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (category) {
      query.category = { $regex: category as string, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { brand: { $regex: search as string, $options: 'i' } },
        { category: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Gets a single product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
