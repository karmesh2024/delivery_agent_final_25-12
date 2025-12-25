/**
 * أنواع بيانات نطاق الرسائل
 * 
 * نستورد جميع الأنواع من الملف المركزي للمشروع
 */

import { Agent, Message, Conversation, MessagesState } from "@/types";

/**
 * خصائص مكون الرسالة
 */
export interface MessageProps {
  message: Message;
  isAdmin: boolean;
}

// إعادة تصدير الأنواع المستوردة من أجل التوافقية الخلفية
export type { Message, Conversation, MessagesState };