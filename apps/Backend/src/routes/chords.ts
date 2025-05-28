import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware } from '../controllers/auth';

// Import your 4 JSON files:
import heyJude from '../data/hey_jude.json';
import veecheShlo from '../data/veech_shelo.json';
import shapeOfYou from '../data/shape_of_you.json';
import aba from '../data/aba.json';


const router = Router();
router.use(authMiddleware);

router.get(
  '/:artist/:title',
  async (req: Request, res: Response, next: NextFunction) => {
    const artist = req.params.artist.toLowerCase();
    const title  = req.params.title.toLowerCase();

    // If it's one of your two songs, return the imported JSON blob:
    if (artist === 'the beatles' && title === 'hey jude') {
       res.json(heyJude);
       return
    }
    if (artist === 'ariel zilberg' && title === 'veech shelo') {
       res.json(veecheShlo);
       return
    } if (artist === 'shlomi shabat' && title === 'aba') {
      res.json(aba);
      return
   }
    if (artist === 'ed sheeran' && title === 'shape of you') {
       res.json(shapeOfYou);
       return
    }

    // Otherwise, fetch lyrics only and wrap each line in a single-object array
    try {
      const ovh = await axios.get<{ lyrics: string }>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      const lines = ovh.data.lyrics.split(/\r?\n/);

      // Build same “blocks” shape, sans chords
      const blocks = lines.map(line => [{ lyrics: line }]);
       res.json(blocks);
       return

    } catch (err) {
      // On failure, return empty array
       res.json([]);
       return
    }
  }
);

export default router;
