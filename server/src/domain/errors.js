export class AppError extends Error {
    constructor(message, { code = "APP_ERROR", details = null, status = 500 } = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.status = status;
    }
}

export class AllergenViolationError extends AppError {
    constructor({ message = 'The generated recipe contains ingredients that violate the specified allergen restrictions.', details = null } = {}) {
        super(message, { code: 'ALLERGEN_VIOLATION', details, status: 400 });
    }
}

export class InsufficientIngredientsError extends AppError {
    constructor({ message = 'Not enough ingredients available to generate the requested recipe.\n' +
            'The generated recipe as a reference includes ingredients that are not available in the fridge.', details = null } = {}) {
        super(message, { code: 'INSUFFICIENT_INGREDIENTS', details, status: 400 });
    }
}

export class ProductNotFoundError extends AppError {
    constructor({ message = 'The specified product was not found in the database.', details = null } = {}) {
        super(message, { code: 'PRODUCT_NOT_FOUND', details, status: 404 });
    }
}

export class OCRProcessingError extends AppError {
    constructor({ message = 'An error occurred while processing the receipt image with OCR.', details = null } = {}) {
        super(message, { code: 'OCR_PROCESSING_ERROR', details, status: 500 });
    }
}