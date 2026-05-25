import express from 'express';

export function buildUserRouter(userController) {
    if (!userController) {
        throw new Error('UserController is required to build the user router');
    }

    const router = express.Router();
    router.post('/preference', userController.savePreference);
    router.post('/allergen', userController.saveAllergen);
    return router;
}
