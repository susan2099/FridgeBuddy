import { success } from '../../interface/responseFormatter.js';

export class FridgeController {
    constructor( {addFridgeItemUseCase, getFridgeItemUseCase, updateFridgeItemUseCase, deleteFridgeItemUseCase} ) {
        if (!addFridgeItemUseCase) {
            throw new Error('FridgeController requires an AddFridgeItemUseCase');
        }
        if (!getFridgeItemUseCase) {
            throw new Error('FridgeController requires a GetFridgeItemUseCase');
        }
        if (!updateFridgeItemUseCase) {
            throw new Error('FridgeController requires an UpdateFridgeItemUseCase');
        }
        if (!deleteFridgeItemUseCase) {
            throw new Error('FridgeController requires a DeleteFridgeItemUseCase');
        }
        this.addFridgeItemUseCase = addFridgeItemUseCase;
        this.getFridgeItemUseCase = getFridgeItemUseCase;
        this.updateFridgeItemUseCase = updateFridgeItemUseCase;
        this.deleteFridgeItemUseCase = deleteFridgeItemUseCase;
        this.addFridgeItem = this.addFridgeItem.bind(this);
        this.getFridgeItem = this.getFridgeItem.bind(this);
        this.updateFridgeItem = this.updateFridgeItem.bind(this);
        this.deleteFridgeItem = this.deleteFridgeItem.bind(this);
    }

    async addFridgeItem(req, res, next) {
        try {
            const result = await this.addFridgeItemUseCase.execute(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }

    async getFridgeItem(req, res, next) {
        try {
            const result = await this.getFridgeItemUseCase.execute(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }

    async updateFridgeItem(req, res, next) {
        try {
            const result = await this.updateFridgeItemUseCase.execute(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }

    async deleteFridgeItem(req, res, next) {
        try {
            const result = await this.deleteFridgeItemUseCase.execute(req.body);
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}
