import { tool } from 'ai';
import { z } from 'zod';

/**
 * أداة HITL (Human-In-The-Loop) للنشر في غرف النادي.
 * 
 * ⚠️ مهم: لا توجد دالة execute هنا عن قصد!
 * في AI SDK v6، غياب execute مع OUTPUT=never يُبقي الأداة في حالة 'input-available'
 * مما يُوقف الوكيل وينتظر موافقة المستخدم عبر addToolOutput في الواجهة.
 */
export const publishToRoomTool = tool({
  description: 'ينشر محتوى (صورة، نص، أو خبر) في غرف النادي المختارة. الغرف المتاحة حالياً: حينا، بيوتنا، مطبخنا، صحتنا، أطفالنا، رياضتنا، وغيرها. يتطلب موافقة المدير أولاً (بوابة HITL).',
  inputSchema: z.object({
    roomName: z.enum(['حينا', 'بيوتنا', 'مطبخنا', 'صحتنا', 'أطفالنا', 'ثقافتنا', 'رياضتنا', 'نجاحاتنا']).describe('اسم الغرفة المراد النشر فيها'),
    content: z.string().describe('المحتوى النصي الذي سيتم نشره في الغرفة'),
  }),
  // ⛔ لا execute هنا → الحالة تبقى input-available → تظهر بوابة HITL للمدير
});
