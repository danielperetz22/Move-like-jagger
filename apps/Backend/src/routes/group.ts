import express from 'express';
import { authMiddleware } from '../controllers/auth';
import { GroupController } from '../controllers/group';

const router = express.Router();
const controller = new GroupController();

// Create a group (admin only)
router.post('/', authMiddleware, (req, res) => {
	controller.create(req, res);
});

// Add members to group (admin only)
router.post('/:id/members', authMiddleware, async (req, res) => {
	try {
		await controller.addMembers(req, res);
	} catch (error) {
		res.status(500).send({ error: 'An error occurred while adding members to the group.' });
	}
});

// List and get (optional):
router.get('/', authMiddleware, (req, res) => controller.list(req, res));
router.get('/:id', authMiddleware, async (req, res) => {
	try {
		await controller.getOne(req, res);
	} catch (error) {
		res.status(500).send({ error: 'An error occurred while fetching the group.' });
	}
});

export default router;


