import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

export interface SongCompletion {
  correctedTitle: string;
  alternativeTitle: string;
  artistName: string;
}

export async function generateSongCompletion(
  songName: string
): Promise<SongCompletion> {
  if (!API_KEY) {
    throw new Error("Missing Gemini API Key");
  }

  const prompt = `
You are a music metadata assistant.
User input (possibly misspelled) song title: "${songName}"

Please reply with a JSON object with these fields:
- correctedTitle: the correctly spelled song title
- alternativeTitle: a similar song title that might match
- artistName: the performing artist’s name

Example response format:
\`\`\`json
{
  "correctedTitle": "Shape of You",
  "alternativeTitle": "The Shape of My Heart",
  "artistName": "Ed Sheeran"
}
\`\`\`
`;

  try {
    interface GeminiResponse {
      candidates: { content: { parts: { text: string }[] } }[];
    }

    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const raw = response.data.candidates[0]?.content.parts[0]?.text;
    if (!raw) {
      throw new Error("No response from Gemini");
    }

    // חותכים את כל מה שבין ```json ו-``` בעזרת RegExp
    const match = raw.match(/```json\s*([\s\S]*?)```/i);
    const jsonString = match
      ? match[1].trim()
      : raw.trim();

    let parsed: Partial<SongCompletion>;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response:", raw);
      throw new Error("Invalid JSON received from Gemini");
    }

    return {
      correctedTitle: parsed.correctedTitle || "",
      alternativeTitle: parsed.alternativeTitle || "",
      artistName: parsed.artistName || "",
    };
  } catch (error: any) {
    console.error("Gemini error:", error.response?.data || error.message);
    throw new Error("Failed to generate song completion");
  }
}
