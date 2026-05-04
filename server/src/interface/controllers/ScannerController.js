import { success } from '../responseFormatter.js';
export class ScannerController {
    constructor( {barcodeScannerUseCase, receiptScannerUseCase} ) {
        if (!barcodeScannerUseCase) {
            throw new Error('ScannerController requires a BarcodeScannerUseCase');
        }
        if (!receiptScannerUseCase) {
            throw new Error('ScannerController requires a ReceiptScannerUseCase');
        }
        this.barcodeScannerUseCase = barcodeScannerUseCase;
        this.receiptScannerUseCase = receiptScannerUseCase;
        this.scanBarcode = this.scanBarcode.bind(this);
        this.scanReceipt = this.scanReceipt.bind(this);
    }

    async scanBarcode(req, res, next) {
        try {
            const result = await this.barcodeScannerUseCase.execute({ barcode: req.params.barcode });
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
    async scanReceipt(req, res, next) {
        try {
            const result = await this.receiptScannerUseCase.execute({ img: req.file });
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}