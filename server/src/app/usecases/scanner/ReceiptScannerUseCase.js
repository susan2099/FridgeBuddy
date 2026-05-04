import { ValidationError } from '../../errors.js';

export class ReceiptScannerUseCase {
    constructor({ receiptRepository, itemNameNormalizer }) {
        this.receiptRepository = receiptRepository;
        this.itemNameNormalizer = itemNameNormalizer;
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

        if (!this.itemNameNormalizer) {
            return scanResult;
        }

        const normalized = await Promise.all(
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

        return {
            ...scanResult,
            items: normalized
        };
    }
}
