import { Router } from 'express';
import * as productsController from '../controllers/productsController';

const router = Router();

// Clean existing Mercadona products
router.delete('/products/clean', productsController.cleanMercadonaProducts);

// Sync products from Mercadona API
router.post('/products/sync', productsController.syncProducts);

// Get all products with optional filtering and pagination
router.get('/products', productsController.getProducts);

// Get a single product by ID
router.get('/products/:id', productsController.getProductById);

export default router;
