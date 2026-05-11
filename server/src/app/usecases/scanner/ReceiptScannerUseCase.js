import { ValidationError } from '../../errors.js';

export class ReceiptScannerUseCase {
    constructor({ receiptRepository, itemNameNormalizer, fridgeRepository }) {
        this.receiptRepository = receiptRepository;
        this.itemNameNormalizer = itemNameNormalizer;
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

        let processedItems = items;
        if (this.itemNameNormalizer) {
            processedItems = await Promise.all(
            items.map(async (item) => {
                const rawName = item?.name || "";
                const normalizedName = await this.itemNameNormalizer.normalize({ rawName });
                return {
                    ...item,
                    name: normalizedName.name,
                    raw_name: normalizedName.raw_name,
                    auto_applied: normalizedName.auto_applied
                };
            })
        );
        }

        // Bulk add for receipt scanning: only when receipt has multiple line items.
        if (processedItems.length > 1) {
            if (!userId) {
                throw new ValidationError({ message: 'User ID is required for receipt bulk add', details: { field: 'userId' } });
            }

            const itemsToSave = processedItems.map((item) => ({
                userId,
                name: item.name,
                quantity: normalizeReceiptQuantity(item.quantity),
                unit: item.unit ?? null,
                expiry: item.expiry ?? null,
                allergens: item.allergens ?? [],
                createdAt: new Date()
            }));

            const savedItems = await this.fridgeRepository.addMany(itemsToSave);
            return {
                ...scanResult,
                items: processedItems,
                savedItems
            };
        }

        return {
            ...scanResult,
            items: processedItems
        };
    }
}

function normalizeReceiptQuantity(quantity) {
    if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0) {
        return quantity;
    }
    if (typeof quantity === 'string') {
        const parsed = Number(quantity);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return 1;
}
