import { Router } from 'express';
import { getAllSongs, getSongById, createSong } from '../controllers/song';

const router = Router();
router.get('/', getAllSongs);
router.get('/:id', getSongById);
router.post('/', createSong);
export default router;
