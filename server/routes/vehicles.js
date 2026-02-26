import { Router } from 'express';
import { list, get, create, update, remove } from '../controllers/vehicleController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);
router.get('/', list);
router.get('/:id', get);
router.post('/', requireRole('admin', 'staff'), create);
router.patch('/:id', requireRole('admin', 'staff'), update);
router.delete('/:id', requireRole('admin'), remove);
export default router;
