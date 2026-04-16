export class FridgeController {
    constructor( {addFridgeItemUseCase} ) {
        if (!addFridgeItemUseCase) {
            throw new Error('FridgeController requires an AddFridgeItemUseCase');
        }
        this.addFridgeItemUseCase = addFridgeItemUseCase;
        this.addFridgeItem = this.addFridgeItem.bind(this);
    }

    async addFridgeItem(req, res, next) {
        try {
            const result = await this.addFridgeItemUseCase.execute(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}