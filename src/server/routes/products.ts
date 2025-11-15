import { Router } from 'express';
import { scraperLimiter } from '../config/rateLimiters';
import * as productsController from '../controllers/productsController';

const router = Router();

router.delete('/products/clean', scraperLimiter, productsController.cleanMercadonaProducts);
router.post('/products/sync', scraperLimiter, productsController.syncProducts);
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);

export default router;
