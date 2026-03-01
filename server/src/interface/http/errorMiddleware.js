import { ZodError} from 'zod';
import { InsufficientIngredientsError } from '../../domain/errors.js';

function sendError(res, status, code, message, details) {
    const payload = { error: { code, message } };
    if (details) {
        payload.error.details = details;
    }
    return res.status(status).json(payload);
}

export function errorMiddleware(err, req, res, next) {
    if (err instanceof ZodError) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', err.errors);
    }
    if (err instanceof InsufficientIngredientsError) {
        return sendError(res, 400, 'INSUFFICIENT_INGREDIENTS', err.message, null);
    }
    console.error('Unexpected error:', err);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null);
}