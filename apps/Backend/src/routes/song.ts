import { Router } from 'express';
import { authMiddleware } from '../controllers/auth';
import {
    getAllSongs,
    getSongById,
    createSong,
    searchSongs
} from '../controllers/song';
    
const router = Router();
router.use(authMiddleware);

router.get('/', getAllSongs);
router.get('/:id', getSongById);
router.get('/search', searchSongs);
router.post('/', createSong);

export default router;