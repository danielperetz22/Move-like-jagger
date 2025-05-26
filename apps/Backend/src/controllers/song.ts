// controllers/song.ts
import { Request, Response, NextFunction ,RequestHandler } from 'express';
import Song from '../models/song';

export const getAllSongs: RequestHandler = async (req, res, next) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    next(err);
  }
};
export const getSongById: RequestHandler<{ id: string }> = async (req, res, next) => {
    try {
      const song = await Song.findById(req.params.id);
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
      const newSong = await Song.create(req.body);
      res.status(201).json(newSong);
    } catch (err) {
      next(err);
    }
  };
  