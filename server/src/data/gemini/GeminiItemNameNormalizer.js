import z from "zod";
import { ItemNameNormalizer } from "../../app/ports/ItemNameNormalizer.js";

const NormalizationSchema = z.object({
    normalized_name: z.string().min(1),
    confidence: z.number().min(0).max(1)
});

const itemNameTools = [
    {
        functionDeclarations: [
            {
                name: "emit_item_name_normalization",
                description: "Return one normalized grocery name and confidence.",
                parameters: z.toJSONSchema(NormalizationSchema)
            }
        ]
    }
];

export class GeminiItemNameNormalizer extends ItemNameNormalizer {
    constructor({ ai, model = "gemini-2.5-flash", temperature = 0.2, autoApplyConfidence = 0.85 }) {
        super();
        if (!ai) {
            throw new Error("AI instance is required");
        }
        this.ai = ai;
        this.model = model;
        this.temperature = temperature;
        this.autoApplyConfidence = autoApplyConfidence;
    }

    async normalize({ rawName }) {
        if (!rawName || !rawName.trim()) {
            return buildFallback(rawName);
        }

        const systemInstruction = `
You normalize grocery receipt abbreviations into canonical grocery item names.
Return ONLY via the tool "emit_item_name_normalization".

Rules:
- Return one best normalized grocery item name.
- Confidence must be a decimal 0..1.
- Keep names simple and lowercase (e.g., "boneless chicken breast", "green onions").
`;

        const userPrompt = `Raw receipt item text: "${rawName}"`;

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
                return buildFallback(rawName);
            }

            const args = functionCallPart.functionCall.args;
            const parsed = NormalizationSchema.parse(args);
            return finalizeNormalization({
                rawName,
                parsed,
                autoApplyConfidence: this.autoApplyConfidence
            });
        } catch {
            return buildFallback(rawName);
        }
    }
}

function buildFallback(rawName) {
    const name = (rawName || "unknown_item").trim() || "unknown_item";
    return {
        raw_name: rawName || "",
        name,
        auto_applied: false
    };
}

function finalizeNormalization({ rawName, parsed, autoApplyConfidence }) {
    const autoApplied = parsed.confidence >= autoApplyConfidence;
    return {
        raw_name: rawName,
        name: autoApplied ? parsed.normalized_name : (rawName || parsed.normalized_name),
        auto_applied: autoApplied
    };
}
