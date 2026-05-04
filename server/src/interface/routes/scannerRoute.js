import express from 'express';
import multer from 'multer';

export function buildScannerRouter(scannerController) {
    if (!scannerController) {
        throw new Error('ScannerController is required to build the scanner router');
    }
    
    const router = express.Router();

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }
    });

    router.get('/barcode/:barcode', scannerController.scanBarcode);
    router.post('/receipt', upload.single('img'), scannerController.scanReceipt);
    return router;
}