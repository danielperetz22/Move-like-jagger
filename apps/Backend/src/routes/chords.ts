import { Router, Request, Response, RequestHandler } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { authMiddleware } from '../controllers/auth';
import songs from '../data/songs.json';

interface Song {
  id: string;
  title: string;
  artist?: string;
}

dotenv.config();
const router = Router();

// Apply authentication
router.use(authMiddleware);

// פונקציות עזר לחילוץ songId מתוך songs.json
function getSongIdByTitle(title: string): string | null {
  const match = songs.find(s =>
    s.title.toLowerCase() === title.toLowerCase()
  );
  return match?.id ?? null;
}

// 1) Search בתוך songs.json
router.get('/search', (req, res) => {
  const pattern = (req.query.pattern as string || '').trim().toLowerCase();
  if (!pattern) {
     res.status(400).json({ error: 'Missing query param: pattern' });
     return
  }
  // מצא כל שיר שתואם ל־pattern
  const results = songs
    .filter(s => s.title.toLowerCase().includes(pattern))
    .map(s => ({ title: s.title, id: s.id }));
  if (results.length === 0) {
     res.status(404).json({ error: 'No matches in local database' });
     return
  }
   res.json(results);
   return 
});

// 2) Single-chord lookup (לא השתנה)
const lookupSingleChord: RequestHandler = async (req, res) => {
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

const lookupSongChords: RequestHandler = async (req, res) => {
  const title = (req.query.title as string || '').trim();
  if (!title) {
    res.status(400).json({ error: 'Missing query param: title' });
    return;
  }

  
  const songId = getSongIdByTitle(title);
  if (!songId) {
    res.status(404).json({ error: 'Song ID not found for given title' });
    return;
  }

  try {
    const { data } = await axios.get<any>(
      `https://api.uberchord.com/v1/song/${songId}`,
      { timeout: 5000 }
    );

    // Use voicings now
    if (!Array.isArray(data.voicings) || data.voicings.length === 0) {
      res.status(404).json({ error: 'No voicings found for this song' });
      return;
    }

    const chords = data.voicings.map((v: any) => v.chordName);
    res.json(chords);
    return;
  } catch (err: any) {
    console.error('Error fetching chords from Uberchord:', err.message);
    res.status(502).json({ error: 'Failed to fetch chords from Uberchord' });
    return;
  }
};




const dispatchChords: RequestHandler = (req, res, next) => {
  if (typeof req.query.chord === 'string') {
    return lookupSingleChord(req, res, next);
  }
  if (typeof req.query.title === 'string') {
    return lookupSongChords(req, res, next);
  }

  res.status(400).json({
    error:
      'You must provide either ?chord=<CHORD> or ?title=<TITLE>',
  });
};


router.get('/', dispatchChords);

export default router;
