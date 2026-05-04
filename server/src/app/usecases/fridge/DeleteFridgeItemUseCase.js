import { ValidationError } from "../../errors.js";

export class DeleteFridgeItemUseCase {
    constructor({ fridgeRepository }) {
        this.fridgeRepository = fridgeRepository;
    }

    async execute({ userId, itemId }) {
        if (!userId) {
            throw new ValidationError({ message: 'User ID is required', details: { field: 'userId' } });
        }
        if (!itemId) {
            throw new ValidationError({ message: 'Item ID is required', details: { field: 'itemId' } });
        }

        return await this.fridgeRepository.deleteById({ userId, itemId });
    }
}
