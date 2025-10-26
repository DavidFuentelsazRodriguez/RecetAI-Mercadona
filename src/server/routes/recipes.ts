import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';

const router = Router();

router.post('/recipes/generate', recipeController.generateRecipe);
router.get('/recipes/default-params', recipeController.getDefaultRecipeParams);

export default router;
