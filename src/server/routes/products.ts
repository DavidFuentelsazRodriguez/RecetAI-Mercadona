import { Router } from 'express';
import * as productsController from '../controllers/productsController';

const router = Router();

router.delete('/products/clean', productsController.cleanMercadonaProducts);
router.post('/products/sync', productsController.syncProducts);
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);

export default router;
