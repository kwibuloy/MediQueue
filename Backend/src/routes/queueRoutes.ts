import { Router } from 'express';
import { callNextPatient, getAdminQueue, getDoctors, getPatientStatus, joinQueue } from '../controllers/queueController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/doctors', getDoctors);
router.get('/queue/admin/:doctorId', getAdminQueue);
router.post('/queue/join', authenticateUser,joinQueue);
router.patch('/admin/call-next/:doctorId', callNextPatient);
router.get('/queue/patient-status', authenticateUser, getPatientStatus);

export default router;