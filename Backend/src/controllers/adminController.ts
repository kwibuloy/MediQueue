import { Request, Response } from 'express';
import { query } from '../config/database.js';


export const inviteAdmin = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        const existingUserSql = `SELECT user_id, role FROM users WHERE email = $1`;
        const existingUserResult = await query(existingUserSql, [email]);

        if (existingUserResult.rows.length > 0) {
            const existingUser = existingUserResult.rows[0];
            return res.status(400).json({
                error: existingUser.role === 'admin'
                    ? 'User is already an admin'
                    : 'This email is already registered as a patient and cannot be invited as an admin'
            });
        }

        const existingInvitationSql = `SELECT invitation_id FROM admin_invitations WHERE email = $1`;
        const existingInvitationResult = await query(existingInvitationSql, [email]);

        if (existingInvitationResult.rows.length > 0) {
            return res.status(400).json({ error: 'Invitation already exists for this email' });
        }

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

export const resendInvitation = async (req: Request, res: Response) => {
    try {
        const { email, doctor_id } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        const userCheckSql = `SELECT user_id FROM users WHERE email = $1`;
        const userCheckResult = await query(userCheckSql, [email]);

        if (userCheckResult.rows.length > 0) {
            return res.status(400).json({ error: 'User has already signed up. Cannot resend invitation.' });
        }

        const deleteInvitationSql = `DELETE FROM admin_invitations WHERE email = $1`;
        await query(deleteInvitationSql, [email]);

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

export const revokeInvitation = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        const sql = `DELETE FROM admin_invitations WHERE email = $1 RETURNING invitation_id, email;`;
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

export const createDoctor = async (req: Request, res: Response) => {
    try {
        const {
            doctorFirstName,
            doctorLastName,
            specialization,
            roomNumber,
            isAvailable,
        } = req.body ?? {};

        const normalizedFirstName = String(doctorFirstName ?? '').trim();
        const normalizedLastName = String(doctorLastName ?? '').trim();
        const normalizedSpecialization = String(specialization ?? '').trim();
        const normalizedRoomNumber = String(roomNumber ?? '').trim();

        if (!normalizedFirstName || !normalizedLastName || !normalizedSpecialization || !normalizedRoomNumber) {
            return res.status(400).json({
                error: 'doctorFirstName, doctorLastName, specialization, and roomNumber are required',
            });
        }

        if (typeof isAvailable !== 'undefined' && typeof isAvailable !== 'boolean') {
            return res.status(400).json({ error: 'isAvailable must be a boolean when provided' });
        }

        const sql = `
            INSERT INTO doctors (
                doctor_first_name,
                doctor_last_name,
                specialization,
                room_number,
                is_available
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                doctor_id,
                doctor_first_name,
                doctor_last_name,
                CONCAT(doctor_first_name, ' ', doctor_last_name) AS doctor_name,
                specialization,
                room_number,
                is_available;
        `;

        const result = await query(sql, [
            normalizedFirstName,
            normalizedLastName,
            normalizedSpecialization,
            normalizedRoomNumber,
            typeof isAvailable === 'boolean' ? isAvailable : true,
        ]);

        return res.status(201).json({
            message: 'Doctor created successfully',
            doctor: result.rows[0],
        });
    } catch (err) {
        console.error('Error creating doctor:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteDoctor = async (req: Request, res: Response) => {
    const { doctorId } = req.params;

    try {
        const activeQueueSql = `
            SELECT COUNT(*)::int AS active_count
            FROM queues
            WHERE doctor_id = $1
              AND status IN ('waiting', 'called', 'in-consultation');
        `;
        const activeQueueResult = await query(activeQueueSql, [doctorId]);
        const activeCount = activeQueueResult.rows[0]?.active_count ?? 0;

        if (activeCount > 0) {
            return res.status(409).json({
                error: 'Cannot remove doctor while there are active queue entries',
            });
        }

        const deleteSql = `
            DELETE FROM doctors
            WHERE doctor_id = $1
            RETURNING doctor_id, doctor_first_name, doctor_last_name;
        `;
        const result = await query(deleteSql, [doctorId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        return res.status(200).json({
            message: 'Doctor removed successfully',
            doctor: result.rows[0],
        });
    } catch (err: any) {
        if (err?.code === '23503') {
            return res.status(409).json({
                error: 'Cannot remove doctor because related queue records still exist',
            });
        }

        console.error('Error removing doctor:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
