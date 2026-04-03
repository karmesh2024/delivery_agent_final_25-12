// src/domains/zoon-os/functions/registry/file-nodes.ts
// ✨ Skill Module: File Management

import { FunctionNode } from './index'

export const FILE_NODES: Record<string, FunctionNode> = {

  'file-read': {
    id: 'file-read',
    label: 'قراءة ملف',
    description: 'يقرأ محتوى ملف من مجلد التقارير المولّدة. يدعم .md و .txt و .json',
    category: 'files',
    icon: '📖',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true,
        description: 'مثال: report.md أو 2026/march.md'
      }
    ],
    outputs: [
      { key: 'content', type: 'string', description: 'محتوى الملف كاملاً' },
      { key: 'lines', type: 'number', description: 'عدد الأسطر' },
      { key: 'sizeKb', type: 'number', description: 'حجم الملف بالكيلوبايت' }
    ],
    handler: 'fileReadHandler'
  },

  'file-write': {
    id: 'file-write',
    label: 'كتابة ملف',
    description: 'ينشئ ملفاً جديداً أو يكتب فوق ملف موجود. يدعم .md و .txt و .json',
    category: 'files',
    icon: '✏️',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true,
        description: 'مثال: reports/march-2026.md'
      },
      {
        key: 'content',
        label: 'المحتوى',
        type: 'text',
        required: true
      },
      {
        key: 'mode',
        label: 'طريقة الكتابة',
        type: 'select',
        required: false,
        options: ['overwrite', 'append', 'prepend'],
        default: 'overwrite',
        description: 'overwrite=استبدال | append=إضافة للنهاية | prepend=إضافة للبداية'
      }
    ],
    outputs: [
      { key: 'success', type: 'boolean', description: 'هل نجحت الكتابة؟' },
      { key: 'filePath', type: 'string', description: 'المسار الكامل' }
    ],
    handler: 'fileWriteHandler'
  },

  'file-patch': {
    id: 'file-patch',
    label: 'تعديل جزء من ملف',
    description: 'يبحث عن نص محدد في الملف ويستبدله بنص جديد.',
    category: 'files',
    icon: '🔧',
    params: [
      { key: 'filePath', label: 'مسار الملف', type: 'text', required: true },
      { key: 'oldText', label: 'النص المراد تعديله', type: 'text', required: true },
      { key: 'newText', label: 'النص الجديد', type: 'text', required: true }
    ],
    outputs: [
      { key: 'replaced', type: 'boolean', description: 'هل تم التعديل؟' },
      { key: 'filePath', type: 'string', description: 'مسار الملف المعدَّل' }
    ],
    handler: 'filePatchHandler'
  },

  'file-delete': {
    id: 'file-delete',
    label: 'حذف ملف',
    description: 'يحذف ملفاً من مجلد التقارير — يحتاج موافقة المدير.',
    category: 'files',
    icon: '🗑️',
    isHITL: true,
    params: [
      { key: 'filePath', label: 'مسار الملف', type: 'text', required: true }
    ],
    outputs: [
      { key: 'deleted', type: 'boolean', description: 'هل تم الحذف؟' }
    ],
    handler: 'fileDeleteHandler'
  },

  'file-list': {
    id: 'file-list',
    label: 'قائمة الملفات',
    description: 'يعرض قائمة الملفات الموجودة في مجلد التقارير.',
    category: 'files',
    icon: '📁',
    params: [
      { key: 'subFolder', label: 'مجلد فرعي (اختياري)', type: 'text', required: false },
      {
        key: 'extension',
        label: 'نوع الملف',
        type: 'select',
        required: false,
        options: ['all', '.md', '.txt', '.json', '.pdf'],
        default: 'all'
      }
    ],
    outputs: [
      { key: 'files', type: 'array', description: 'قائمة الملفات' },
      { key: 'count', type: 'number', description: 'عدد الملفات' }
    ],
    handler: 'fileListHandler'
  },

  'file-to-storage': {
    id: 'file-to-storage',
    label: 'رفع ملف لـ Storage',
    description: 'يرفع ملفاً محلياً إلى Supabase Storage ويعيد رابطاً عاماً.',
    category: 'files',
    icon: '☁️',
    params: [
      { key: 'filePath', label: 'مسار الملف المحلي', type: 'text', required: true },
      { key: 'bucket', label: 'اسم الـ Bucket', type: 'text', required: false, default: 'zoon-reports' }
    ],
    outputs: [
      { key: 'publicUrl', type: 'string', description: 'رابط الملف العام' },
      { key: 'fileName', type: 'string', description: 'اسم الملف في Storage' }
    ],
    handler: 'fileToStorageHandler'
  }
}
