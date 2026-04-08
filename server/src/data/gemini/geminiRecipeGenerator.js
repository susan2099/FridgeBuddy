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
        const prompt = buildRecipePrompt({ dish, servings, avoidAllergens });
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
                if (name === "get_fridge_items") {
                    const toolResult = {
                        items: ingredients,
                        note: "Each item includes allergens list. You MUST check allergens before using."
                    };
                    contents.push({
                        role: "model",
                        parts: [functionCallPart],
                    });
                    contents.push({
                        role: "user",
                        parts: [
                            {
                                functionResponse: {
                                    name: "get_fridge_items",
                                    response: toolResult,
                                },
                            },
                        ],
                    });
                } else if (name === "emit_recipe") {
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

function buildRecipePrompt({ dish, servings, avoidAllergens = [], preferences = [] }) {
    const systemInstruction = `
You are a strict recipe generation engine.

================ HARD CONSTRAINTS (MUST FOLLOW) ================
The user has food allergies. You MUST NEVER include any ingredient
that contains the following allergens:

${avoidAllergens.length ? avoidAllergens.join(", ") : "NONE"}

This is a SAFETY CRITICAL requirement.
If an ingredient contains or may contain these allergens,
you MUST replace it with a safe alternative.

Even if an ingredient is NOT explicitly labeled as containing an allergen in the provided data,
if it is commonly known or strongly implied to contain (or frequently contain) any forbidden allergen,
you MUST assume it does and avoid it.

You are NOT allowed to:
- Suggest the ingredient anyway
- Mention it as optional
- Use it in garnish/sauce
- Use derived products

You MUST:
- Substitute with safe alternatives
- Ensure the final recipe is completely allergen-free

Feasibility & success flag:
- Prefer using fridge items.
- If the requested dish cannot be reasonably made using available items and safe substitutes,
you MAY introduce additional ingredients that are not listed in the provided data,
as long as they do NOT violate the user's allergies and fit the user's needs.
- In that case, you MUST set is_success = false in the emitted recipe object.

===============================================================

Preferences:
- The user may provide cooking or dietary preferences.
- You SHOULD follow these preferences as much as reasonably possible.
- However, preferences are LOWER priority than allergy safety and ingredient feasibility.
- If a preference conflicts with allergy safety, the requested dish, or feasible cooking logic,
you MUST prioritize safety and reasonable recipe generation.

General behavior:
- Prefer using fridge items.
- You may add common pantry items if needed.
- Output ONLY via the tool "emit_recipe".
`;

  const userPrompt = `
Requested dish: "${dish}"
Servings: ${servings}

User Allergies (STRICTLY FORBIDDEN):
${avoidAllergens.length ? avoidAllergens.join(", ") : "None"}

User Preferences:
${preferences.length ? preferences.join(", ") : "None"}

You must generate a safe recipe.
Do not include any forbidden allergen.
If an ingredient is commonly known to contain a forbidden allergen, avoid it even if not labeled.

Follow the user's preferences as much as reasonably possible,
but never violate allergy safety or basic recipe feasibility.

You may call get_fridge_items to inspect available ingredients.

If you cannot reasonably make the requested dish with available items and safe substitutes,
you may add extra safe ingredients not listed in the data, but set is_success=false.
`;
    return { systemInstruction, userPrompt };
}