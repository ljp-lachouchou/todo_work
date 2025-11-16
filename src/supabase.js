// src/supabase.js

import { createClient } from '@supabase/supabase-js'

// 使用 Vite 环境变量来获取 Supabase URL 和 Anon Key
const supabaseUrl = "https://fwspihuenebdqjtgwshw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3c3BpaHVlbmViZHFqdGd3c2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzcwNjEsImV4cCI6MjA3ODg1MzA2MX0.mEgPRJAobhryG8c3M2n4XfvEDctdL79aebN2PqFMwFY"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)