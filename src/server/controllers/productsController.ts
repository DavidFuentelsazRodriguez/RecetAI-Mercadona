import { Request, Response } from 'express';
import * as productsService from '../services/productsService';
import { scrapingQueue } from '../config/queues';
import logger from '../config/logger';

/**
 * Gets all products from the database
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await productsService.getProducts(
      Number(page),
      Number(limit)
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching products:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Gets a single product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await productsService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Fetches products from Mercadona API and stores them in the database
 */
export const syncProducts = async (req: Request, res: Response) => {
  try {
    await scrapingQueue.add('sync-products-job', {}, {
      jobId: 'singleton-sync',
      removeOnComplete: true,
      removeOnFail: true,
    });

    logger.info('Products sync started');

    res.status(202).json({
      success: true,
      message: 'Products sync started in background',
    });
  } catch (error) {
    logger.error('Error queueing products sync:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Cleans all existing Mercadona products from database
 */
export const cleanMercadonaProducts = async (req: Request, res: Response) => {
  try {
    const result = await productsService.cleanMercadonaProducts();
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error cleaning products:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to clean products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
