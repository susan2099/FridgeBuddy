import { RecipeSchema } from "../../domain/schemas.js";
import z from "zod";

export const emitRecipeDeclaration = {
    name: "emit_recipe",
    description:
        "Return the final recipe in the required JSON structure. Must satisfy schema exactly.",
    parameters: z.toJSONSchema(RecipeSchema),
};

export const getFridgeDeclaration = {
    name: "get_fridge_items",
    description:
        "Get all items currently in the fridge. Each item has name and allergens list.",
    parameters: {
        type: "object",
        properties: {},
        required: [],
    },
}

export const recipeTools = [
    {
        functionDeclarations: [
            getFridgeDeclaration,
            emitRecipeDeclaration
        ],
    },
];