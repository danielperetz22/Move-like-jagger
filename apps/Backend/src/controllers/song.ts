// src/controllers/song.ts
import { Request, Response, NextFunction } from 'express';
import Song from '../models/song';
import axios from 'axios';

interface LyricsResponse {
  lyrics: string;
}
export const getAllSongs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const songs = await Song.find({ admin: req.user!._id });
    res.json(songs);
  } catch (err) {
    next(err);
  }
};
export const getSongById = async (req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const song = await Song.findOne({ _id: req.params.id, admin: req.user!._id });
    if (!song) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(song);
  } catch (err) {
    next(err);
  }
};

export const createSong = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { artist, title } = req.body;
    if (!artist || !title) {
      res.status(400).json({ message: 'Artist and title are required' });
      return;
    }

    let rawLyrics = '';
    try {
      const lyr = await axios.get<{ lyrics: string }>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      if (lyr.data.lyrics?.length > 10) {
        rawLyrics = lyr.data.lyrics;
      }
    } catch {
      // אם נכשל, נשאיר rawLyrics ריק בינתיים
    }

    if (!rawLyrics) {
      rawLyrics = `Song: "${title}" by ${artist}\n\n` +
                  `Lyrics not available.\n\n` +
                  `Please refer to licensed sources for the full text.`;
    }
   
    const existing = await Song.findOne({
      admin: req.user!._id,
      artist: artist.trim(),
      title: title.trim()
    });
    if (existing) {
      res.status(200).json(existing);
      return;
    }

    const newSong = await Song.create({
      admin: req.user!._id,
      artist: artist.trim(),
      title: title.trim(),
      rawLyrics,
      chords: []
    });

    res.status(201).json(newSong);
  } catch (err) {
    console.error('❌ createSong error:', err);
    res.status(500).json({ message: 'Failed to create song' });
  }
};

export const searchAndSaveSong = async (
  req: Request<{ artist: string; title: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { artist, title } = req.params;

    let foundOrNewSong = await Song.findOne({
      admin: req.user!._id,
      artist,
      title
    });

    if (!foundOrNewSong) {
      foundOrNewSong = await Song.create({
        admin: req.user!._id,
        artist,
        title,
        rawLyrics: '',    
        chords: []
      });
    }

    res.json(foundOrNewSong);
    return;

  } catch (err) {
    next(err);
  }
};



export const searchSongs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = req.query as { query?: string };
    if (!query) {
      res.status(400).json({ message: 'Query required' });
      return;
    }

    const saved = await Song.find({
      admin: req.user!._id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } }
      ]
    });

    if (saved.length > 0) {
      res.json(saved);
      return;
    }

    res.json([{ temp: true, artist: query, title: '' }]);
    return;
  } catch (err) {
    next(err);
  }
};
