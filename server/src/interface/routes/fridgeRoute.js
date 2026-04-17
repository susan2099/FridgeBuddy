import express from 'express';

export function buildFridgeRouter(fridgeController) {
    if (!fridgeController) {
        throw new Error('FridgeController is required to build the fridge router');
    }
    
    const router = express.Router();
    router.post('/add', fridgeController.addFridgeItem);
    router.post('/get', fridgeController.getFridgeItem);
    return router;
}