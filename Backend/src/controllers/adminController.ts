import { Request, Response } from 'express';
import { query } from '../config/database.js';

/**
 * Create an admin invitation for a specific email
 * This endpoint should only be accessible by existing admins
 */
export const inviteAdmin = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        // Check if user already exists in database
        const existingUserSql = `SELECT user_id, role FROM users WHERE email = $1`;
        const existingUserResult = await query(existingUserSql, [email]);

        if (existingUserResult.rows.length > 0) {
            const existingUser = existingUserResult.rows[0];
            if (existingUser.role === 'admin') {
                return res.status(400).json({ error: 'User is already an admin' });
            }
        }

        // Check if invitation already exists
        const existingInvitationSql = `SELECT invitation_id FROM admin_invitations WHERE email = $1`;
        const existingInvitationResult = await query(existingInvitationSql, [email]);

        if (existingInvitationResult.rows.length > 0) {
            return res.status(400).json({ error: 'Invitation already exists for this email' });
        }

        // Verify doctor exists

        // Create invitation
        const invitationSql = `
            INSERT INTO admin_invitations (email)
            VALUES ($1)
            RETURNING invitation_id, email, created_at, expires_at;
        `;
        
        const invitationResult = await query(invitationSql, [email]);

        return res.status(201).json({
            message: 'Admin invitation created successfully',
            invitation: invitationResult.rows[0]
        });

    } catch (err) {
        console.error('Error creating admin invitation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get all pending admin invitations
 * This endpoint should only be accessible by existing admins
 */
export const getPendingInvitations = async (req: Request, res: Response) => {
    try {
        const sql = `
            SELECT 
                invitation_id,
                email,
                created_at,
                expires_at
            FROM admin_invitations
            WHERE expires_at IS NULL OR expires_at > NOW()
            ORDER BY created_at DESC;
        `;
        
        const result = await query(sql);

        return res.status(200).json({
            invitations: result.rows || []
        });

    } catch (err) {
        console.error('Error fetching pending invitations:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Resend an admin invitation (delete and recreate if user hasn't signed up yet)
 */
export const resendInvitation = async (req: Request, res: Response) => {
    try {
        const { email, doctor_id } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        // Check if user has already signed up
        const userCheckSql = `SELECT user_id FROM users WHERE email = $1`;
        const userCheckResult = await query(userCheckSql, [email]);

        if (userCheckResult.rows.length > 0) {
            return res.status(400).json({ error: 'User has already signed up. Cannot resend invitation.' });
        }

        // Delete existing invitation if any
        const deleteInvitationSql = `DELETE FROM admin_invitations WHERE email = $1`;
        await query(deleteInvitationSql, [email]);

        // Create new invitation
        const invitationSql = `
            INSERT INTO admin_invitations (email)
            VALUES ($1)
            RETURNING invitation_id, email, created_at, expires_at;
        `;
        
        const invitationResult = await query(invitationSql, [email]);

        return res.status(200).json({
            message: 'Invitation resent successfully',
            invitation: invitationResult.rows[0]
        });

    } catch (err) {
        console.error('Error resending invitation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Delete/revoke an admin invitation
 */
export const revokeInvitation = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        const sql = `DELETE FROM admin_invitations WHERE email = $1 RETURNING id, email;`;
        const result = await query(sql, [email]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        return res.status(200).json({
            message: 'Invitation revoked successfully',
            revoked: result.rows[0]
        });

    } catch (err) {
        console.error('Error revoking invitation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
