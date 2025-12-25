import { Conversation, Message, Agent } from '@/types';

/**
 * بيانات وهمية للمندوبين لاستخدامها في واجهة الرسائل
 */
export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'محمد علي',
    status: 'online',
    avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.8,
    total_deliveries: 128,
    phone: '+966501234567',
    last_active: new Date().toISOString(),
    badge_level: 3
  },
  {
    id: 'agent-002',
    name: 'أحمد خالد',
    status: 'busy',
    avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
    rating: 4.5,
    total_deliveries: 87,
    phone: '+966509876543',
    last_active: new Date().toISOString(),
    badge_level: 2
  },
  {
    id: 'agent-003',
    name: 'عبدالله محمد',
    status: 'offline',
    avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
    rating: 4.2,
    total_deliveries: 56,
    phone: '+966502345678',
    last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // قبل يوم
    badge_level: 1
  },
  {
    id: 'agent-004',
    name: 'سارة أحمد',
    status: 'online',
    avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
    rating: 4.9,
    total_deliveries: 142,
    phone: '+966503456789',
    last_active: new Date().toISOString(),
    badge_level: 3
  }
];

/**
 * بيانات وهمية للمحادثات
 */
export const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    agentId: 'agent-001',
    lastMessage: 'سأصل إلى موقع الاستلام خلال 15 دقيقة',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // قبل 15 دقيقة
    unread: true,
    type: 'order_related'
  },
  {
    id: 'conv-002',
    agentId: 'agent-002',
    lastMessage: 'تم تسليم الطلب بنجاح، شكراً لكم',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // قبل 3 ساعات
    unread: false,
    type: 'order_related'
  },
  {
    id: 'conv-003',
    agentId: 'agent-003',
    lastMessage: 'أحتاج إلى مساعدة في تحديث معلومات حسابي',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // قبل يوم
    unread: false,
    type: 'support'
  },
  {
    id: 'conv-004',
    agentId: 'agent-004',
    lastMessage: 'هل يمكنني الحصول على مزيد من المعلومات حول برنامج المكافآت؟',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // قبل 15 دقيقة
    unread: true,
    type: 'support'
  }
];

/**
 * بيانات وهمية للرسائل داخل المحادثات
 */
