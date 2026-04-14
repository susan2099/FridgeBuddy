import z from "zod";

/** ----- Fridge ----- */

export const FridgeItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  expiry: z.iso.date(),
  allergens: z.array(z.string()).default([]),
  addedAt: z.iso.date(),
});

export const FridgeSchema = z.array(FridgeItemSchema).default([]);

/** ----- Recipe ----- **/

export const IngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  allergens: z.array(z.string()).default([]),
});

export const RecipeSchema = z.object({
  name: z.string().min(1),
  servings: z.number().positive(),
  description: z.string().min(1),
  time: z.number().nonnegative(),
  time_unit: z.enum(["min", "hr"]),
  ingredients: z.array(IngredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  is_success: z.boolean(),
  failure_reason: z.string().nullable().default(null),
});