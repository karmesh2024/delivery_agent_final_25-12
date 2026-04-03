import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type MemoryType = 'preference' | 'task' | 'conversation';

export interface MemoryItem {
  id?: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  tags?: string[];
  created_at?: Date;
}

/**
 * مدير الذاكرة للوكيل (مرحلة التخزين والاسترجاع)
 */
export const MemoryManager = {
  
  /**
   * حفظ معلومة جديدة للوكيل
   */
  async saveMemory(userId: string, type: MemoryType, content: string, tags: string[] = []): Promise<MemoryItem> {
    try {
      const memory = await (prisma as any).agent_memory.create({
        data: {
          user_id: userId,
          memory_type: type,
          content,
          tags,
          is_active: true
        }
      });
      console.info(`[MemoryManager] 💾 تم حفظ ذاكرة جديدة للـ User: ${userId} | نوع: ${type}`);
      return memory as MemoryItem;
    } catch (error) {
      console.error('[MemoryManager] ❌ فشل في حفظ الذاكرة:', error);
      throw new Error('لم أتمكن من حفظ هذه المعلومة في ذاكرتي.');
    }
  },

  /**
   * استرجاع معلومات المستخدم النشطة 
   * (يمكن تخصيص الاسترجاع حسب النوع لاحقاً)
   */
  async retrieveMemories(userId: string, type?: MemoryType): Promise<MemoryItem[]> {
    try {
      const whereClause: any = { 
        user_id: userId, 
        is_active: true 
      };
      
      if (type) {
        whereClause.memory_type = type;
      }

      const memories = await (prisma as any).agent_memory.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: 10 // نأخذ أحدث 10 ذكريات لعدم إرباك الـ Token Limit
      });
      
      return memories as MemoryItem[];
    } catch (error) {
      console.error('[MemoryManager] ❌ فشل في استرجاع الذاكرة:', error);
      return [];
    }
  },

  /**
   * مسح ذاكرة محددة (إلغاء تنشيط)
   */
  async forgetMemory(memoryId: string): Promise<boolean> {
    try {
      await (prisma as any).agent_memory.update({
        where: { id: memoryId },
        data: { is_active: false }
      });
      console.info(`[MemoryManager] 🗑️ تم نسيان الذاكرة: ${memoryId}`);
      return true;
    } catch (error) {
      console.error('[MemoryManager] ❌ فشل في نسيان الذاكرة:', error);
      return false;
    }
  }
};
