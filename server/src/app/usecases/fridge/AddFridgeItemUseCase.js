import { normalizeDate } from "../../utils.js";
import { ValidationError } from "../../errors.js";
import { FridgeItem } from "../../../domain/entities/FridgeItem.js";

export class AddFridgeItemUseCase {
    constructor({ fridgeRepository }) {
        this.fridgeRepository = fridgeRepository;
    }

    async execute(input) {
        const items = Array.isArray(input?.items) ? input.items : null;

        if (items) {
            if (!items.length) {
                throw new ValidationError({ message: 'Items array cannot be empty', details: { field: 'items' } });
            }
            const fridgeItems = items.map((item) => this.buildItem(item));
            return await this.fridgeRepository.addMany(fridgeItems);
        }

        const item = this.buildItem(input);
        return await this.fridgeRepository.add(item);
    }

    buildItem({userId, name, quantity, unit, expiry, allergens}) {
        if (!userId) {
            throw new ValidationError({ message: 'User ID is required', details: { field: 'userId' } });
        }
        if (!name) {
            throw new ValidationError({ message: 'Item name is required', details: { field: 'name' } });
        }
        if (quantity != null && (typeof quantity !== 'number' || quantity <= 0)) {
            throw new ValidationError({ message: 'Quantity must be null or a positive number', details: { field: 'quantity' } });
        }
        if (unit != null && typeof unit !== 'string') {
            throw new ValidationError({ message: 'Unit must be null or a string', details: { field: 'unit' } });
        }
        if (expiry != null && isNaN(Date.parse(expiry))) {
            throw new ValidationError({ message: 'Expiry must be null or a valid date string', details: { field: 'expiry' } });
        }
        if (allergens != null && !Array.isArray(allergens)) {
            throw new ValidationError({ message: 'Allergens must be an array', details: { field: 'allergens' } });
        }

        let normalizedExpiry;
        try {
            normalizedExpiry = normalizeDate(expiry);
        } catch (err) {
            throw new ValidationError({ message: err.message, details: { field: 'expiry' } });
        }
        
        const item = new FridgeItem({
            userId,
            name: name.trim(),
            quantity,
            unit: unit ? unit.trim() : null,
            expiry: normalizedExpiry,
            allergens: allergens ? allergens.map(a => a.trim()) : [],
            createdAt: new Date()
        });

        return item;
    }
}
