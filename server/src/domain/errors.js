export class AllergenViolationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AllergenViolationError';
        this.code = 'ALLERGEN_VIOLATION';
    }
}

export class InsufficientIngredientsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientIngredientsError';
        this.code = 'INSUFFICIENT_INGREDIENTS';
    }
}