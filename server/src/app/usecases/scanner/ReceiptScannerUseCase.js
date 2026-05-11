import { ValidationError } from '../../errors.js';

export class ReceiptScannerUseCase {
    constructor({ receiptRepository, fridgeRepository }) {
        this.receiptRepository = receiptRepository;
        this.fridgeRepository = fridgeRepository;
    }

    async execute( { img, userId }) {
        if (!img) {
            throw new ValidationError({ message: 'Image is required', details: { field: 'img' } });
        }
        if (!img.buffer || !img.mimetype) {
            throw new ValidationError({ message: 'Invalid image file', details: { field: 'img' } });
        }
        const scanResult = await this.receiptRepository.scan({ imageBuffer: img.buffer, mimeType: img.mimetype });
        const items = Array.isArray(scanResult?.items) ? scanResult.items : [];

        // Bulk add for receipt scanning: only when receipt has multiple line items.
        if (items.length > 1) {
            if (!userId) {
                throw new ValidationError({ message: 'User ID is required for receipt bulk add', details: { field: 'userId' } });
            }

            const itemsToSave = items.map((item) => ({
                userId,
                name: item.name,
                quantity: item.quantity ?? null,
                unit: item.unit ?? null,
                expiry: item.expiry ?? null,
                allergens: item.allergens ?? [],
                createdAt: new Date()
            }));

            const savedItems = await this.fridgeRepository.addMany(itemsToSave);
            return {
                ...scanResult,
                savedItems
            };
        }

        return scanResult;
    }
}
