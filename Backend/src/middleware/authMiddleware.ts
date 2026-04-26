import { Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) return res.status(401).json({error: "No token provided."});

    const {data: {user}, error} = await supabase.auth.getUser(token);

    if(error || !user) return res.status(401).json({error: "Invalid token."});

    (req as any).user = user;
    next();
};