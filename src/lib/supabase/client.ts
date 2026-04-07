import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * 🔒 Singleton Supabase Client (For Client Components)
 * يستخدم createBrowserClient من @supabase/ssr لضمان التوافق مع supabase-js v2
 * ملاحظة: createClientComponentClient من auth-helpers-nextjs@0.10 يخزن الكوكيز
 * بصيغة base64- غير متوافقة مع supabase-js@2.49+ مما يسبب خطأ:
 * "Failed to parse cookie string: base64-eyJ..."
 */
export const createClient = () => {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
