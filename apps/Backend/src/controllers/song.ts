import { RequestHandler } from 'express';
import Song from '../models/song';
import axios from 'axios';

// Must be called after your authMiddleware so req.user._id is set
export const getAllSongs: RequestHandler = async (req, res, next) => {
  try {
    // only this admin’s songs
    const songs = await Song.find({ admin: req.user!._id });
    res.json(songs);
  } catch (err) {
    next(err);
  }
};

export const getSongById: RequestHandler<{ id: string }> = async (req, res, next) => {
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

export const createSong: RequestHandler = async (req, res, next) => {
  try {
    // embed the admin from the JWT
    const newSong = await Song.create({
      ...req.body,
      admin: req.user!._id
    });
    res.status(201).json(newSong);
  } catch (err) {
    next(err);
  }
};

export const searchAndSaveSong: RequestHandler<{ artist: string; title: string }> = async (req, res, next) => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const { artist, title } = req.params;
  
      const lyricsResp = await axios.get<{ lyrics: string }>(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      );
      const rawLyrics = lyricsResp.data.lyrics;
  
      const rawChords = req.query.chords;
      let chordSymbols: string[] = [];
      if (Array.isArray(rawChords)) {
        chordSymbols = rawChords.filter((chord): chord is string => typeof chord === 'string');
      } else if (typeof rawChords === 'string') {
        chordSymbols = rawChords.split(',');
      }
  
      const chordsResp = await axios.get<typeof Song.schema.obj.chords>(
        'https://chords.alday.dev/chords',
        { params: { note: chordSymbols } }
      );
      const chords = chordsResp.data;
  
      const song = await Song.findOneAndUpdate(
        { admin: req.user._id, artist, title },
        { rawLyrics, chords },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
  
      res.json(song);
    } catch (err) {
      next(err);
    }
  };