import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (auto-generated from schema)
export type Profile = {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  user_id: string
  title: string
  original_filename: string
  pdf_url: string
  cover_url?: string
  total_pages: number
  file_size?: number
  category?: 'philippines' | 'internal' | 'international' | 'ph_interns'
  is_favorite: boolean
  summary?: string
  created_at: string
  updated_at: string
}

export type ReadingProgress = {
  id: string
  user_id: string
  book_id: string
  current_page: number
  last_read_at: string
}
