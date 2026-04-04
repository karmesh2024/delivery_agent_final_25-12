/**
 * Supabase Client and Service Router
 * هذا الملف يعمل الآن كمرجع مركزي (Router) لجميع وظائف Supabase المقسمة.
 * لا تقم بإضافة وظائف ضخمة هنا، بل أضفها في المجلد الفرعي ./supabase/
 */

// 1. التهيئة الأساسية (Client Instance)
export * from './supabase/base';

// 2. وظائف المناديب (Agents)
export * from './supabase/agents';

// 3. وظائف الطلبات (Orders)
export * from './supabase/orders';

// 4. إدارة المناطق الجغرافية (Geographic)
export * from './supabase/geographic';

// 5. إدارة المستندات والملفات (Documents)
export * from './supabase/documents';

// 6. استيراد المكونات الضرورية من base للاستخدام المحلي إذا لزم الأمر
import { supabase } from './supabase/base';

/**
 * وظائف مساعدة إضافية أو بقايا وظائف يتم نقلها تدريجياً
 */

// دالة لإنشاء كود تسليم فريد (إذا لم تكن موجودة في مكان آخر)
export function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// دالة لإنشاء كود إحالة
export function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${namePart}${randomPart}`;
}

// دالة مساعدة لإنشاء UUID
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// وظائف متعلقة بالمحافظ (تُقل لملف منفصل لاحقاً)
export async function getAgentWallets() {
  const { data, error } = await supabase!
    .from("wallets")
    .select("*")
    .eq("wallet_type", "AGENT");
  
  if (error) return [];
  return data || [];
}

export async function getWalletTransactions(walletId: string) {
  const { data, error } = await supabase!
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false });
  
  if (error) return [];
  return data || [];
}
