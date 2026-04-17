import { success } from '../../interface/responseFormatter.js';

export class FridgeController {
    constructor( {addFridgeItemUseCase, getFridgeItemUseCase} ) {
        if (!addFridgeItemUseCase) {
            throw new Error('FridgeController requires an AddFridgeItemUseCase');
        }
        this.addFridgeItemUseCase = addFridgeItemUseCase;
        this.getFridgeItemUseCase = getFridgeItemUseCase;
        this.addFridgeItem = this.addFridgeItem.bind(this);
        this.getFridgeItem = this.getFridgeItem.bind(this);
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
}