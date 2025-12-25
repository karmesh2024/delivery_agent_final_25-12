import { createClient, SupabaseClient } from '@supabase/supabase-js';

// تعريف نوع Database البسيط إذا لم يكن مشتركًا بالفعل
// يمكنك استيراده من ملف supabase.ts إذا كان معرفًا هناك بشكل عام
interface Database {
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
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  console.error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// تهيئة عميل Supabase الخاص بالخادم
// هذا العميل يجب أن يستخدم حصريًا في سياق الخادم (API routes, server-side functions)
// لأنه يستخدم مفتاح service_role الذي يتجاوز سياسات RLS.
const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

export { supabaseAdmin }; 