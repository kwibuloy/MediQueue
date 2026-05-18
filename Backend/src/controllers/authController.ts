import {Request, Response} from "express";
import {createClient} from "@supabase/supabase-js";
import { query } from "../config/database.js";
import {
    deleteInvitationByCode,
    findInvitationByCode,
    isInvitationExpired,
} from "../utils/invitation.js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const validateInvitationCode = async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Invitation code is required' });
    }

    try {
        const invitation = await findInvitationByCode(code);

        if (!invitation) {
            return res.status(403).json({ error: 'Invalid invitation code' });
        }

        if (isInvitationExpired(invitation.expires_at)) {
            return res.status(403).json({ error: 'Invitation has expired' });
        }

        return res.status(200).json({
            valid: true,
            email: invitation.email,
        });
    } catch (err) {
        console.error('Error validating invitation code:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const register = async (req: Request, res: Response) => {
    const {
        email,
        password,
        firstName,
        lastName,
        fullName,
        role: requestedRole,
        invitationCode,
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({error: "email and password are required"});
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();

    let user_first_name = normalizedFirstName;
    let user_last_name = normalizedLastName;

    if ((!user_first_name || !user_last_name) && fullName) {
        const nameParts = String(fullName).trim().split(/\s+/);
        user_first_name = user_first_name || nameParts.shift() || '';
        user_last_name = user_last_name || nameParts.join(' ') || '';
    }

    if (!user_first_name || !user_last_name) {
        return res.status(400).json({error: "firstName and lastName are required"});
    }

    try {
        let role = 'patient';

        if (requestedRole === 'admin') {
            if (!invitationCode || typeof invitationCode !== 'string') {
                return res.status(403).json({ error: 'A valid invitation code is required for admin registration' });
            }

            const invitation = await findInvitationByCode(invitationCode);

            if (!invitation) {
                return res.status(403).json({ error: 'Invalid invitation code' });
            }

            if (isInvitationExpired(invitation.expires_at)) {
                return res.status(403).json({ error: 'Invitation has expired' });
            }

            if (invitation.email.toLowerCase() !== normalizedEmail) {
                return res.status(403).json({
                    error: 'This invitation code is not valid for the email address provided',
                });
            }

            role = 'admin';
        } else if (requestedRole) {
            role = requestedRole;
        }

        const {data, error} = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    user_first_name,
                    user_last_name,
                    role: role
                }
            }
        });

        if (error) {
            console.error('Supabase signup error:', error);
            const statusCode = (error as any)?.status || 500;
            const message = (error as any)?.message || 'Supabase signup failed';
            const code = (error as any)?.code || null;
            return res.status(statusCode).json({ error: message, code });
        }

        if (data.user) {
            const user_id = data.user.id;

            const insertUserSql = `
                INSERT INTO users (user_id, email, user_first_name, user_last_name, role)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT(user_id) DO UPDATE
                SET email = $2, user_first_name = $3, user_last_name = $4, role = $5
                RETURNING user_id, email, user_first_name, user_last_name, role;
            `;

            try {
                console.log('Inserting user into DB', { user_id, email: normalizedEmail, user_first_name, user_last_name, role });
                const userInsertResult = await query(insertUserSql, [user_id, normalizedEmail, user_first_name, user_last_name, role]);

                if (role === 'admin' && invitationCode) {
                    await deleteInvitationByCode(invitationCode);
                }

                const created = userInsertResult.rows && userInsertResult.rows[0] ? userInsertResult.rows[0] : null;

                if (!created) {
                    console.error('User insert returned no rows', { user_id, email: normalizedEmail, user_first_name, user_last_name, role });
                    return res.status(500).json({ error: 'Database error saving new user' });
                }

                return res.status(200).json({
                    message: "User registered successfully! Check your email for a confirmation link.",
                    user: created,
                    role: role
                });
            } catch (dbErr: unknown) {
                console.error('Database error inserting user:', dbErr, { sql: insertUserSql, params: [user_id, normalizedEmail, user_first_name, user_last_name, role] });
                const details = dbErr instanceof Error ? dbErr.message : String(dbErr);
                return res.status(500).json({ error: 'Database error saving new user', details });
            }
        }

        res.status(200).json({message: "User registered successfully! Check your email for a confirmation link.", user: data.user});

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({error: "Internal Server Error"});
    }
};

export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    try {
        const {data, error} = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if(error) return res.status(401).json({error: "Invalid email or password."});

        const dbUserResult = data.user?.id
            ? await query(
                `SELECT user_id, email, user_first_name, user_last_name, role FROM users WHERE user_id = $1 LIMIT 1`,
                [data.user.id]
            )
            : null;
        const dbUser = dbUserResult?.rows?.[0];

        if (data.session) {
            const userRole = dbUser?.role || data.user?.user_metadata?.role || 'patient';
            return res.status(200).json({
                message: "Login successful!",
                session: data.session,
                user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    role: userRole,
                    user_first_name: dbUser?.user_first_name || data.user?.user_metadata?.user_first_name,
                    user_last_name: dbUser?.user_last_name || data.user?.user_metadata?.user_last_name
                }
            });
        }

        res.status(401).json({error: "Login failed"});

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({error: "Internal Server Error"});
    }
}
