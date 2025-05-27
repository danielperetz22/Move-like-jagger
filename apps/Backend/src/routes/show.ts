import { Router } from 'express';
import { ShowController } from '../controllers/show';
import { authMiddleware } from '../controllers/auth';

const router = Router();
const controller = new ShowController();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    await controller.create(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/my-shows', authMiddleware, async (req, res, next) => {
  try {
    await controller.getForUser(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/participation', authMiddleware, async (req, res, next) => {
  try {
    await controller.updateParticipation(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    await controller.updateStatus(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    await controller.getOne(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;