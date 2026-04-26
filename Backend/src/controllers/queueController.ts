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

        const checkSql = `SELECT id FROM queues WHERE patient_id = $1 AND doctor_id = $2 AND status = 'waiting'`;
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
                q.ticket_number,
                u.full_name AS patient_name,
                q.status,
                TO_CHAR(q.created_at AT TIME ZONE 'Asia/Singapore', 'HH12:MI AM') as arrival_time
            FROM queues q
            JOIN users u ON q.patient_id = u.id
            WHERE q.doctor_id = $1
                AND q.status = 'waiting'
                AND (q.created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
            ORDER BY q.created_at ASC;
        `;

        const result = await query(sql, [doctorId]);
        return res.json(result.rows);
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
                AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore')::date
            ORDER BY created_at DESC
            LIMIT 1;
        `;

        const result = await query(sql, [patientId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No queue entry found for this patient today' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error getting patient status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}