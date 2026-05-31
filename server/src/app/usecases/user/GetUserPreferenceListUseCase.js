import { ValidationError } from '../../errors.js';

export class GetUserPreferenceListUseCase {
    constructor({ userPreferenceRepository }) {
        if (!userPreferenceRepository) {
            throw new Error('GetUserPreferenceListUseCase requires a UserPreferenceRepository');
        }
        this.userPreferenceRepository = userPreferenceRepository;
    }

    async execute({ userId } = {}) {
        const normalizedUserId = this.normalizeUserId(userId);
        return await this.userPreferenceRepository.getAllByUserId(normalizedUserId);
    }

    normalizeUserId(userId) {
        const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
        if (!normalizedUserId) {
            throw new ValidationError({
                message: 'User ID must be a non-empty string',
                details: { field: 'userId' },
            });
        }
        return normalizedUserId;
    }
}
