import { InsufficientIngredientsError } from "../../../domain/errors.js";

export class RecipeUseCase {
    #recipeGenerator;

    constructor({ recipeGenerator }) {
        if (!recipeGenerator) {
            throw new Error('RecipeUseCase requires a RecipeGenerator');
        }
        this.#recipeGenerator = recipeGenerator;
    }

    async generate({ dish, servings = 1, ingredients = [], avoidAllergens = [], preferences = [] }) {
        if (!dish || !dish.trim()) {
            throw new Error('Dish name is required');
        }
        if (!Number.isFinite(servings) || servings <= 0) {
            throw new Error('Servings must be a positive number');
        }
        if (!Array.isArray(avoidAllergens)) {
            throw new Error('Avoid allergens must be an array');
        }

        const recipe = await this.#recipeGenerator.generate({
            dish,
            servings,
            ingredients,
            avoidAllergens,
            preferences
        });


        if (!recipe.is_success) {
            throw new InsufficientIngredientsError({ details: recipe });
        }

        return recipe;

    }

}