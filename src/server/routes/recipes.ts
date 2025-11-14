import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';

const router = Router();

router.post('/recipes/generate', recipeController.generateRecipe);

export default router;
