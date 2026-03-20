import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string
  display_name: string
  birth_date: string
  birth_time?: string
  birth_city?: string
  birth_country?: string
  birth_lat?: number
  birth_lng?: number
  sun_sign: string
  moon_sign?: string
  rising_sign?: string
  element?: string
  bio?: string
  purpose: 'romantic' | 'friendship' | 'both'
  gender?: string
  looking_for?: string[]
  photos?: string[]
  current_lat?: number
  current_lng?: number
  location_city?: string
  location_country?: string
  travel_mode?: boolean
  travel_city?: string
  show_location?: boolean
  search_radius_km?: number
  language: string
  is_verified: boolean
  is_premium: boolean
  profile_complete: boolean
  created_at: string
  last_active: string
}

export type BirthChart = {
  id: string
  user_id: string
  sun_sign?: string
  sun_degree?: number
  sun_house?: number
  moon_sign?: string
  moon_degree?: number
  moon_house?: number
  rising_sign?: string
  mercury_sign?: string
  venus_sign?: string
  venus_degree?: number
  mars_sign?: string
  mars_degree?: number
  jupiter_sign?: string
  saturn_sign?: string
  chart_data?: any
}

export type Match = {
  id: string
  user_a: string
  user_b: string
  compat_score: number
  is_active: boolean
  matched_at: string
  profile?: Profile // joined
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'gif' | 'ai_suggestion'
  read_at?: string
  created_at: string
}

export type AnonQuestion = {
  id: string
  sender_id: string
  receiver_id: string
  question: string
  answer?: string
  status: 'pending' | 'answered' | 'ignored'
  sender_revealed: boolean
  converted_to_match?: string
  created_at: string
  answered_at?: string
  sender_profile?: Profile // joined when revealed or for receiver
}

export type Notification = {
  id: string
  user_id: string
  type: 'match' | 'message' | 'anon_question' | 'anon_answer' | 'daily'
  title: string
  body: string
  data?: any
  read_at?: string
  created_at: string
}

export type DailyHoroscope = {
  id: string
  sign: string
  date: string
  language: string
  general?: string
  love?: string
  energy?: string
  do_today?: string[]
  dont_today?: string[]
  lucky_number?: number
  lucky_color?: string
  mood?: string
}
