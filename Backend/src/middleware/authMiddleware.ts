import { Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) return res.status(401).json({error: "No token provided."});

    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if(!decoded) return res.status(401).json({error: "Invalid token format."});

    const {data: {user}, error} = await supabase.auth.getUser(token);
    if(error || !user) {
        console.log('Supabase error:', error);
        return res.status(401).json({error: "Invalid token."});
    }

    const userRole = user.user_metadata?.role;
    if(!userRole) return res.status(401).json({error: "Role not found in user metadata"});

    (req as any).user = user;
    (req as any).userRole = userRole;
    next();
};

export const requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).userRole;

        if (!userRole) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (userRole !== requiredRole) {
            return res.status(403).json({ error: 'Forbidden: insufficient role.' });
        }

        next();
    };
};