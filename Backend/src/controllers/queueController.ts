import {Request, Response} from 'express';
import { query } from '../config/database.js';

export const getDoctors = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT id, name, specialization, is_available FROM doctors');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const joinQueue = async (req: Request, res: Response) => {
    try {
        const {doctorId } = req.body;
        const patientId = (req as any).user.id;
        
        if (!patientId || !doctorId) {
            return res.status(400).json({ error: 'Patient ID and doctor ID are required' });
        }

        const checkSql = `SELECT id FROM queues 
                          WHERE patient_id = $1 
                          AND doctor_id = $2 
                          AND status = 'waiting'
                          AND created_at::date = CURRENT_DATE;`;
        const existing = await query(checkSql, [patientId, doctorId]);

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You are already in this doctor\'s queue' });
        }

        const sql = `INSERT INTO queues (patient_id, doctor_id, ticket_number,status) 
                     VALUES 
                        (
                            $1, 
                            $2,
                            (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM queues WHERE doctor_id = $2 
                            AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date),
                            'waiting'
                        ) RETURNING ticket_number, status, created_at;`; 
        
        const result = await query(sql, [patientId, doctorId]);
        res.status(201).json({
            message: 'Joined queue successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error joining queue:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const getAdminQueue = async (req: Request, res: Response) => {
    const { doctorId } = req.params;

    try {
        const sql = `
            SELECT
                q.id,
                q.ticket_number,
                u.full_name AS patient_name,
                q.status,
                TO_CHAR(q.created_at AT TIME ZONE 'Asia/Singapore', 'HH12:MI AM') as arrival_time
            FROM queues q
            JOIN users u ON q.patient_id = u.id
            WHERE q.doctor_id = $1
                AND q.status IN ('waiting', 'called', 'in-consultation')
                AND (q.created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
            ORDER BY q.created_at ASC;
        `;

        const result = await query(sql, [doctorId]);
        // always return an array (possibly empty) with 200 status
        return res.status(200).json(result.rows || []);
    } catch (error) {
        console.error('Error fetching admin queue:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const callNextPatient = async (req: Request, res: Response) => {
    const { doctorId } = req.params;

    try {
        const sql = `
            UPDATE queues
            SET status = 'called'
            WHERE id = (
                SELECT id
                FROM queues
                WHERE doctor_id = $1
                    AND status = 'waiting'
                    AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
                ORDER BY ticket_number ASC
                LIMIT 1
            )
            RETURNING ticket_number, patient_id;
        `;

        const result = await query(sql, [doctorId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No patients in queue' });
        }

        res.json({
            message: 'Next patient called successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error calling next patient:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const getPatientStatus = async (req: Request, res: Response) => {
    const patientId = (req as any).user.id;

    try {
        // Only consider active statuses for patient view. Cancelled/done entries are treated as no active queue.
        const sql = `
            SELECT
                ticket_number,
                status,
                (SELECT COUNT(*) + 1 FROM queues
                WHERE doctor_id = q.doctor_id
                AND status = 'waiting'
                AND ticket_number < q.ticket_number
                AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date) AS position_in_queue
            FROM queues q
            WHERE patient_id = $1
                AND status IN ('waiting','called')
                AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
            ORDER BY created_at DESC
            LIMIT 1;
        `;

        const result = await query(sql, [patientId]);
        // console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            // return 200 with an empty object so frontend doesn't treat this as an error
            return res.status(200).json({});
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error getting patient status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const cancelQueue = async (req: Request, res: Response) => {
    const patientId = (req as any).user.id;
    try {
        const sql = `
            UPDATE queues
            SET status = 'cancelled'
            WHERE id = (
                SELECT id FROM queues
                WHERE patient_id = $1
                  AND status = 'waiting'
                  AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
                ORDER BY created_at ASC
                LIMIT 1
            )
            RETURNING id, ticket_number, status;
        `;
        const result = await query(sql, [patientId]);
        if (result.rowCount === 0) {
            // no active waiting entry found; return success so frontend can clear view
            return res.status(200).json({ message: 'No active queue entry found for this user today', data: null });
        }
        return res.status(200).json({ message: 'Queue cancelled successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error cancelling queue:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const getQueueHistory = async (req: Request, res: Response) => {
    const patientId = (req as any).user.id;
    try {
        const sql = `
            SELECT
                q.id,
                q.ticket_number,
                q.status,
                q.created_at,
                q.doctor_id,
                d.name AS doctor_name,
                d.specialization AS doctor_specialization,
                 d.room_number AS doctor_room
            FROM queues q
            LEFT JOIN doctors d ON q.doctor_id = d.id
            WHERE q.patient_id = $1
            ORDER BY q.created_at DESC;
        `;
        const result = await query(sql, [patientId]);
        return res.status(200).json(result.rows || []);
    } catch (err) {
        console.error('Error fetching queue history:', err && (err as Error).message ? (err as Error).message : err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const startSession = async (req: Request, res: Response) => {
    const { queueId } = req.params;
    try {
        // Move from 'called' to 'in-consultation'
        const sql = `
            UPDATE queues
            SET status = 'in-consultation'
            WHERE id = $1
                AND status = 'called'
            RETURNING id, ticket_number, status;
        `;
        const result = await query(sql, [queueId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Queue entry not found or not in called status' });
        }
        return res.status(200).json({ message: 'Session started', data: result.rows[0] });
    } catch (err) {
        console.error('Error starting session:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const completeSession = async (req: Request, res: Response) => {
    const { queueId } = req.params;
    try {
        // Move from 'in-consultation' to 'served'
        const sql = `
            UPDATE queues
            SET status = 'served'
            WHERE id = $1
                AND status = 'in-consultation'
            RETURNING id, ticket_number, status;
        `;
        const result = await query(sql, [queueId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Queue entry not found or not in in-consultation status' });
        }
        return res.status(200).json({ message: 'Session completed', data: result.rows[0] });
    } catch (err) {
        console.error('Error completing session:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}