import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { UserController, authMiddleware } from '../controllers/auth'; 

const router = Router();
const ctrl   = new UserController();

router.post('/register', upload.single('profileImage'), ctrl.create.bind(ctrl));
router.post('/login',  ctrl.login.bind(ctrl));
router.post('/refresh',ctrl.refresh.bind(ctrl));
router.post('/logout',ctrl.logout.bind(ctrl));

export default router;