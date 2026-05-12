import { ValidationError } from '../../errors.js';

export class ReceiptScannerUseCase {
    constructor({ receiptRepository, itemNameNormalizer, fridgeRepository }) {
        this.receiptRepository = receiptRepository;
        this.itemNameNormalizer = itemNameNormalizer;
        this.fridgeRepository = fridgeRepository;
    }

    async execute( { img }) {
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
                        quantity: normalizeReceiptQuantity(item.quantity),
                        raw_name: normalizedName.raw_name,
                        auto_applied: normalizedName.auto_applied
                    };
                })
            );
        }

        return {
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
