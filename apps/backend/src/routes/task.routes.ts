import { Router } from 'express';
import { getTasks, updateTask, createTask } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createTask); // Admin only would be better, but we only have user roles
router.get('/', getTasks);
router.patch('/:id', updateTask);

export default router;
