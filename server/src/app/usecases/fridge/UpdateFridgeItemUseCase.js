import { normalizeDate } from "../../utils.js";
import { ValidationError } from "../../errors.js";

export class UpdateFridgeItemUseCase {
    constructor({ fridgeRepository }) {
        this.fridgeRepository = fridgeRepository;
    }

    async execute({ userId, itemId, name, quantity, unit, expiry, allergens }) {
        if (!userId) {
            throw new ValidationError({ message: 'User ID is required', details: { field: 'userId' } });
        }
        if (!itemId) {
            throw new ValidationError({ message: 'Item ID is required', details: { field: 'itemId' } });
        }

        const hasFieldToUpdate =
            name !== undefined ||
            quantity !== undefined ||
            unit !== undefined ||
            expiry !== undefined ||
            allergens !== undefined;

        if (!hasFieldToUpdate) {
            throw new ValidationError({ message: 'At least one field must be provided to update', details: { field: 'payload' } });
        }

        if (name !== undefined && typeof name !== 'string') {
            throw new ValidationError({ message: 'Name must be a string', details: { field: 'name' } });
        }
        if (name !== undefined && !name.trim()) {
            throw new ValidationError({ message: 'Name cannot be empty', details: { field: 'name' } });
        }
        if (quantity !== undefined && quantity !== null && (typeof quantity !== 'number' || quantity <= 0)) {
            throw new ValidationError({ message: 'Quantity must be null or a positive number', details: { field: 'quantity' } });
        }
        if (unit !== undefined && unit !== null && typeof unit !== 'string') {
            throw new ValidationError({ message: 'Unit must be null or a string', details: { field: 'unit' } });
        }
        if (expiry !== undefined && expiry !== null && isNaN(Date.parse(expiry))) {
            throw new ValidationError({ message: 'Expiry must be null or a valid date string', details: { field: 'expiry' } });
        }
        if (allergens !== undefined && allergens !== null && !Array.isArray(allergens)) {
            throw new ValidationError({ message: 'Allergens must be null or an array', details: { field: 'allergens' } });
        }

        let normalizedExpiry;
        if (expiry !== undefined) {
            try {
                normalizedExpiry = normalizeDate(expiry);
            } catch (err) {
                throw new ValidationError({ message: err.message, details: { field: 'expiry' } });
            }
        }

        const updatePayload = {};
        if (name !== undefined) updatePayload.name = name.trim();
        if (quantity !== undefined) updatePayload.quantity = quantity;
        if (unit !== undefined) updatePayload.unit = unit ? unit.trim() : null;
        if (expiry !== undefined) updatePayload.expiry = normalizedExpiry;
        if (allergens !== undefined) {
            updatePayload.allergens = allergens ? allergens.map(a => a.trim()) : [];
        }

        return await this.fridgeRepository.updateById({ userId, itemId, updates: updatePayload });
    }
}
