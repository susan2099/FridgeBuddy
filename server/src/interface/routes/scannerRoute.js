import express from 'express';

export function buildScannerRouter(scannerController) {
    if (!scannerController) {
        throw new Error('ScannerController is required to build the scanner router');
    }
    
    const router = express.Router();
    router.get('/barcode/:barcode', scannerController.scanBarcode);
    return router;
}