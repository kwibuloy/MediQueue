// User type definitions
export interface User {
    user_id: string; // UUID from Supabase Auth
    email: string;
    user_first_name: string;
    user_last_name: string;
    role: 'patient' | 'admin';
    created_at?: Date;
    updated_at?: Date;
}

// Doctor type definitions
export interface Doctor {
    doctor_id: string | number;
    doctor_first_name: string;
    doctor_last_name: string;
    specialization: string;
    is_available: boolean;
    room_number?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Queue Entry type definitions
export interface QueueEntry {
    queue_id: string;
    user_id: string; // UUID from users table
    doctor_id: string | number;
    ticket_number: number;
    status: 'waiting' | 'called' | 'in-consultation' | 'served' | 'cancelled';
    created_at: Date;
    updated_at?: Date;
}

// Admin Queue View type (for fetching with patient details)
export interface AdminQueueView {
    queue_id: string;
    ticket_number: number;
    patient_name: string;
    status: string;
    arrival_time: string;
}

// Patient Status view
export interface PatientStatus {
    queue_id: string;
    ticket_number: number;
    status: string;
    position_in_queue?: number;
}

// Queue History view
export interface QueueHistoryView {
    id: string;
    ticket_number: number;
    status: string;
    created_at: Date;
    doctor_id: string | number;
    doctor_name: string;
    doctor_specialization: string;
    doctor_room?: string;
}

// Admin Invitation type
export interface AdminInvitation {
    invitation_id: string;
    email: string;
    created_at: Date;
    expires_at?: Date;
}

// Auth Request/Response types
export interface RegisterRequest {
    email: string;
    password: string;
    user_first_name: string;
    user_last_name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    user?: User;
    role?: string;
    session?: any;
}

// Supabase Auth User (for internal use)
export interface SupabaseUser {
    id: string; // UUID
    email: string;
    user_metadata?: {
        user_first_name?: string;
        user_last_name?: string;
        role?: string;
    };
    [key: string]: any;
}
