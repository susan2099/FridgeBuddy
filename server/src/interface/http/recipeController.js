import { parseGenerateRecipeInput } from '../../app/usecases/generateRecipeInput.js';

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
            const input = parseGenerateRecipeInput(req.body ?? {});
            const result = await this.recipeUseCase.generate(input);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}