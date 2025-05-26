import axios from 'axios';
import router from './song';

interface LyricsResponse { lyrics: string; }

router.get('/:artist/:title', async (req, res, next) => {
  try {
    // <LyricsResponse> tells TS that data has a `lyrics: string` field
    const response = await axios.get<LyricsResponse>(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.title)}`
    );
    // now response.data is LyricsResponse, not unknown
    res.json({ lyrics: response.data.lyrics });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: 'Lyrics not found' });
  }
});

export default router;
