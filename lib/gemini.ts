import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

export const MODELS = {
  text: "gemini-2.5-flash",
  imageGen: "gemini-3-pro-image-preview",
} as const;
