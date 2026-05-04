import { success } from '../responseFormatter.js';
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
            const result = await this.recipeUseCase.generate(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}