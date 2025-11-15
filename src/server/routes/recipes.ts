import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';
import { apiLimiter } from '../config/rateLimiters';

const router = Router();

router.post('/recipes/generate', apiLimiter, recipeController.generateRecipe);

export default router;
