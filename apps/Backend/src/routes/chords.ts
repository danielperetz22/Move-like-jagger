import { Router, RequestHandler } from 'express';
import axios from 'axios';

const router = Router();

const fetchChords: RequestHandler = async (req, res, next) => {
  try {
    const response = await axios.get('https://chords.alday.dev/chords', {
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    next(err);
  }
};

router.get('/', fetchChords);

export default router;
