import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface Chord { name: string; pos: number; }
const router = Router();

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { chord } = req.query as { chord?: string };
    if (!chord) {
      res.status(400).json({ error: 'Missing query param: chord' });
      return;
    }

    try {
      const { data } = await axios.get<Chord[]>(
        'https://piano-chords.p.rapidapi.com/chords',
        {
          params: { chord },
          headers: {
            'x-rapidapi-host': 'piano-chords.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY!
          },
          timeout: 5000
        }
      );

      res.json(data);
      return;
    } catch (err: any) {
      console.error('Error fetching Piano-Chords:', err.message || err);
      res.json([]);
      return;
    }
  }
);

export default router;
