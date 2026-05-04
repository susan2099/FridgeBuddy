import { ReceiptRepository } from "../../app/ports/ReceiptRepository.js";
import { FridgeItem } from "../../domain/entities/FridgeItem.js";
import { OCRProcessingError } from "../../domain/errors.js";

export class TabScannerRepository extends ReceiptRepository {
    static MAX_RESULT_RETRIES = 5;
    constructor( { apiKey }) {
        super();
        this.apiKey = apiKey;
    }
    async scan({ imageBuffer, mimeType }) {
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: mimeType });

        formData.append("file", blob, "receipt.jpg");
        
        const processResp = await fetch("https://api.tabscanner.com/api/2/process", {
            method: "POST",
            headers: {
                'apikey': this.apiKey
            },
            body: formData
        });
        const processData = await processResp.json();
        const token = processData?.token;
        if (!token) {
            throw new OCRProcessingError({ message: "No token received from OCR API", details: { response: processData } });
        }

        let result = null;
        let resultData = null;
        for (let i = 0; i < TabScannerRepository.MAX_RESULT_RETRIES; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const resultResp = await fetch(`https://api.tabscanner.com/api/result/${token}`, {
                method: "GET",
                headers: {
                    apikey: this.apiKey
                }
            });
            resultData = await resultResp.json();
            if (resultData?.status === "done") {
                result = resultData?.result;
                break;
            } else if (resultData?.status === "failed") {
                throw new OCRProcessingError({ message: "OCR processing failed", details: { response: resultData } });
            }
        }

        if (!result) {
            throw new OCRProcessingError({ message: "OCR processing timed out", details: { response: resultData } });
        }

        const items = result.lineItems.map(item => new FridgeItem({
            name: item.descClean || item.desc || "Unknown Item",
            quantity: item.qty,
            unit: item.unit,
        }));

        return { items };
    }
}