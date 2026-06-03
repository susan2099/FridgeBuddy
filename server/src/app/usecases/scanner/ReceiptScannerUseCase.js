import { ValidationError } from '../../errors.js';
import { buildEstimatedExpiryDate } from './estimatedExpiryDate.js';

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
            const rawNames = items.map(item => item?.name || "");
            const normalizedNames = await this.itemNameNormalizer.normalize({ rawNames });
            const scanDate = new Date();
            processedItems = items
                .map((item, index) => {
                    const normalizedName = normalizedNames[index];
                    if (!normalizedName?.normalized_name) {
                        return null;
                    }
                    return {
                        ...item,
                        name: normalizedName.normalized_name,
                        quantity: normalizeReceiptQuantity(item.quantity),
                        expiry: buildEstimatedExpiryDate({
                            fromDate: scanDate,
                            shelfLifeDays: normalizedName.estimated_shelf_life_days
                        }),
                        raw_name: normalizedName.raw_name,
                        confidence: normalizedName.confidence,
                        estimated_shelf_life_days: normalizedName.estimated_shelf_life_days
                    };
                })
                .filter(Boolean);
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
