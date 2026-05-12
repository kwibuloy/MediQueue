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

    // Attach user info to request
    // user.id is the UUID
    // user.sub is also the UUID (standardized JWT claim)
    (req as any).user = user;
    (req as any).userRole = userRole;
    next();
};

/**
 * Middleware to require a specific role
 * Usage: router.get('/admin-only', authenticateUser, requireRole('admin'), handler)
 */
export const requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).userRole;

        if (!userRole) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (userRole !== requiredRole) {
            return res.status(403).json({ error: `Forbidden: this action requires ${requiredRole} role.` });
        }

        next();
    };
};

/**
 * Middleware to require one of multiple roles
 * Usage: router.get('/admin-or-doctor', authenticateUser, requireRoles(['admin', 'doctor']), handler)
 */
export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).userRole;

        if (!userRole) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: `Forbidden: insufficient role. Required one of: ${allowedRoles.join(', ')}` });
        }

        next();
    };
};