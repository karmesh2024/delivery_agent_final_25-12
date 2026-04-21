import { tool } from 'ai';
import { z } from 'zod';
import { MemoryManager } from '@/domains/zoon-os/memory/memory-manager';

const saveMemorySchema = z.object({
  memory_type: z.enum(['preference', 'task', 'conversation']).describe('نوع المعلومة: preference (تفضيلات), task (مهمة/أمر), conversation (سياق عام)'),
  content: z.string().describe('المعلومة أو التفاصيل المراد للوكيل حفظها وتذكرها'),
  tags: z.array(z.string()).optional().describe('كلمات دلالية للبحث (مثال: "اسمي", "مندوب", "تقارير")')
});

/**
 * مهارة (Tool) يمكن للذكاء الاصطناعي استخدامها بنفسه 
 * لحفظ طلبات أو معلومات المستخدم لتذكرها للمستقبل.
 */
export const memoryTool = tool({
  description: 'احفظ معلومة هامة أخبرك بها المستخدم (مثل اسمه، طريقة رد معينة، أو مهام مؤجلة) لتتذكرها وتستخدمها للرد عليه في المحادثات القادمة.',
  inputSchema: saveMemorySchema,
  execute: async (input: any, context?: { userId?: string; toolCallId?: string; messages?: any[] }) => {
    try {
      const USER_ID = context?.userId || input.userId;
      if (!USER_ID || USER_ID === 'admin-user-id') {
        console.error('[memoryTool] userId missing — memory not saved');
        return { status: 'error', message: 'لم يتم تحديد هوية المستخدم لحفظ الذاكرة' };
      }

      const savedMemory = await MemoryManager.saveMemory(
        USER_ID, 
        input.memory_type, 
        input.content, 
        input.tags || []
      );

      return {
        status: 'success',
        message: 'تم حفظ المعلومة في ذاكرة Zoon بنجاح. أستطيع أن أتذكرها الآن!',
        saved_id: savedMemory.id
      };
    } catch (err: any) {
      console.error('[Memory Tool] الخطأ:', err.message);
      return { 
        status: 'error', 
        message: 'حدث خطأ أثناء محاولة حفظ المعلومة في الذاكرة.' 
      };
    }
  }
});
