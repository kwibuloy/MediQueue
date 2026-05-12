import { Router } from 'express';
import { 
    inviteAdmin, 
    getPendingInvitations, 
    resendInvitation, 
    revokeInvitation 
} from '../controllers/adminController.js';
import { authenticateUser, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All admin routes require authentication and 'admin' role
router.post('/invite', authenticateUser, requireRole('admin'), inviteAdmin);
router.get('/invitations', authenticateUser, requireRole('admin'), getPendingInvitations);
router.post('/invitations/resend', authenticateUser, requireRole('admin'), resendInvitation);
router.post('/invitations/revoke', authenticateUser, requireRole('admin'), revokeInvitation);

export default router;
