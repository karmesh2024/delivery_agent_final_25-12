import { tool } from 'ai';
import { z } from 'zod';

/**
 * أداة HITL (Human-In-The-Loop) للنشر على تليجرام.
 * 
 * ⚠️ مهم: لا توجد دالة execute هنا عن قصد!
 * في AI SDK v6، غياب execute مع OUTPUT=never يُبقي الأداة في حالة 'input-available'
 * مما يُوقف الوكيل وينتظر موافقة المستخدم عبر addToolOutput في الواجهة.
 */
export const telegramTool = tool({
  description: 'ينشر رسالة أو خبراً على قناة تليجرام المحددة. يجب أن يكون النص جذاباً ومناسباً. لا تقم باستدعاء هذه الأداة إلا إذا طلب المستخدم ذلك صراحةً. تتطلب موافقة المدير قبل النشر (بوابة HITL).',
  inputSchema: z.object({
    channelId: z.string().describe('معرف قناة التليجرام مثل @channelName'),
    content: z.string().describe('المحتوى النصي الذي سيتم نشره'),
  }),
  // ⛔ لا execute هنا → الحالة تبقى input-available → تظهر بوابة HITL للمدير
});
