import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import Song from '../models/song';
import axios from 'axios';

// Define proper interface for lyrics response
interface LyricsResponse { 
  lyrics: string;
}

// Fix return type issue by using a more specific function signature
export const getAllSongs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // only this admin's songs
    const songs = await Song.find({ admin: req.user!._id });
    res.json(songs);
  } catch (err) {
    next(err);
  }
};

export const getSongById = async (req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const song = await Song.findOne({ 
      _id: req.params.id, 
      admin: req.user!._id 
    });
    if (!song) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(song);
  } catch (err) {
    next(err);
  }
};

// Updated createSong handler to require valid lyrics
export const createSong = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { artist, title } = req.body;
    
    if (!artist || !title) {
      res.status(400).json({ message: 'Artist and title are required' });
      return;
    }

    // Check if song already exists
    const existingSong = await Song.findOne({ 
      admin: req.user!._id,
      artist: artist.trim(),
      title: title.trim()
    });

    if (existingSong) {
      res.status(200).json(existingSong);
      return;
    }

    // No default lyrics - we'll require the API to return valid lyrics
    let rawLyrics = '';
    
    try {
      console.log(`Fetching lyrics for: ${artist} - ${title}`);
      
      const lyricsResp = await axios.get<LyricsResponse>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      
      if (lyricsResp.data && typeof lyricsResp.data.lyrics === 'string' && lyricsResp.data.lyrics.length > 10) {
        rawLyrics = lyricsResp.data.lyrics;
        console.log('Lyrics found successfully from API');
      } else {
        console.log('API returned empty or too short lyrics');
        res.status(404).json({ message: 'No lyrics found for this song' });
        return;
      }
    } catch (error: unknown) {
      console.error('Lyrics API error:', error);
      res.status(404).json({ message: 'No lyrics found for this song. Try a different song or check your spelling.' });
      return;
    }

    // Only proceed if we have valid lyrics
    console.log('Creating song with rawLyrics length:', rawLyrics.length);
    
    // Create song with valid lyrics from the API
    const newSong = await Song.create({
      admin: req.user!._id,
      artist: artist.trim(),
      title: title.trim(),
      rawLyrics: rawLyrics,
      chords: []
    });
    
    res.status(201).json(newSong);
  } catch (error: unknown) {
    // ...existing error handling code...
  }
};

// Also update the searchAndSaveSong function with similar logic
export const searchAndSaveSong = async (
  req: Request<{artist: string; title: string}>, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { artist, title } = req.params;

    // Check if we already have this song
    const existingSong = await Song.findOne({
      admin: req.user._id,
      artist,
      title
    });

    if (existingSong) {
      res.status(200).json(existingSong);
      return;
    }

    // Fetch lyrics with better error handling
    let rawLyrics = '';
    try {
      const lyricsResp = await axios.get<LyricsResponse>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      if (lyricsResp.data && lyricsResp.data.lyrics && lyricsResp.data.lyrics.length > 10) {
        rawLyrics = lyricsResp.data.lyrics;
      } else {
        res.status(404).json({ message: 'No lyrics found for this song' });
        return;
      }
    } catch (error: unknown) {
      res.status(404).json({ message: 'No lyrics found for this song. Try a different song or check your spelling.' });
      return;
    }

    // Create song only if we have valid lyrics
    const song = await Song.create({
      admin: req.user._id,
      artist,
      title,
      rawLyrics,
      chords: []
    });

    res.status(201).json(song);
  } catch (error: unknown) {
    // ...existing error handling code...
  }
};

// Add this function to your existing song controller

export const searchSongs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query as { query: string };
    
    if (!query) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }
    
    const songs = await Song.find({
      admin: req.user!._id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json(songs);
  } catch (err) {
    next(err);
  }
};