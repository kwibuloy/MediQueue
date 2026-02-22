import { Router } from 'express';
import { callNextPatient, getAdminQueue, getDoctors, getPatientStatus, joinQueue } from '../controllers/queueController.js';

const router = Router();

router.get('/doctors', getDoctors);
router.get('/queue/admin/:doctorId', getAdminQueue);
router.post('/queue/join', joinQueue);
router.patch('/admin/call-next/:doctorId', callNextPatient);
router.get('/queue/patient-status/:patientId', getPatientStatus);

export default router;