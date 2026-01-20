import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const enhanceMarkdown = async (content: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API_KEY is not set. AI features are disabled.");
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert technical editor. Refine the following Markdown text to improve clarity, grammar, and flow while strictly maintaining the original structure, formatting, and meaning. Do not add conversational filler. Output only the refined Markdown.\n\n---\n${content}`,
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
