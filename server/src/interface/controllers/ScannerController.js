import { success } from '../responseFormatter.js';
export class ScannerController {
    constructor( {barcodeScannerUseCase} ) {
        if (!barcodeScannerUseCase) {
            throw new Error('ScannerController requires a BarcodeScannerUseCase');
        }
        this.barcodeScannerUseCase = barcodeScannerUseCase;
        this.scanBarcode = this.scanBarcode.bind(this);
    }

    async scanBarcode(req, res, next) {
        try {
            const result = await this.barcodeScannerUseCase.execute({ barcode: req.params.barcode });
            res.status(200).json(success(result));
        } catch (error) {
            next(error);
        }
    }
}