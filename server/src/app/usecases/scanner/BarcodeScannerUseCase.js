import { ValidationError } from '../../errors.js';
import { buildEstimatedExpiryDate } from './estimatedExpiryDate.js';

export class BarcodeScannerUseCase {
    constructor({ barcodeRepository, itemNameNormalizer }) {
        this.barcodeRepository = barcodeRepository;
        this.itemNameNormalizer = itemNameNormalizer;
    }

    async execute( { barcode }) {
        if (!barcode) {
            throw new ValidationError({ message: 'Barcode is required', details: { field: 'barcode' } });
        }

        const item = await this.barcodeRepository.lookup(barcode);
        if (!this.itemNameNormalizer) {
            return item;
        }

        const normalizedItems = await this.itemNameNormalizer.normalize({ rawNames: [item.name] });
        const normalizedItem = normalizedItems[0];
        if (!normalizedItem?.normalized_name) {
            return item;
        }

        return {
            ...item,
            name: normalizedItem.normalized_name,
            expiry: buildEstimatedExpiryDate({
                fromDate: new Date(),
                shelfLifeDays: normalizedItem.estimated_shelf_life_days
            }),
            raw_name: normalizedItem.raw_name,
            confidence: normalizedItem.confidence,
            estimated_shelf_life_days: normalizedItem.estimated_shelf_life_days
        };
    }
}
