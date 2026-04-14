import { RecipeGenerator } from "../../app/ports/RecipeGenerator.js";
import { FridgeRepository } from "../../app/ports/FridgeRepository.js";
import { recipeTools } from "./tools.js";
import { filterAllergenViolations } from "../../domain/allergenGuards.js";
import { RecipeSchema } from "../../domain/schemas.js";

export class GeminiRecipeGenerator extends RecipeGenerator {
    constructor({ ai, model='gemini-2.5-flash', temperature=0.7, maxAttempts=3 }) {
        super();
        if (!ai) {
            throw new Error("AI instance is required");
        }
        this.ai = ai;
        this.model = model;
        this.temperature = temperature;
        this.maxAttempts = maxAttempts;
    }

    async generate({dish, servings, ingredients, avoidAllergens, preferences}) {
        if (!dish || !dish.trim()) {
            throw new Error('Dish name is required');
        }
        if (!Number.isFinite(servings) || servings <= 0) {
            throw new Error('Servings must be a positive number');
        }
        if (!Array.isArray(avoidAllergens)) {
            throw new Error('Avoid allergens must be an array');
        }
        const prompt = buildRecipePrompt({ dish, servings, ingredients, avoidAllergens, preferences });
        let contents =[{ "role": "user", parts: [{ text: prompt.userPrompt }] }];

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                const resp = await this.ai.models.generateContent({
                    model: this.model,
                    contents,
                    config: {
                        systemInstruction: prompt.systemInstruction,
                        tools: recipeTools,
                        temperature: this.temperature,
                    },
                });
                const candidate = resp?.candidates?.[0];
                const parts = candidate?.content?.parts ?? [];

                const functionCallPart = parts.find((p) => p.functionCall);
                if (!functionCallPart) {
                    throw new Error("Model did not produce a function call. Try again or adjust prompt.");
                }

                const { name, args } = functionCallPart.functionCall;
                if (name === "emit_recipe") {
                    const recipe = RecipeSchema.parse(args);
                    return recipe;
                } else {
                    throw new Error(`Unknown function call: ${name}`);
                }
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt === this.maxAttempts) {
                    throw new Error("Failed to generate recipe after multiple attempts. Last error: " + error.message);
                }
            }
        }
    }
}

function buildRecipePrompt({ dish, servings, ingredients = [], avoidAllergens = [], preferences = [] }) {
    const ingredientsList = ingredients.length
        ? ingredients.map(i => `- ${i}`).join("\n")
        : "No available ingredients provided.";
    const systemInstruction = `
You generate recipes and may respond ONLY by calling the tool "emit_recipe".

Priority order:
1. Allergy safety
2. Follow user preferences
3. Use given ingredients
4. Keep the recipe reasonable for the requested dish

Rules:
- Use the given ingredients to generate the recipe.
- Basic pantry items such as salt, sugar, oil, pepper, and water may be used without listing them as extra ingredients.
- Avoid any ingredient that contains or is commonly associated with the user's allergens, even if not explicitly labeled.
- Follow the user's preferences as much as possible.

Success rule:
- If the recipe can be made with the given ingredients plus basic pantry items, set is_success=true.
- If any non-given ingredient beyond basic pantry items is required, you may still generate the recipe, but you MUST:
  - minimize added ingredients
  - set is_success=false
  - write the reason in failure_reason

Forbidden:
- Never use ingredients containing the user's allergens.
- Never set is_success=true when using non-given ingredients beyond basic pantry items.
- Never leave failure_reason empty when is_success=false.
`;

    const userPrompt = `
Requested dish: "${dish}"
Servings: ${servings}

Available ingredients:
${ingredientsList}

User allergens:
${avoidAllergens.length ? avoidAllergens.join(", ") : "None"}

User preferences:
${preferences.length ? preferences.join(", ") : "None"}

Generate one recipe now.
`;
    return { systemInstruction, userPrompt };
}