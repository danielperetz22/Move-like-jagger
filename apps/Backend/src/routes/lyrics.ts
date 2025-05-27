import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware } from '../controllers/auth';

interface MusixmatchResponse {
  message: {
    body: {
      lyrics: {
        lyrics_body: string;
      };
    };
  };
}

const router = Router();
router.use(authMiddleware);

const MUSIXMATCH_KEY = process.env.MUSIXMATCH_API_KEY;

router.get(
  '/:artist/:title',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { artist, title } = req.params;
    if (!artist || !title) {
      res.status(400).json({ error: 'Artist and title required' });
      return;
    }

    try {
      const { data } = await axios.get<{ lyrics: string }>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      if (data.lyrics && data.lyrics.length > 10) {
        res.json({ lyrics: data.lyrics, source: 'lyrics.ovh' });
        return;
      }
    } catch {
    }

    if (MUSIXMATCH_KEY) {
      try {
        const mm = await axios.get<MusixmatchResponse>(
          'https://api.musixmatch.com/ws/1.1/matcher.lyrics.get',
          {
            params: {
              apikey: MUSIXMATCH_KEY,
              q_artist: artist,
              q_track: title,
              format: 'json'
            },
            timeout: 5000
          }
        );
        const body = mm.data.message.body;
        if (body?.lyrics?.lyrics_body) {
          res.json({ lyrics: body.lyrics.lyrics_body, source: 'musixmatch' });
          return;
        }
      } catch {
      }
    }

    const template = [
      `--- Song Structure: ${artist} - ${title} ---`,
      'Verse 1: …',
      'Chorus: …',
      'Verse 2: …',
      'Chorus: …'
    ].join('\n');

    res.json({ lyrics: template, source: 'template' });
  }
);

export default router;
