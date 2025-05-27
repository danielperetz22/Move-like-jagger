import { Router } from 'express';
import { authMiddleware } from '../controllers/auth';
import { getAllSongs, getSongById, createSong ,searchAndSaveSong } from '../controllers/song';

const router = Router();

// require valid JWT and admin flag
router.use(authMiddleware);

// only admins can CRUD their songs
router.get('/',    getAllSongs);
router.get('/:id', getSongById);
router.get('/search/:artist/:title', searchAndSaveSong);
router.post('/',   createSong);


export default router;
