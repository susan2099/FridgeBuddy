import { BarcodeRepository } from "../../app/ports/BarcodeRepository.js"
import { FridgeItem } from "../../domain/entities/FridgeItem.js";
import { ProductNotFoundError } from "../../domain/errors.js";

export class OffRepository extends BarcodeRepository {
    async lookup(barcode) {
        const fields = [
            "product_name",
            "product_quantity",
            "product_quantity_unit",
            "expiration_date",
            "allergens_tags"
        ].join(",");
        
        const url = `https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(barcode)}?fields=${encodeURIComponent(fields)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new ProductNotFoundError({ message: `Product with barcode ${barcode} not found in OpenFoodFacts Database.` });
            }
            throw new Error(`Failed to fetch product data: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status !== 1 || !data.product) {
            throw new ProductNotFoundError({ message: `Product with barcode ${barcode} not found in OpenFoodFacts Database.` });
        }
        const product = data.product;
        const allergens = product.allergens_tags.map(tag => 
            tag.replace(/^.{2}:/, "").replace(/-/g, " ")
        ); // Replace "en:whole-milk" with "whole milk"

        return new FridgeItem({
            name: product.product_name || "Unknown Product",
            quantity: product.product_quantity || null,
            unit: product.product_quantity_unit || null,
            expiry: product.expiration_date ? new Date(product.expiration_date) : null,
            allergens: allergens
        });
    }
} 