import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '../controllers/auth';

// Define the interface for lyrics API response
interface LyricsResponse {
  lyrics: string;
}

const router = Router();

// Require authentication
router.use(authMiddleware);

// Fetch lyrics for a song without saving to database
router.get('/:artist/:title', async (req: Request, res: Response) => {
  try {
    const { artist, title } = req.params;
    
    console.log(`Real-time lyrics fetch for: ${artist} - ${title}`);
    
    try {
      const lyricsResp = await axios.get<LyricsResponse>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      
      if (lyricsResp.data && lyricsResp.data.lyrics && lyricsResp.data.lyrics.length > 10) {
        res.json({ 
          lyrics: lyricsResp.data.lyrics,
          source: 'api.lyrics.ovh'
        });
      } else {
        // Use fallback lyrics for demo purposes
        const fallbackLyrics = generateSampleLyrics(artist, title);
        res.json({ 
          lyrics: fallbackLyrics,
          source: 'fallback'
        });
      }
    } catch (error) {
      // Provide fallback lyrics for testing
      const fallbackLyrics = generateSampleLyrics(artist, title);
      res.json({ 
        lyrics: fallbackLyrics,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ message: 'Failed to fetch lyrics' });
  }
});

// Helper function to generate sample lyrics for testing
function generateSampleLyrics(artist: string, title: string): string {
  return `Sample lyrics for "${title}" by ${artist}\n\nVerse 1:\nThis is a sample lyric line\nJust for testing purposes\nSo you can see how it looks\n\nChorus:\nThis is the chorus part\nWith some sample lyrics\nThat you can use for testing\n\nVerse 2:\nHere's another verse\nWith more sample lyrics\nFor you to test with`;
}

export default router;
