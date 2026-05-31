import { ValidationError } from '../../errors.js';

export class SaveUserPreferenceListUseCase {
    constructor({ userPreferenceRepository }) {
        if (!userPreferenceRepository) {
            throw new Error('SaveUserPreferenceListUseCase requires a UserPreferenceRepository');
        }
        this.userPreferenceRepository = userPreferenceRepository;
    }

    async execute({ userId, items } = {}, type) {
        const normalizedType = this.normalizeType(type);
        const normalizedUserId = this.normalizeUserId(userId);
        const normalizedItems = this.normalizeItems(items, normalizedType);

        return await this.userPreferenceRepository.saveList({
            userId: normalizedUserId,
            type: normalizedType,
            items: normalizedItems,
        });
    }

    normalizeType(type) {
        if (type !== 'preference' && type !== 'allergen') {
            throw new ValidationError({
                message: 'Preference type must be preference or allergen',
                details: { field: 'type' },
            });
        }
        return type;
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

    normalizeItems(items, type) {
        if (!Array.isArray(items)) {
            throw new ValidationError({
                message: `${type} list must be an array of strings`,
                details: { field: 'items' },
            });
        }

        return items.map((item, index) => {
            if (typeof item !== 'string') {
                throw new ValidationError({
                    message: `${type} list must contain only strings`,
                    details: { field: `items[${index}]` },
                });
            }

            const normalizedItem = item.trim();
            if (!normalizedItem) {
                throw new ValidationError({
                    message: `${type} list cannot contain empty strings`,
                    details: { field: `items[${index}]` },
                });
            }

            return normalizedItem;
        });
    }
}
