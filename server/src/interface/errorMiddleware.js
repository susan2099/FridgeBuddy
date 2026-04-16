import { ZodError} from 'zod';
import { AppError } from '../domain/errors.js';
import { failure } from './responseFormatter.js';

function sendError(res, status = 500, code, message, details) {
    return res.status(status).json(failure({ code, message, details }));
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
    if (err instanceof ZodError) {
        return sendError(res, 400, 'ZOD_VALIDATION_ERROR', 'Invalid request data', err.errors);
    }
    if (err instanceof AppError) {
        return sendError(res, err.status, err.code, err.message, err.details);
    }
    if (err instanceof Error) {
        return sendError(res, err.status, 'INTERNAL_SERVER_ERROR', err.message, null);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null);
}