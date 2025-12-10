export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string
                    email: string
                    phone: string
                    created_at: string | null
                    updated_at: string | null
                    links: string | null
                    experiences: string
                    projects: string
                    skills: string
                    education: string | null
                    certifications: string | null
                    languages: string | null
                    location: string | null
                    user_type: string | null
                    credits: number | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name: string
                    email: string
                    phone: string
                    created_at?: string | null
                    updated_at?: string | null
                    links?: string | null
                    experiences: string
                    projects: string
                    skills: string
                    education?: string | null
                    certifications?: string | null
                    languages?: string | null
                    location?: string | null
                    user_type?: string | null
                    credits?: number | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string
                    email?: string
                    phone?: string
                    created_at?: string | null
                    updated_at?: string | null
                    links?: string | null
                    experiences?: string
                    projects?: string
                    skills?: string
                    education?: string | null
                    certifications?: string | null
                    languages?: string | null
                    location?: string | null
                    user_type?: string | null
                    credits?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_profiles_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_feedback: {
                Row: {
                    id: string
                    user_id: string | null
                    feedback: string
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    feedback: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    feedback?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_feedback_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            generated_letters: {
                Row: {
                    id: string
                    user_id: string
                    job_description: string
                    cover_letter: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_description: string
                    cover_letter: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_description?: string
                    cover_letter?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "generated_letters_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stats: {
                Row: {
                    id: string
                    total_users: number
                    total_generated_letters: number
                    successful_compilations: number
                    failed_compilations: number
                    average_letters_per_user: number
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    total_users?: number
                    total_generated_letters?: number
                    successful_compilations?: number
                    failed_compilations?: number
                    average_letters_per_user?: number
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    total_users?: number
                    total_generated_letters?: number
                    successful_compilations?: number
                    failed_compilations?: number
                    average_letters_per_user?: number
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}