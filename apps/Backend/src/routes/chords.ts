import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware } from '../controllers/auth';

const router = Router();
router.use(authMiddleware);

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { artist, title } = req.query as { artist?: string; title?: string };
    if (!artist || !title) {
      res.status(400).json({ error: 'Artist and title required' });
      return;
    }

    try {
      const search = encodeURIComponent(`${artist} ${title}`);
      const songs = await axios.get<any[]>(
        `https://www.songsterr.com/a/ra/songs.json?pattern=${search}`,
        { timeout: 5000 }
      );

      if (Array.isArray(songs.data) && songs.data.length > 0) {
        const songId = songs.data[0].id;
        const tabRes = await axios.get(
          `https://www.songsterr.com/a/ra/songs/${songId}/tab`,
          { timeout: 5000 }
        );
        // מחזירים **ישר** את המערך
        res.json(tabRes.data);
        return;
      }

      // fallback כאשר אין שיר ב-Songsterr
      res.json([
        { name: 'C', pos: 1 },
        { name: 'G', pos: 2 },
        { name: 'Am', pos: 3 },
        { name: 'F', pos: 4 }
      ]);
      return;

    } catch (err: unknown) {
      if (err instanceof Error) console.error('Chord fetch error:', err.message);
      else console.error('Chord fetch error:', err);

      // תמיד fallback, אף פעם לא 502
      res.json([
        { name: 'C', pos: 1 },
        { name: 'G', pos: 2 },
        { name: 'Am', pos: 3 },
        { name: 'F', pos: 4 }
      ]);
      return;
    }
  }
);

export default router;
