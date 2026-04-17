import { ValidationError } from '../../errors/ValidationError.js';

export class GetFridgeItemUseCase {
    constructor({ fridgeRepository }) {
        this.fridgeRepository = fridgeRepository;
    }

    async execute({userId}) {
        if (!userId) {
            throw new ValidationError({ message: 'User ID is required', details: { field: 'userId' } });
        }
        return await this.fridgeRepository.getAllByUserId(userId);
    }
}