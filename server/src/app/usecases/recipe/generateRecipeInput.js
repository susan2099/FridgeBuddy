import { z } from 'zod';

export const GenerateRecipeInputSchema = z.object({
    dish: z.string().trim().min(1),
    servings: z.number().int().positive().default(1),
    ingredients: z.array(z.string().trim().min(1)).default([]),
    avoidAllergens: z.array(z.string().trim().min(1)).default([]),
    preferences: z.array(z.string().trim().min(1)).default([]),
});

export function parseGenerateRecipeInput(input) {
    return GenerateRecipeInputSchema.parse(input);
}