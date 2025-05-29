import { Router } from 'express';
import { UserController, authMiddleware, searchUsers } from '../controllers/auth'; 

const router = Router();
const ctrl = new UserController();

router.post('/register', ctrl.create.bind(ctrl));
router.post('/login', ctrl.login.bind(ctrl));
router.post('/refresh', ctrl.refresh.bind(ctrl));
router.post('/logout', ctrl.logout.bind(ctrl));

// Get current user details
router.get('/me', authMiddleware, (req, res) => ctrl.getCurrentUser(req, res));

// Search users by username or email
router.get('/search', authMiddleware, searchUsers);

export default router;