import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware } from '../controllers/auth';

interface LyricsOvhResp { lyrics: string; }
interface Chord { name: string; pos: number; }

const router = Router();
router.use(authMiddleware);

router.get(
  '/:artist/:title',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { artist, title } = req.params;
    if (!artist || !title) {
      res.status(400).json({ error: 'Artist and title required' });
      return;
    }

    try {
      let lyricsText = '';
      try {
        const ovh = await axios.get<LyricsOvhResp>(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
          { timeout: 5000 }
        );
        lyricsText = ovh.data.lyrics;
      } catch {
        lyricsText = `--- Song Structure: ${artist} - ${title} ---\nVerse 1: …\nChorus: …`;
      }

      let chords: Chord[] = [];
      try {
        const resp = await axios.get<Chord[]>(
          `http://localhost:4000/api/chords`,
          { params: { artist, title }, timeout: 5000 }
        );
        chords = resp.data;
      } catch {
        chords = [];
      }
      const lines = lyricsText.split(/\r?\n/);
      const merged: string[] = lines.map((line, idx) => {
        const chordObj = chords.find(c => c.pos === idx + 1);
        if (chordObj) {
          return `${chordObj.name} ${line}`;
        }
        return line;
      });


      res.json({
        lyrics: merged.join('\n'),
        source: 'combined'
      });

    } catch (err) {
      next(err);
    }
  }
);

export default router;
