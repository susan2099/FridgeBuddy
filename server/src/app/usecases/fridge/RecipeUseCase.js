import { InsufficientIngredientsError } from "../../../domain/errors.js";
import { ValidationError } from "../../errors.js";

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
            throw new ValidationError({ message: 'Dish name is required', details: { field: 'dish' } });
        }
        if (!Number.isFinite(servings) || servings <= 0) {
            throw new ValidationError({ message: 'Servings must be a positive number', details: { field: 'servings' } });
        }
        if (!Array.isArray(avoidAllergens)) {
            throw new ValidationError({ message: 'Avoid allergens must be an array', details: { field: 'avoidAllergens' } });
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