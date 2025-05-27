import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import axios from 'axios';

const fetchChords: RequestHandler = async (req, res, next) => {
  try {
    const { artist, title } = req.query;
    if (!artist || !title) {
      res.status(400).json({ error: 'Artist and title are required' });
      return; // Just return, don't return the response object
    }

    const response = await axios.get('https://chords.alday.dev/chords', {
      params: { artist, title }
    });

    // Send response without returning it
    res.status(200).json(response.data);
  } catch (err: any) {
    // Pass error to next middleware instead of returning response
    next(err);
  }
};

const router = Router();
router.get('/', fetchChords);

export default router;
