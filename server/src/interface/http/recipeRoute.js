import express from 'express';

export function buildRecipeRouter(recipeController) {
    if (!recipeController) {
        throw new Error('RecipeController is required to build the recipe router');
    }
    
    const router = express.Router();
    router.post('/recipe', recipeController.generateRecipe);
    return router;
}