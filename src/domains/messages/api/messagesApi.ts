import { supabase } from '@/lib/supabase';
import { Conversation, Message, Agent } from '@/types';

/**
 * واجهات قاعدة البيانات - وفقاً لمخطط SQL
 */

// واجهة جدول المحادثات
interface DbConversation {
  id: string;
  title?: string;
  delivery_order_id?: string;
  conversation_type: string;
  last_message?: string;
  last_message_time: string;
  is_active: boolean;
  created_by: string;
  created_by_type: string;
  created_at: string;
  updated_at: string;
}

// واجهة جدول مشاركي المحادثات
interface DbConversationParticipant {
  id: string;
  conversation_id: string;
  delivery_boy_id?: string;
  customer_id?: string;
  admin_id?: string;
  participant_type: 'delivery_boy' | 'customer' | 'admin';
  is_muted: boolean;
  unread_count: number;
  last_read_time?: string;
  is_active: boolean;
  joined_at: string;
}

// واجهة جدول الرسائل
interface DbMessage {
  id: string;
  conversation_id: string;
  sender_delivery_boy_id?: string;
  sender_customer_id?: string;
  sender_admin_id?: string;
  sender_type: 'delivery_boy' | 'customer' | 'admin' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'file' | 'location' | 'voice' | 'system';
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id?: string;
  metadata?: Record<string, unknown>;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

// واجهة نتيجة البحث عن المحادثات
interface ConversationQueryResult {
  id: string;
  conversation_id: string;
  participant_type: string;
  unread_count: number;
  conversations: {
    id: string;
    title?: string;
    delivery_order_id?: string;
    conversation_type: string;
    last_message?: string;
    last_message_time: string;
    is_active: boolean;
    created_by: string;
    created_by_type: string;
    created_at: string;
    updated_at: string;
  } | {
    id: string;
    title?: string;
    delivery_order_id?: string;
    conversation_type: string;
    last_message?: string;
    last_message_time: string;
    is_active: boolean;
    created_by: string;
    created_by_type: string;
    created_at: string;
    updated_at: string;
  }[];
}

/**
 * واجهة API موحدة للتعامل مع بيانات الرسائل
 * تعمل كطبقة وسيطة بين شريحة Redux وقاعدة البيانات
 */
export const messagesApi = {
  /**
   * جلب جميع المحادثات للمستخدم الحالي
   * @param participantId معرف المشارك (المندوب أو العميل أو الإداري)
   * @param participantType نوع المشارك ('delivery_boy', 'customer', 'admin')
   * @returns وعد يحتوي على مصفوفة من المحادثات
   */
  getConversations: async (
    participantId: string,
    participantType = 'delivery_boy'
  ): Promise<Conversation[]> => {
    try {
      // في البيئة التطويرية، استخدم البيانات الوهمية
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        // استيراد البيانات الوهمية بشكل مكسول (lazy import)
        const { mockConversations } = await import('../data/mock-data');
        console.log('DEV MODE: Using mock conversations data');
        return mockConversations;
      }
      
      // بناء استعلام قاعدة البيانات
      if (!supabase) {
        console.error("Supabase client is not initialized");
        return [];
      }
      
      // بناء استعلام حسب نوع المشارك (مندوب، عميل، مشرف)
      let query = supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          participant_type,
          unread_count,
          conversations:conversation_id (
            id,
            title,
            delivery_order_id,
            conversation_type,
            last_message,
            last_message_time,
            is_active,
            created_by,
            created_by_type,
            created_at,
            updated_at
          )
        `)
        .eq('is_active', true);
      
      // إضافة شرط البحث حسب نوع المشارك
      if (participantType === 'delivery_boy') {
        query = query.eq('delivery_boy_id', participantId);
      } else if (participantType === 'customer') {
        query = query.eq('customer_id', participantId);
      } else if (participantType === 'admin') {
        query = query.eq('admin_id', participantId);
      }
      
      // تنفيذ الاستعلام
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // تحويل البيانات إلى الشكل المتوقع
      const conversations: Conversation[] = data.map((item: ConversationQueryResult) => {
        // استخراج بيانات المحادثة (إما كائن مفرد أو أول عنصر في المصفوفة)
        const conversationData = Array.isArray(item.conversations) 
          ? item.conversations[0] 
          : item.conversations;
          
        // استخراج معرف الشخص الآخر في المحادثة (المندوب أو العميل)
        let agentId = '';
        
        // إذا كان المستخدم عميلًا، استخدم معرف الطلب أو المندوب كمعرف
        if (participantType === 'customer') {
          agentId = conversationData.delivery_order_id || 'agent-id'; // يجب استرداد معرف المندوب من مشاركي المحادثة
        } else {
          // للإداريين والمندوبين، استخدم معرف المندوب نفسه أو معرف العميل
          agentId = participantId;
        }
        
        return {
          id: item.conversation_id,
          agentId: agentId,
          lastMessage: conversationData.last_message || '',
          timestamp: new Date(conversationData.last_message_time),
          unread: item.unread_count > 0,
          type: conversationData.conversation_type
        };
      });
      
      console.log('Messages API - Fetched conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('Messages API Error - getConversations:', error);
      // إعادة قائمة فارغة في حالة الخطأ
      return [];
    }
  },
  
  /**
   * جلب رسائل محادثة محددة
   * @param conversationId معرف المحادثة
   * @returns وعد يحتوي على مصفوفة من الرسائل
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      // في البيئة التطويرية، استخدم البيانات الوهمية
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        // استيراد البيانات الوهمية بشكل مكسول (lazy import)
        const { mockMessages } = await import('../data/mock-data');
        console.log('DEV MODE: Using mock messages data');
        return mockMessages.filter(m => m.conversationId === conversationId);
      }
      
      if (!supabase) {
        console.error("Supabase client is not initialized");
        return [];
      }
      
      // استعلام عن الرسائل مع استبعاد الرسائل المحذوفة
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_delivery_boy_id,
          sender_customer_id,
          sender_admin_id,
          sender_type,
          content,
          message_type,
          is_edited,
          is_deleted,
          reply_to_id,
          metadata,
          sent_at,
          created_at,
          updated_at
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('sent_at', { ascending: true });
      
      if (error) throw error;
      
      // تحويل البيانات إلى الشكل المتوقع
      const messages: Message[] = data.map((item) => {
        // تحديد معرف المرسل بناءً على نوع المرسل
        let senderId = 'system'; // القيمة الافتراضية
        if (item.sender_type === 'delivery_boy' && item.sender_delivery_boy_id) {
          senderId = item.sender_delivery_boy_id;
        } else if (item.sender_type === 'customer' && item.sender_customer_id) {
          senderId = item.sender_customer_id;
        } else if (item.sender_type === 'admin' && item.sender_admin_id) {
          senderId = item.sender_admin_id;
        }
        
        return {
          id: item.id,
          conversationId: item.conversation_id,
          senderId: senderId,
          content: item.content,
          timestamp: new Date(item.sent_at),
          isRead: true, // سنفترض أن الرسائل مقروءة عند الجلب
          messageType: item.message_type,
          metadata: item.metadata,
          replyToId: item.reply_to_id
        };
      });
      
      console.log('Messages API - Fetched messages for conversation:', conversationId, messages.length);
      return messages;
    } catch (error) {
      console.error('Messages API Error - getMessages:', error);
      // إعادة قائمة فارغة في حالة الخطأ
      return [];
    }
  },
  
  /**
   * إرسال رسالة جديدة
   * @param message الرسالة المراد إرسالها
   * @returns وعد يحتوي على الرسالة المرسلة
   */
  sendMessage: async (message: {
    conversationId: string;
    senderId: string;
    content: string;
    replyToId?: string;
    messageType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Message> => {
    try {
      // في البيئة التطويرية، محاكاة إرسال الرسالة
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log('DEV MODE: Simulating sending message');
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // إنشاء رسالة وهمية
        const mockMessage: Message = {
          id: `m${Date.now()}`,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          timestamp: new Date(),
          isRead: false,
          messageType: message.messageType || 'text',
          metadata: message.metadata,
          replyToId: message.replyToId
        };
        
        return mockMessage;
      }
      
      // تحديد نوع المرسل من معرف المرسل (هذا مثال بسيط، يمكن تحسينه)
      // يجب تحديد نوع المستخدم بشكل أفضل بناءً على نظام المصادقة
      const senderType = message.senderId.startsWith('admin') ? 'admin' : 
                        (message.senderId.startsWith('agent') ? 'delivery_boy' : 'customer');
      
      if (!supabase) {
        console.error("Supabase client is not initialized");
        throw new Error("Supabase client is not initialized");
      }
      
      // تحضير بيانات الرسالة حسب نوع المرسل
      const messageData: {
        conversation_id: string;
        content: string;
        message_type: string;
        sender_delivery_boy_id?: string;
        sender_customer_id?: string;
        sender_admin_id?: string;
        sender_type: string;
        reply_to_id?: string;
        metadata?: Record<string, unknown>;
      } = {
        conversation_id: message.conversationId,
        content: message.content,
        message_type: message.messageType || 'text',
        sender_type: senderType,
        reply_to_id: message.replyToId
      };
      
      // إضافة معرف المرسل المناسب حسب النوع
      if (senderType === 'delivery_boy') {
        messageData.sender_delivery_boy_id = message.senderId;
      } else if (senderType === 'customer') {
        messageData.sender_customer_id = message.senderId;
      } else if (senderType === 'admin') {
        messageData.sender_admin_id = message.senderId;
      }
      
      // إضافة البيانات الوصفية إذا كانت موجودة
      if (message.metadata) {
        messageData.metadata = message.metadata;
      }
      
      // إدراج الرسالة الجديدة
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      
      // تحويل البيانات إلى الشكل المتوقع
      const newMessage: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: message.senderId,
        content: data.content,
        timestamp: new Date(data.sent_at || Date.now()),
        isRead: false,
        messageType: data.message_type,
        metadata: data.metadata,
        replyToId: data.reply_to_id
      };
      
      console.log('Messages API - Sent message:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('Messages API Error - sendMessage:', error);
      throw error;
    }
  },
  
  /**
   * تعليم الرسائل كمقروءة باستخدام وظيفة قاعدة البيانات المخصصة
   * @param conversationId معرف المحادثة
   * @param participantId معرف المشارك
   * @param participantType نوع المشارك ('delivery_boy', 'customer', 'admin')
   * @returns وعد يحتوي على نتيجة العملية
   */
  markAsRead: async (
    conversationId: string,
    participantId: string,
    participantType = 'delivery_boy'
  ): Promise<{ success: boolean }> => {
    try {
      // في البيئة التطويرية، محاكاة تعليم الرسائل كمقروءة
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log('DEV MODE: Simulating marking messages as read');
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
      }
      
      if (!supabase) {
        console.error("Supabase client is not initialized");
        return { success: false };
      }
      
      // استدعاء الدالة المخزنة في قاعدة البيانات
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_participant_id: participantId,
        p_participant_type: participantType
      });
      
      if (error) throw error;
      
      console.log('Messages API - Marked messages as read in conversation:', conversationId);
      return { success: true };
    } catch (error) {
      console.error('Messages API Error - markAsRead:', error);
      return { success: false };
    }
  },
  
  /**
   * إنشاء محادثة جديدة بين أطراف مختلفة
   * @param participants مصفوفة من المشاركين في المحادثة
   * @param options خيارات إضافية (مثل نوع المحادثة ومعرف الطلب)
   * @param initialMessage الرسالة الأولى في المحادثة (اختيارية)
   * @returns وعد يحتوي على المحادثة المنشأة
   */
  createConversation: async (
    participants: Array<{ id: string; type: string }>,
    options: {
      title?: string;
      deliveryOrderId?: string;
      conversationType?: string;
    } = {},
    initialMessage?: string
  ): Promise<Conversation> => {
    try {
      // في البيئة التطويرية، محاكاة إنشاء محادثة
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log('DEV MODE: Simulating conversation creation');
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // إنشاء محادثة وهمية
        const mockConversation: Conversation = {
          id: `c${Date.now()}`,
          agentId: participants.find(p => p.type === 'delivery_boy')?.id || participants[0].id,
          lastMessage: initialMessage || '',
          timestamp: new Date(),
          unread: false,
          type: options.conversationType || 'standard'
        };
        
        return mockConversation;
      }
      
      if (!supabase) {
        console.error("Supabase client is not initialized");
        throw new Error("Supabase client is not initialized");
      }
      
      // إذا كان هناك معرف طلب توصيل، استخدم وظيفة إنشاء محادثة للطلب
      if (options.deliveryOrderId) {
        const createdBy = participants[0];
        
        // استدعاء الدالة المخزنة
        const { data: conversationId, error } = await supabase.rpc('create_conversation_for_order', {
          p_delivery_order_id: options.deliveryOrderId,
          p_created_by_id: createdBy.id,
          p_created_by_type: createdBy.type
        });
        
        if (error) throw error;
        
        // الحصول على تفاصيل المحادثة التي تم إنشاؤها
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
          
        if (convError) throw convError;
        
        // إنشاء وإعادة كائن المحادثة
        const newConversation: Conversation = {
          id: convData.id,
          agentId: participants.find(p => p.type === 'delivery_boy')?.id || participants[0].id,
          lastMessage: convData.last_message || '',
          timestamp: new Date(convData.last_message_time || convData.created_at),
          unread: false,
          type: convData.conversation_type
        };
        
        console.log('Messages API - Created order conversation:', newConversation);
        return newConversation;
      }
      
      // إنشاء محادثة عادية إذا لم يكن هناك معرف طلب
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          title: options.title,
          conversation_type: options.conversationType || 'standard',
          created_by: participants[0].id,
          created_by_type: participants[0].type,
          last_message: initialMessage || ''
        })
        .select()
        .single();
      
      if (conversationError) throw conversationError;
      
      // إضافة المشاركين للمحادثة
      for (const participant of participants) {
        const participantData: {
          conversation_id: string;
          participant_type: string;
          delivery_boy_id?: string;
          customer_id?: string;
          admin_id?: string;
        } = {
          conversation_id: conversationData.id,
          participant_type: participant.type
        };
        
        // إضافة معرف المشارك المناسب حسب النوع
        if (participant.type === 'delivery_boy') {
          participantData.delivery_boy_id = participant.id;
        } else if (participant.type === 'customer') {
          participantData.customer_id = participant.id;
        } else if (participant.type === 'admin') {
          participantData.admin_id = participant.id;
        }
        
        const { error: participantError } = await supabase
          .from('conversation_participants')
          .insert(participantData);
        
        if (participantError) throw participantError;
      }
      
      // إضافة الرسالة الأولية إذا وجدت
      if (initialMessage) {
        const sender = participants[0];
        
        // تحديد حقول المرسل المناسبة
        const senderFields: {
          sender_delivery_boy_id?: string;
          sender_customer_id?: string;
          sender_admin_id?: string;
          sender_type: string;
        } = {
          sender_type: sender.type
        };
        
        if (sender.type === 'delivery_boy') {
          senderFields.sender_delivery_boy_id = sender.id;
        } else if (sender.type === 'customer') {
          senderFields.sender_customer_id = sender.id;
        } else if (sender.type === 'admin') {
          senderFields.sender_admin_id = sender.id;
        }
        
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationData.id,
            ...senderFields,
            content: initialMessage,
            message_type: 'text'
          });
      }
      
      // البحث عن المندوب المشارك (إذا وجد)
      const deliveryBoyParticipant = participants.find(p => p.type === 'delivery_boy');
      
      const newConversation: Conversation = {
        id: conversationData.id,
        agentId: deliveryBoyParticipant ? deliveryBoyParticipant.id : participants[0].id,
        lastMessage: initialMessage || '',
        timestamp: new Date(conversationData.last_message_time || conversationData.created_at || Date.now()),
        unread: false,
        type: conversationData.conversation_type
      };
      
      console.log('Messages API - Created conversation:', newConversation);
      return newConversation;
    } catch (error) {
      console.error('Messages API Error - createConversation:', error);
      throw error;
    }
  }
};