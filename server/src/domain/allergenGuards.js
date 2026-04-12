import { AllergenViolationError } from "./errors.js";

export function containsAllergens({ ingredient, avoidAllergens }) {
    if (avoidAllergens.some(allergen => ingredient.allergens.includes(allergen))) {
        return true;
    }
    return false;
}

export function assertNoAllergenViolations({ ingredients, avoidAllergens }) {
    for (const ingredient of ingredients) {
        if (containsAllergens({ ingredient, avoidAllergens })) {
            throw new AllergenViolationError('Violation of allergen restrictions detected in generated recipe.', { details: { ingredient, avoidAllergens } });
        }
    }
}

export function filterAllergenViolations({ fridgeItems, avoidAllergens }) {
    return fridgeItems.filter(ingredient => !containsAllergens({ ingredient, avoidAllergens }));
}