import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePerfectSrt = async (
  contentFile: string,
  srtFile: string
): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
  I have two files. 
  1. A "Source Content" file which is the perfect, ground-truth text (script).
  2. An "Unfinished SRT" file which has the correct timestamps but imperfect text (typos, wrong punctuation, missing words, or raw speech-to-text).

  YOUR GOAL:
  Create a "Perfect SRT" output.
  
  STRICT RULES:
  1. You must keep the *exact* timestamp structure (Number, Timecode line) from the "Unfinished SRT" file. Do not change the timing even by a millisecond. Do not add or remove blocks unless absolutely necessary for logic (but prefer keeping the original structure).
  2. You must replace the text content inside each SRT block with the corresponding correct text from the "Source Content" file.
  3. The text must flow naturally. Use the "Source Content" to fix spelling, punctuation, capitalization, and phrasing in the SRT.
  4. Ensure the output is a valid .srt format.
  
  INPUT DATA:

  === SOURCE CONTENT (Perfect Text) ===
  ${contentFile}
  
  === UNFINISHED SRT (Timestamps to keep, text to replace) ===
  ${srtFile}
  
  OUTPUT FORMAT:
  Return ONLY the finalized SRT content. Do not include markdown code blocks (like \`\`\`srt), just the raw text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // High budget for processing long files if needed, though mostly text replacement
        thinkingConfig: { thinkingBudget: 1024 }, 
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    // Clean up if the model accidentally wrapped it in code blocks despite instructions
    const cleanedText = text.replace(/^```(srt)?/gm, '').replace(/```$/gm, '').trim();

    return cleanedText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};