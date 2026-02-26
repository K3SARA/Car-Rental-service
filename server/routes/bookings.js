import { Router } from 'express';
import { list, get, create, update, checkAvailability } from '../controllers/bookingController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);
router.get('/', list);
router.get('/availability', checkAvailability);
router.get('/:id', get);
router.post('/', requireRole('admin', 'staff'), create);
router.patch('/:id', requireRole('admin', 'staff'), update);
export default router;
