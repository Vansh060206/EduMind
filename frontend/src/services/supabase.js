import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://yrobekfjnhvmorqvqecp.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyb2Jla2Zqbmh2bW9ycXZxZWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzMwNjgsImV4cCI6MjA5NTY0OTA2OH0.W5ouUu_01oiPdlS6QSr4lH2pOUN0ia-NTmugwhd5MZc";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {

      persistSession: true,

      autoRefreshToken: true,

      detectSessionInUrl: true,

      flowType: "implicit",

    },
  }
);