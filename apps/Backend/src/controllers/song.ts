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

// Updated createSong handler with better error handling and proper typings
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

    // Default lyrics if API fails
    let rawLyrics = 'Lyrics not available';
    
    try {
      console.log(`Fetching lyrics for: ${artist} - ${title}`);
      const lyricsResp = await axios.get<LyricsResponse>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      
      if (lyricsResp.data && typeof lyricsResp.data.lyrics === 'string') {
        rawLyrics = lyricsResp.data.lyrics;
        console.log('Lyrics found successfully');
      }
    } catch (error: unknown) {
      // Properly handle unknown error type
      const lyricsErr = error as Error;
      console.error('Lyrics API error:', lyricsErr.message || 'Unknown error');
      console.log('Using default lyrics');
      // Keep the default lyrics already set
    }

    console.log('Creating song with rawLyrics length:', rawLyrics.length);
    
    // Create song with the lyrics (default or fetched)
    const newSong = await Song.create({
      admin: req.user!._id,
      artist: artist.trim(),
      title: title.trim(),
      rawLyrics,
      chords: []
    });

    res.status(201).json(newSong);
  } catch (error: unknown) {
    const err = error as any;
    console.error('Song creation error details:', err);
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      res.status(400).json({ 
        message: messages.join(', '), 
        validationError: true 
      });
      return;
    }
    
    // Handle duplicate key error
    if (err.name === 'MongoServerError' && err.code === 11000) {
      res.status(409).json({ 
        message: 'This song already exists in your collection'
      });
      return;
    }
    
    next(err);
  }
};

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
    let rawLyrics = 'Lyrics not available';
    try {
      const lyricsResp = await axios.get<LyricsResponse>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 5000 }
      );
      if (lyricsResp.data && lyricsResp.data.lyrics) {
        rawLyrics = lyricsResp.data.lyrics;
      }
    } catch (error: unknown) {
      const lyricsErr = error as Error;
      console.error('Lyrics API error:', lyricsErr.message || 'Unknown error');
      // Don't fail the whole request
    }

    // Create song even if lyrics fetch fails
    const song = await Song.create({
      admin: req.user._id,
      artist,
      title,
      rawLyrics,
      chords: []
    });

    res.status(201).json(song);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Song search and save error:', err);
    next(err);
  }
};