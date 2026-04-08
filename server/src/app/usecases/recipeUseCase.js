import { fi } from "zod/v4/locales";
import { filterAllergenViolations } from "../../domain/allergenGuards.js";
import { InsufficientIngredientsError } from "../../domain/errors.js";

export class RecipeUseCase {
    #fridgeRepository;
    #recipeGenerator;

    constructor({ fridgeRepository, recipeGenerator }) {
        if (!fridgeRepository) {
            throw new Error('RecipeUseCase requires a FridgeRepository');
        }
        if (!recipeGenerator) {
            throw new Error('RecipeUseCase requires a RecipeGenerator');
        }
        this.#fridgeRepository = fridgeRepository;
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

        // const fridgeItems = await this.#fridgeRepository.getFridgeItems();
        // const filteredFridgeItems = filterAllergenViolations({ fridgeItems, avoidAllergens });
        const recipe = await this.#recipeGenerator.generate({
            dish,
            servings,
            ingredients,
            avoidAllergens,
            preferences
        });


        if (!recipe.is_success) {
            throw new InsufficientIngredientsError('Failed to generate a recipe with the given parameters. Try adjusting your inputs.');
        }

        return recipe;

    }

}