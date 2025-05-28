import { Router, Request, Response, RequestHandler } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { authMiddleware } from '../controllers/auth';

dotenv.config();
const router = Router();

// Apply authentication
router.use(authMiddleware);

// 1) Search for songs via Songsterr WA API
router.get(
  '/search',
  async (req, res) => {
    const pattern = (req.query.pattern as string || '').trim();
    if (!pattern) {
       res.status(400).json({ error: 'Missing query param: pattern' });
       return
    }
    try {
      // WA “best match” search:
      const { data } = await axios.get<{ id: number; }[]>(
        'https://www.songsterr.com/a/wa/bestMatchForQueryStringPart',
        {
          params: { s: pattern },
          validateStatus: (s) => s < 500,
          timeout: 5000,
        }
      );
      if (!Array.isArray(data) || data.length === 0) {
         res.status(404).json({ error: 'No matches on Songsterr' });
         return
      }
      // (you only get back an [{id:…}], so we return that)
       res.json(data);
       return
    } catch (err: any) {
      console.error('Songsterr WA status:', err.response?.status);
      res.status(502).json({ error: 'Songsterr search failed' });
      return
    }
  }
);

// 2) Single-chord lookup
const lookupSingleChord: RequestHandler = async (req, res, next) => {
  const chord = (req.query.chord as string)?.trim();
  if (!chord) {
     res.status(400).json({ error: 'Missing query param: chord' });
     return
  }

  try {
    const { data } = await axios.get<Record<string, any>>( 
      'https://piano-chords.p.rapidapi.com/chords',
      {
        params: { chord },
        headers: {
          'x-rapidapi-host': 'piano-chords.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        },
        timeout: 5000,
      }
    );

    const raw = chord;
    const rootMatch = raw.match(/^[A-G][b#]?/);
    const root = rootMatch ? rootMatch[0] : raw;
    const quality = raw.slice(root.length);

    const variations = data[root];
    if (!variations || typeof variations !== 'object') {
       res.status(404).json({ error: `No chords for "${raw}"` });
       return
    }

    const entry = variations[quality];
    if (!entry) {
       res.status(404).json({ error: `No variation for "${raw}"` });
       return
    }

     res.json([entry.name]);
     return
  } catch (err: any) {
    console.error('Error fetching Piano-Chords:', err);
     res.status(502).json({ error: 'Failed to fetch chords from upstream' });
     return
  }
};

// 3) Full-song chord lookup via WA API only
const lookupSongChords: RequestHandler = async (req, res) => {
  const artist = (req.query.artist as string)?.trim();
  const title = (req.query.title as string)?.trim();
  if (!artist || !title) {
     res.status(400).json({ error: 'Missing artist & title' });
     return
  }

  try {
    const matchResp = await axios.get<{ id: number }[]>(
      'https://www.songsterr.com/a/wa/bestMatchForQueryStringPart',
      {
        params: { s: `${artist} ${title}` },
        timeout: 5000,
        validateStatus: (status) => status < 500,
      }
    );

    if (!Array.isArray(matchResp.data) || matchResp.data.length === 0) {
       res.status(404).json({ error: 'No song found on Songsterr' });
       return
    }

    const songId = matchResp.data[0].id;
    const tabsResp = await axios.get<any[]>(
      'https://www.songsterr.com/a/wa/tab',
      {
        params: { songId, track: 'CHORDS' },
        timeout: 5000,
        validateStatus: (status) => status < 500,
      }
    );

    if (!Array.isArray(tabsResp.data) || tabsResp.data.length === 0) {
       res.status(404).json({ error: 'No chords available' });
       return
    }

    const chords = tabsResp.data
      .map((t) => t.chord?.label)
      .filter(Boolean);

     res.json(chords);
     return
  } catch (err: any) {
    console.error('Error fetching song chords:', err);
     res.status(502).json({ error: 'Failed to fetch song chords' });
     return
  }
};

// Dispatcher
const dispatchChords: RequestHandler = (req, res, next) => {
  if (typeof req.query.chord === 'string') {
     lookupSingleChord(req, res, next);
     return
  }
  if (
    typeof req.query.artist === 'string' &&
    typeof req.query.title === 'string'
  ) {
      lookupSongChords(req, res, next);
      return;
  }

   res.status(400).json({
    error: 'You must provide either ?chord=<CHORD> or both ?artist=<ARTIST>&title=<TITLE>',
  });
  return
};

router.get('/', dispatchChords);

export default router;
