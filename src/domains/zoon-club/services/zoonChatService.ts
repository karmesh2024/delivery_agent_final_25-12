import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  circle_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  message_type: 'TEXT' | 'IMAGE' | 'VOICE' | 'SYSTEM';
  created_at: string;
  sender_details?: {
    name: string;
    avatar_url: string;
  };
  is_mine?: boolean; // هل هذه الرسالة لي؟ (للتنسيق)
}

export const zoonChatService = {
  
  /**
   * 📤 إرسال رسالة نصية
   */
  sendMessage: async (circleId: string, content: string, senderId: string) => {
    const { data, error } = await supabase!
      .from('zoon_circle_messages')
      .insert({
        circle_id: circleId,
        sender_id: senderId,
        content: content,
        message_type: 'TEXT'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 📜 جلب الرسائل السابقة (مع الترحيل Pagination إذا لزم الأمر)
   */
  getMessages: async (circleId: string, limit = 50) => {
    // 1. جلب الرسائل
    const { data: messages, error } = await supabase!
      .from('zoon_circle_messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false }) // الأحدث أولاً للتحميل
      .limit(limit);

    if (error) throw error;

    // 2. التحقق من وجود رسائل
    if (!messages || messages.length === 0) return [];

    // 3. جلب تفاصيل المرسلين (يمكن تحسينها بـ Join لكن هذا أسرع للتنفيذ المباشر)
    // نجمع الـ IDs الفريدة
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    
    const { data: profiles } = await supabase!
      .from('new_profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);

    // 4. دمج المعلومات
    const enrichedMessages = messages.map(msg => {
      const profile = profiles?.find(p => p.id === msg.sender_id);
      return {
        ...msg,
        sender_details: {
          name: profile?.full_name || 'زائر غامض',
          avatar_url: profile?.avatar_url || ''
        }
      };
    });

    return enrichedMessages.reverse() as ChatMessage[]; // نعكس الترتيب للعرض (الأقدم في الأعلى)
  },

  /**
   * ⚡ الاشتراك في قناة الدردشة (عامة أو خاصة)
   */
  subscribeToChat: (channelId: string, onNewMessage: (msg: ChatMessage) => void, isDirect = false): RealtimeChannel => {
    const table = isDirect ? 'zoon_direct_messages' : 'zoon_circle_messages';
    const filterCol = isDirect ? 'chat_id' : 'circle_id';

    return supabase!
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: `${filterCol}=eq.${channelId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender details quickly
          const { data: profile } = await supabase!
              .from('new_profiles')
              .select('full_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();
              
          onNewMessage({
              ...newMessage,
              // Map legacy structure or direct structure
              circle_id: newMessage.circle_id || 'direct', 
              sender_details: {
                  name: profile?.full_name || '...',
                  avatar_url: profile?.avatar_url || ''
              }
          } as ChatMessage);
        }
      )
      .subscribe();
  },

  // ═══════════════════════════════════════════════════════
  // 🔒 Direct Messages (الدردشة الخاصة)
  // ═══════════════════════════════════════════════════════

  /**
   * فتح (أو إنشاء) محادثة خاصة بين عضوين
   */
  openDirectChat: async (myId: string, otherId: string) => {
    // Validation
    if (!myId || !otherId) {
        console.error("openDirectChat error: Missing IDs", { myId, otherId });
        throw new Error("Cannot open chat: Missing user IDs");
    }

    // 1. البحث عن محادثة موجودة
    const { data: existingChats, error: searchError } = await supabase!
      .from('zoon_direct_chats')
      .select('id')
      .or(`and(user1_id.eq.${myId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${myId})`);

    if (searchError) throw searchError;

    if (existingChats && existingChats.length > 0) {
      return existingChats[0].id;
    }

    // 2. إنشاء محادثة جديدة إذا لم توجد
    const { data: newChat, error: createError } = await supabase!
      .from('zoon_direct_chats')
      .insert({
        user1_id: myId,
        user2_id: otherId
      })
      .select('id')
      .single();
    
    if (createError) throw createError;
    return newChat.id;
  },

  /**
   * إرسال رسالة خاصة
   */
  sendDirectMessage: async (chatId: string, content: string, senderId: string) => {
    const { data, error } = await supabase!
      .from('zoon_direct_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content,
        message_type: 'TEXT'
      })
      .select()
      .single();

    if (error) {
        console.error('Error sending DM:', error);
        throw error;
    }
    return data;
  },

  /**
   * جلب رسائل الخاص
   */
  getDirectMessages: async (chatId: string, limit = 50) => {
    const { data: messages, error } = await supabase!
      .from('zoon_direct_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!messages || messages.length === 0) return [];

    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: profiles } = await supabase!
      .from('new_profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);

    return messages.map(msg => ({
      ...msg,
      circle_id: 'direct', // Fake ID for interface compatibility
      sender_details: {
        name: profiles?.find(p => p.id === msg.sender_id)?.full_name || '...',
        avatar_url: profiles?.find(p => p.id === msg.sender_id)?.avatar_url || ''
      }
    })).reverse() as ChatMessage[];
  }
};
