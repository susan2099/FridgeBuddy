import { ValidationError } from '../../errors.js';

export class BarcodeScannerUseCase {
    constructor({ barcodeRepository }) {
        this.barcodeRepository = barcodeRepository;
    }

    async execute( { barcode }) {
        if (!barcode) {
            throw new ValidationError({ message: 'Barcode is required', details: { field: 'barcode' } });
        }
        return await this.barcodeRepository.lookup(barcode);
    }
}