export const mockMessages: Message[] = [
  // محادثة 1 (مندوب 1)
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    senderId: 'admin',
    content: 'مرحباً محمد، هل يمكنك تأكيد موعد وصولك إلى العميل؟',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // قبل 30 دقيقة
    isRead: true
  },
  {
    id: 'msg-002',
    conversationId: 'conv-001',
    senderId: 'agent-001',
    content: 'نعم، أنا الآن في الطريق وسأصل خلال 15-20 دقيقة تقريباً',
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // قبل 25 دقيقة
    isRead: true
  },
  {
    id: 'msg-003',
    conversationId: 'conv-001',
    senderId: 'admin',
    content: 'ممتاز، هل هناك أي تحديات في الطريق؟',
    timestamp: new Date(Date.now() - 20 * 60 * 1000), // قبل 20 دقيقة
    isRead: true
  },
  {
    id: 'msg-004',
    conversationId: 'conv-001',
    senderId: 'agent-001',
    content: 'سأصل إلى موقع الاستلام خلال 15 دقيقة',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // قبل 15 دقيقة
    isRead: false
  },

  // محادثة 2 (مندوب 2)
  {
    id: 'msg-005',
    conversationId: 'conv-002',
    senderId: 'agent-002',
    content: 'لقد وصلت إلى عنوان العميل ولكن لا يوجد أحد للاستلام',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // قبل 4 ساعات
    isRead: true
  },
  {
    id: 'msg-006',
    conversationId: 'conv-002',
    senderId: 'admin',
    content: 'سأتصل بالعميل وأتأكد من وجوده، انتظر لحظات',
    timestamp: new Date(Date.now() - 3.9 * 60 * 60 * 1000), // قبل 3.9 ساعات
    isRead: true
  },
  {
    id: 'msg-007',
    conversationId: 'conv-002',
    senderId: 'admin',
    content: 'العميل في الطريق، سيصل خلال 5 دقائق',
    timestamp: new Date(Date.now() - 3.8 * 60 * 60 * 1000), // قبل 3.8 ساعات
    isRead: true
  },
  {
    id: 'msg-008',
    conversationId: 'conv-002',
    senderId: 'agent-002',
    content: 'تم تسليم الطلب بنجاح، شكراً لكم',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // قبل 3 ساعات
    isRead: true,
    messageType: 'text'
  },

  // محادثة 3 (مندوب 3) - دعم فني
  {
    id: 'msg-009',
    conversationId: 'conv-003',
    senderId: 'agent-003',
    content: 'مرحباً، أحتاج إلى تحديث رقم هاتفي في النظام',
    timestamp: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000), // قبل 1.2 يوم
    isRead: true
  },
  {
    id: 'msg-010',
    conversationId: 'conv-003',
    senderId: 'admin',
    content: 'مرحباً عبدالله، يمكنني مساعدتك في ذلك. ما هو رقم الهاتف الجديد؟',
    timestamp: new Date(Date.now() - 1.15 * 24 * 60 * 60 * 1000), // قبل 1.15 يوم
    isRead: true
  },
  {
    id: 'msg-011',
    conversationId: 'conv-003',
    senderId: 'agent-003',
    content: '+966501122334',
    timestamp: new Date(Date.now() - 1.1 * 24 * 60 * 60 * 1000), // قبل 1.1 يوم
    isRead: true
  },
  {
    id: 'msg-012',
    conversationId: 'conv-003',
    senderId: 'admin',
    content: 'تم تحديث رقم الهاتف بنجاح! هل هناك أي شيء آخر تحتاج مساعدة به؟',
    timestamp: new Date(Date.now() - 1.05 * 24 * 60 * 60 * 1000), // قبل 1.05 يوم
    isRead: true
  },
  {
    id: 'msg-013',
    conversationId: 'conv-003',
    senderId: 'agent-003',
    content: 'أحتاج إلى مساعدة في تحديث معلومات حسابي',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // قبل يوم
    isRead: true
  },

  // محادثة 4 (مندوب 4) - دعم فني مع صورة
  {
    id: 'msg-014',
    conversationId: 'conv-004',
    senderId: 'agent-004',
    content: 'مرحباً، لدي سؤال حول برنامج المكافآت الجديد',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // قبل 45 دقيقة
    isRead: true
  },
  {
    id: 'msg-015',
    conversationId: 'conv-004',
    senderId: 'admin',
    content: 'مرحباً سارة، بالتأكيد يمكنني مساعدتك. ما هو سؤالك؟',
    timestamp: new Date(Date.now() - 40 * 60 * 1000), // قبل 40 دقيقة
    isRead: true
  },
  {
    id: 'msg-016',
    conversationId: 'conv-004',
    senderId: 'agent-004',
    content: 'أرى أنني حصلت على نقاط مكافآت، لكن لا أعرف كيف يمكنني استخدامها',
    timestamp: new Date(Date.now() - 35 * 60 * 1000), // قبل 35 دقيقة
    isRead: true
  },
  {
    id: 'msg-017',
    conversationId: 'conv-004',
    senderId: 'admin',
    content: 'إليك معلومات حول برنامج المكافآت',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // قبل 30 دقيقة
    isRead: true,
    messageType: 'image',
    metadata: {
      imageUrl: 'https://via.placeholder.com/400x300?text=Rewards+Program'
    }
  },
  {
    id: 'msg-018',
    conversationId: 'conv-004',
    senderId: 'agent-004',
    content: 'شكراً لك! هل يمكنني استبدال النقاط بخصومات على الطلبات؟',
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // قبل 25 دقيقة
    isRead: true
  },
  {
    id: 'msg-019',
    conversationId: 'conv-004',
    senderId: 'admin',
    content: 'نعم، يمكنك ذلك. كل 100 نقطة تعادل خصم 10 جنيه مصري على طلباتك القادمة. يمكنك استخدام النقاط عبر قسم "المكافآت" في التطبيق.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000), // قبل 20 دقيقة
    isRead: true
  },
  {
    id: 'msg-020',
    conversationId: 'conv-004',
    senderId: 'agent-004',
    content: 'هل يمكنني الحصول على مزيد من المعلومات حول برنامج المكافآت؟',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // قبل 15 دقيقة
    isRead: false
  }
];

/**
 * دالة للحصول على الرسائل في محادثة محددة
 * @param conversationId معرف المحادثة
 * @returns مصفوفة الرسائل في المحادثة
 */
export const getMessagesForConversation = (conversationId: string): Message[] => {
  return mockMessages.filter(message => message.conversationId === conversationId);
};

/**
 * دالة للحصول على مندوب محدد
 * @param agentId معرف المندوب
 * @returns كائن المندوب أو undefined إذا لم يتم العثور عليه
 */
export const getAgentById = (agentId: string): Agent | undefined => {
  return mockAgents.find(agent => agent.id === agentId);
};