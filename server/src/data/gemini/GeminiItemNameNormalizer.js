import z from "zod";
import { ItemNameNormalizer } from "../../app/ports/ItemNameNormalizer.js";

const NormalizationSchema = z.object({
    suggestions: z.array(
        z.object({
            name: z.string().min(1),
            confidence: z.number().min(0).max(1)
        })
    ).max(2),
    fallback: z.string().min(1).default("unknown_item")
});

const itemNameTools = [
    {
        functionDeclarations: [
            {
                name: "emit_item_name_normalization",
                description: "Return up to 2 item name suggestions with confidence and a fallback token.",
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
- Return 1-2 likely grocery item names in suggestions, sorted best first.
- Confidence must be a decimal 0..1.
- If uncertain, still provide best guesses and set fallback to "unknown_item".
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
    const suggestions = parsed.suggestions.slice(0, 2);
    const top = suggestions[0];

    if (!top) {
        return buildFallback(rawName);
    }

    const autoApplied = top.confidence >= autoApplyConfidence;
    return {
        raw_name: rawName,
        name: autoApplied ? top.name : (rawName || top.name),
        auto_applied: autoApplied
    };
}
