
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
    text: string;
    sources: any[];
}

const TUTOR_PROMPT = `You are an expert coding tutor. A user has provided a piece of code and an error message. Your goal is to help them understand and fix the bug.
Provide a clear, concise, and helpful response formatted in Markdown.
Your response MUST include the following sections in this exact order:

1.  ## Bug Explanation
    In simple language, explain what the error means and what is causing the bug in the provided code.

2.  ## Corrected Code
    Provide the complete, corrected code snippet. Use a markdown code block with the correct language identifier (e.g., \`\`\`javascript).

3.  ## Step-by-Step Fix
    Detail the specific changes made to fix the code and why they were necessary. Use a numbered list.

Analyze the following user input:`;

export async function analyzeCodeError(userInput: string, options: { isThinkingMode?: boolean } = {}): Promise<AnalysisResult> {
  const { isThinkingMode = false } = options;
  // API key is automatically sourced from the environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const config: any = {
      tools: [{googleSearch: {}}],
  };

  if (isThinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: `${TUTOR_PROMPT}\n\n---\n\n${userInput}`,
        config: config,
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!text) {
        throw new Error("Received an empty response from the AI. Please try again.");
    }

    return { text, sources };

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
         throw new Error("The API key is invalid. Please check your configuration.");
    }
    throw new Error("Failed to get analysis from the AI. The service might be temporarily unavailable.");
  }
}
