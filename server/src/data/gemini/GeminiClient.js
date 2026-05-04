import { GoogleGenAI } from "@google/genai";
import process from "process";

export function createGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenAI({ apiKey });
}