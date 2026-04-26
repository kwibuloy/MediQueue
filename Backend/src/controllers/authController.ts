import {Request, Response} from "express";
import {createClient} from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const register = async (req: Request, res: Response) => {
    const {email, password, role, fullName} = req.body;

    const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {full_name: fullName, role: role}
        }
    });

    if(error) return res.status(400).json({error: error.message});

    res.status(200).json({message: "User registered successfully! Check your email for a confirmation link.", user: data.user});
};

export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if(error) return res.status(401).json({error: "Invalid email or password."});

    res.status(200).json({message: "Login successful!", session: data.session});
}