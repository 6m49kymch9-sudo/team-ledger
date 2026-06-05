import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmmkiuggitfojkzryzrj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbWtpdWdnaXRmb2prenJ5enJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzY2OTcsImV4cCI6MjA5NjIxMjY5N30.tozi3c8MSaTwMR77RmUtQDJsKs0FdTXiwexYVDT09YY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          password_hash: string | null
          wechat_openid: string | null
          nickname: string
          avatar_url: string | null
          phone: string | null
          email_verified: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_admin: boolean
        }
        Insert: {
          id?: string
          email?: string
          password_hash?: string
          wechat_openid?: string
          nickname: string
          avatar_url?: string
          phone?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          wechat_openid?: string
          nickname?: string
          avatar_url?: string
          phone?: string
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string
          is_admin?: boolean
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          invite_code: string
          owner_id: string
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          avatar_url?: string
          invite_code: string
          owner_id: string
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          avatar_url?: string
          invite_code?: string
          owner_id?: string
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          nickname: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          nickname?: string
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          nickname?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          team_id: string
          user_id: string
          date: string
          amount: number
          category: string
          description: string | null
          image_url: string | null
          project_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          date: string
          amount: number
          category: string
          description?: string
          image_url?: string
          project_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          date?: string
          amount?: number
          category?: string
          description?: string
          image_url?: string
          project_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
