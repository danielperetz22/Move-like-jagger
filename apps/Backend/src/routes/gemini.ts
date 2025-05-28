import express from "express";
import { generateSongCompletion, SongCompletion } from "../services/gemini";

const router = express.Router();

/**
 * POST /api/gemini/song-completion
 * Request body: { songName: string }
 * Response: { correctedTitle, alternativeTitles, artistName }
 */
router.post("/song-completion", async (req, res) => {
  const { songName } = req.body as { songName?: string };

  if (!songName) {
    res.status(400).json({ error: "Missing required field: songName" });
    return;
  }

  try {
    const result: SongCompletion = await generateSongCompletion(songName);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
});

export default router;
