import z from "zod";
import { ItemNameNormalizer } from "../../app/ports/ItemNameNormalizer.js";

const NormalizedItemSchema = z.object({
    raw_name: z.string(),
    normalized_name: z.string().min(1).nullable(),
    confidence: z.number().min(0).max(1),
    estimated_shelf_life_days: z.number().int().nonnegative().nullable()
});

const NormalizationSchema = z.object({
    items: z.array(NormalizedItemSchema)
});

const itemNameTools = [
    {
        functionDeclarations: [
            {
                name: "emit_item_name_normalization",
                description: "Return normalized grocery names, confidence scores, and estimated shelf life in days.",
                parameters: z.toJSONSchema(NormalizationSchema)
            }
        ]
    }
];

export class GeminiItemNameNormalizer extends ItemNameNormalizer {
    constructor({ ai, model = "gemini-2.5-flash", temperature = 0.5 }) {
        super();
        if (!ai) {
            throw new Error("AI instance is required");
        }
        this.ai = ai;
        this.model = model;
        this.temperature = temperature;
    }

    async normalize({ rawNames }) {
        if (!Array.isArray(rawNames) || !rawNames.length) {
            return [];
        }

        const names = rawNames.map(rawName => rawName || "");

        const systemInstruction = `
You normalize grocery receipt abbreviations into canonical grocery item names.
Return ONLY via the tool "emit_item_name_normalization".

Rules:
- Return one result for each input item, preserving the original order.
- Include the original input as raw_name.
- Return one best normalized grocery item name for each edible food ingredient.
- If the input is clearly not an edible food ingredient, set normalized_name to null.
- Confidence must be a decimal 0..1.
- For each edible item, estimate a typical home storage shelf life in days from the purchase date.
- Use a practical default storage assumption for the item, such as refrigerated for perishable foods and pantry for shelf-stable foods.
- If normalized_name is null or shelf life cannot be reasonably estimated, set estimated_shelf_life_days to null.
- Keep names simple and lowercase (e.g., "boneless chicken breast", "green onions").
`;

        const userPrompt = `Raw receipt item texts:\n${names.map((name, index) => `${index + 1}. "${name}"`).join("\n")}`;

        try {
            const resp = await this.ai.models.generateContent({
                model: this.model,
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                config: {
                    systemInstruction,
                    tools: itemNameTools,
                    temperature: this.temperature
                }
            });

            const parts = resp?.candidates?.[0]?.content?.parts ?? [];
            const functionCallPart = parts.find((p) => p.functionCall);
            if (!functionCallPart) {
                return buildFallback(names);
            }

            const args = functionCallPart.functionCall.args;
            const parsed = NormalizationSchema.parse(args);
            return finalizeNormalization({ rawNames: names, parsed });
        } catch {
            return buildFallback(names);
        }
    }
}

function buildFallback(rawNames) {
    return rawNames.map(rawName => {
        const name = (rawName || "unknown_item").trim() || "unknown_item";
        return {
            raw_name: rawName || "",
            normalized_name: name,
            confidence: 0,
            estimated_shelf_life_days: null
        };
    });
}

function finalizeNormalization({ rawNames, parsed }) {
    return rawNames.map((rawName, index) => {
        const normalized = parsed.items[index];
        if (!normalized) {
            return buildFallback([rawName])[0];
        }

        return {
            raw_name: normalized.raw_name || rawName,
            normalized_name: normalized.normalized_name,
            confidence: normalized.confidence,
            estimated_shelf_life_days: normalized.estimated_shelf_life_days
        };
    });
}
