import { createClient } from '@supabase/supabase-js';
import { detectUserPatterns } from './patternDetector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 👁️‍🗨️ الاستباقية: تستدعى هذه الدالة قبل بدء المحادثة مع النظام،
 * لترى إذا ما كان لدى المستخدم عادات أو أسئلة מתكررة في مثل هذا اليوم من الأسبوع.
 */
export async function getProactiveContext(userId: string): Promise<string> {
  const todayDate = new Date();
  const currentDay = todayDate.getDay(); // 0 = الأحد, 4 = الخميس, 5 = الجمعة
  
  const patterns = await detectUserPatterns(userId);
  
  // هل في نمط متوقع اليوم؟
  const todayPattern = patterns.find(p => p.commonDayOfWeek === currentDay);
  
  if (todayPattern) {
    // يمكن هنا حقن جواب محفوظ، لكن كبداية سنحقن هذه النصيحة في الـ Context للوكيل
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `💡 [معلومة استباقية من الذاكرة العرضية]: المستخدم يسأل عادة عن "${todayPattern.query}" في يوم ${days[currentDay]}. إذا كانت هناك بيانات متاحة، تطوع بطرحها فوراً.`;
  }
  
  return '';
}
