import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

export interface SongCompletion {
  correctedTitle: string;
  alternativeTitles: string[]; 
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
- alternativeTitles: an array of 3-4 DIFFERENT songs (not versions of the same song) that are similar or might be what the user is looking for
- artistName: the performing artist's name for the corrected title

Important: For the alternativeTitles, provide completely different songs, not just different versions (like "live version" or "remix") of the same song.

Example response format:
\`\`\`json
{
  "correctedTitle": "Shape of You",
  "alternativeTitles": ["Thinking Out Loud", "Perfect", "Castle on the Hill", "Photograph"],
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

    // Extract JSON from the response
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

    // Handle backward compatibility - if we get the old format with alternativeTitle
    if ('alternativeTitle' in parsed && !parsed.alternativeTitles) {
      const altTitle = (parsed as any).alternativeTitle;
      parsed.alternativeTitles = altTitle ? [altTitle] : [];
    }

    return {
      correctedTitle: parsed.correctedTitle || "",
      alternativeTitles: parsed.alternativeTitles || [],
      artistName: parsed.artistName || "",
    };
  } catch (error: any) {
    console.error("Gemini error:", error.response?.data || error.message);
    throw new Error("Failed to generate song completion");
  }
}
