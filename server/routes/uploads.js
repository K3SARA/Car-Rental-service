import { Router } from 'express';
import { uploadVehiclePhoto, uploadLicensePhoto } from '../controllers/uploadController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(verifyToken);
router.post('/vehicle-photo', requireRole('admin', 'staff'), upload.single('file'), uploadVehiclePhoto);
router.post('/license-photo', requireRole('admin', 'staff'), upload.single('file'), uploadLicensePhoto);
export default router;
