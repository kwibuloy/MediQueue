import {Request, Response} from "express";
import {createClient} from "@supabase/supabase-js";
import { query } from "../config/database.js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const register = async (req: Request, res: Response) => {
    const {email, password, user_first_name, user_last_name} = req.body;

    // Validate input
    if (!email || !password || !user_first_name || !user_last_name) {
        return res.status(400).json({error: "email, password, user_first_name, and user_last_name are required"});
    }

    try {
        // Check if email has a pending admin invitation
        let role = 'patient';
        let doctor_id = null;
        
        const invitationCheckSql = `SELECT invitation_id FROM admin_invitations WHERE email = $1`;
        const invitationResult = await query(invitationCheckSql, [email]);
        
        if (invitationResult.rows.length > 0) {
            role = 'admin';
        }

        // Register with Supabase Auth
        const {data, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    user_first_name,
                    user_last_name,
                    role: role
                }
            }
        });

        if(error) return res.status(400).json({error: error.message});

        // If auth successful, create user entry in database
        if (data.user) {
            const user_id = data.user.id;
            
            const insertUserSql = `
                INSERT INTO users (user_id, email, user_first_name, user_last_name, role)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT(user_id) DO UPDATE
                SET email = $2, user_first_name = $3, user_last_name = $4, role = $5
                RETURNING user_id, email, user_first_name, user_last_name, role;
            `;
            
            const userInsertResult = await query(insertUserSql, [user_id, email, user_first_name, user_last_name, role]);
            
            // If user was an admin invitee, delete the invitation record
            if (role === 'admin') {
                const deleteInvitationSql = `DELETE FROM admin_invitations WHERE email = $1`;
                await query(deleteInvitationSql, [email]);
            }

            return res.status(200).json({
                message: "User registered successfully! Check your email for a confirmation link.",
                user: userInsertResult.rows[0],
                role: role
            });
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

        // Fetch user metadata for complete response
        if (data.session) {
            const userRole = data.user?.user_metadata?.role || 'patient';
            return res.status(200).json({
                message: "Login successful!",
                session: data.session,
                user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    role: userRole,
                    user_first_name: data.user?.user_metadata?.user_first_name,
                    user_last_name: data.user?.user_metadata?.user_last_name
                }
            });
        }

        res.status(401).json({error: "Login failed"});

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({error: "Internal Server Error"});
    }
}