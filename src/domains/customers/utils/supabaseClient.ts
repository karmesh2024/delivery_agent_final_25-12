import { supabase } from '@/lib/supabase'; // استيراد المثيل الموجود

// تم إزالة تهيئة createClient من هنا
// المفاتيح يجب أن تأتي من متغيرات البيئة فقط - لا تضع مفاتيح حقيقية هنا أبداً
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// console.log('تهيئة Supabase مع URL:', supabaseUrl);
// console.log('هل مفتاح API مُعرّف:', !!supabaseKey);

// const supabase = createClient(supabaseUrl, supabaseKey); // تم إزالة هذا

// دالة للتحقق من صحة اتصال Supabase (يمكن تركها إذا كانت تستخدم المثيل الجديد)
export async function testSupabaseConnection(): Promise<boolean> {
  console.log('جاري اختبار اتصال Supabase (من customers/utils)...');
  if (!supabase) {
    console.error('Supabase client is not initialized in @/lib/supabase.ts');
    return false;
  }
  try {
    const { count, error } = await supabase
      .from('customers') // تأكد أن الجدول 'customers' موجود أو استبدله بجدول آخر صالح
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('خطأ في اتصال Supabase (من customers/utils):', error.message);
      return false;
    }
    
    console.log('اتصال Supabase ناجح (من customers/utils). عدد الصفوف (مثال):', count);
    return true;
  } catch (err) {
    console.error('فشل اتصال Supabase (من customers/utils):', err);
    return false;
  }
}

export default supabase; // إعادة تصدير المثيل الموجود 