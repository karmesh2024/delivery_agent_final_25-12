import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { logger } from "../logger-safe";

// تعريف نوع Database البسيط
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
  );
} else {
  logger.error("Supabase URL or Anon Key not found. Client not initialized.");
}

export const supabase = supabaseInstance;

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let supabaseServiceRoleInstance: SupabaseClient<Database> | null = null;

const isServer = typeof window === "undefined";

if (isServer) {
  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServiceRoleInstance = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );
  }
}

export const supabaseServiceRole = supabaseServiceRoleInstance;
