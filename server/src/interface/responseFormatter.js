export function success(data) {
    return { success: true, data };
}

export function failure(error) {
    return { 
        success: false,
        error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unknown error occurred',
            details: error.details || null,
        },
    };
}