import { FridgeRepository } from "../../app/ports/FridgeRepository.js";
import fs from "fs/promises";
import YAML from "yaml";
import { FridgeSchema } from "../../domain/schemas.js";


export class FridgeRepositoryYAML extends FridgeRepository {
    constructor({ filePath}) {
        super();
        if (!filePath) {
            throw new Error("File path is required for FridgeRepository");
        }
        this.filePath = filePath;
    }

    async getFridgeItems() {
        try {
            const data = await fs.readFile(this.filePath, "utf-8");
            const parsed = YAML.parse(data);
            const fridge = FridgeSchema.parse(parsed);
            return fridge;
        } catch (error) {
            console.error("Error reading or parsing fridge data:", error);
            throw new Error("Failed to load fridge items");
        }
    }
}