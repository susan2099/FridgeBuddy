import { InsufficientIngredientsError } from "../../domain/errors.js";

export class RecipeController {
    constructor( {recipeUseCase} ) {
        if (!recipeUseCase) {
            throw new Error('RecipeController requires a RecipeUsecase');
        }
        this.recipeUseCase = recipeUseCase;
        this.generateRecipe = this.generateRecipe.bind(this);
    }

    async generateRecipe(req, res, next) {
        try {
            const { dish, servings, avoidAllergens } = req.body ?? {};
            const result = await this.recipeUseCase.generate( {dish, servings, avoidAllergens} );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}