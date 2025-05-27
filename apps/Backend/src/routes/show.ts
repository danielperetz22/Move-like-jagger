import { Router, Request, Response, RequestHandler } from 'express';
import { authMiddleware } from '../controllers/auth';
import { ShowController } from '../controllers/show';

const router = Router();
const controller = new ShowController();

// helper to wrap async controller fn into a RequestHandler
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.post('/',              asyncHandler(controller.create));
router.put('/participation',  asyncHandler(controller.updateParticipation));
router.get('/my-shows',       asyncHandler(controller.getForUser));
router.get('/active',         asyncHandler(controller.getActive));
router.get('/:id',            asyncHandler(controller.getOne));
router.put('/:id',            asyncHandler(controller.updateStatus));

export default router;