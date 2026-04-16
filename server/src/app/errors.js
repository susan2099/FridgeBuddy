import { AppError } from "../domain/errors.js";

export class ValidationError extends AppError {
    constructor({message, details} = {}) {
        super(message, { code: 'VALIDATION_ERROR', status: 400, details });
    }
}