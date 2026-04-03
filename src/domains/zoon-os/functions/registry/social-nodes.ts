// src/domains/zoon-os/functions/registry/social-nodes.ts

import { FunctionNode } from './index';

export const SOCIAL_NODES: Record<string, FunctionNode> = {
  'send-whatsapp': {
    id: 'send-whatsapp',
    label: 'إرسال واتساب',
    description: 'إرسال رسالة أو ملف عبر تطبيق واتساب',
    category: 'messaging',
    icon: '📱',
    handler: 'sendWhatsAppHandler',
    params: [
      { key: 'phone', label: 'رقم الهاتف', type: 'text', required: true, description: 'الرقم بالصيغة الدولية (مثلاً: 2010...)' },
      { key: 'message', label: 'نص الرسالة', type: 'text', required: true, description: 'محتوى الرسالة المراد إرسالها' },
      { key: 'fileUrl', label: 'رابط ملف مرفق', type: 'text', required: false, description: 'اختياري: رابط لملف تريد مشاركته' }
    ],
    outputs: [
      { key: 'waLink', type: 'string', description: 'رابط الإرسال المباشر' },
      { key: 'sentTo', type: 'string', description: 'الرقم الذي تم الإرسال له' }
    ]
  },
  'send-facebook': {
    id: 'send-facebook',
    label: 'نشر فيسبوك',
    description: 'نشر تحديث أو تقرير على صفحة فيسبوك',
    category: 'messaging',
    icon: '🔵',
    handler: 'sendFacebookHandler',
    params: [
      { key: 'message', label: 'نص المنشور', type: 'text', required: true, description: 'المحتوى المراد نشره' },
      { key: 'pageId', label: 'معرف الصفحة', type: 'text', required: false, description: 'اختياري: معرف صفحة فيسبوك المحددة' },
      { key: 'link', label: 'رابط مرفق', type: 'text', required: false, description: 'اختياري: رابط لإدراجه في المنشور' }
    ],
    outputs: [
      { key: 'posted', type: 'boolean', description: 'حالة النشر' }
    ]
  }
};
