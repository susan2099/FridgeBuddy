import { ValidationError } from '../../errors.js';

export class ReceiptScannerUseCase {
    constructor({ receiptRepository }) {
        this.receiptRepository = receiptRepository;
    }

    async execute( { img }) {
        if (!img) {
            throw new ValidationError({ message: 'Image is required', details: { field: 'img' } });
        }
        if (!img.buffer || !img.mimetype) {
            throw new ValidationError({ message: 'Invalid image file', details: { field: 'img' } });
        }
        return await this.receiptRepository.scan({ imageBuffer: img.buffer, mimeType: img.mimetype });
    }
}