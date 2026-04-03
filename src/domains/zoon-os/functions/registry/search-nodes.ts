import { FunctionNode } from './index'

export const SEARCH_NODES: Record<string, FunctionNode> = {

  'web-search': {
    id: 'web-search',
    label: 'بحث على الإنترنت',
    description: 'استخدم هذه الأداة للبحث في الإنترنت فقط عندما يتعلق السؤال بأخبار، أحداث حديثة، أو معلومات عامة لا تتوفر داخلياً. لا تستخدمها للحسابات أو بيانات النظام.',
    category: 'search',
    icon: '🔍',
    params: [
      {
        key: 'query',
        label: 'نص البحث',
        type: 'text',
        required: true,
        description: 'ما تريد البحث عنه'
      },
      {
        key: 'maxResults',
        label: 'عدد النتائج',
        type: 'number',
        required: false,
        default: 5
      },
      {
        key: 'category',
        label: 'تصنيف البحث',
        type: 'select',
        required: false,
        options: ['general', 'news', 'science', 'images', 'it'],
        default: 'general',
        description: 'نوع النتائج المطلوبة (عام، أخبار، علمي، إلخ)'
      }
    ],
    outputs: [
      { key: 'results', type: 'array', description: 'قائمة النتائج (title, url, snippet)' },
      { key: 'count', type: 'number', description: 'عدد النتائج' }
    ],
    handler: 'webSearchHandler'
  },

  'web-fetch': {
    id: 'web-fetch',
    label: 'جلب محتوى صفحة',
    description: 'يفتح رابطاً ويحوّل محتواه إلى Markdown نظيف يفهمه الوكيل. يدعم المواقع الديناميكية عبر Playwright.',
    category: 'search',
    icon: '🌐',
    params: [
      {
        key: 'url',
        label: 'رابط الصفحة',
        type: 'text',
        required: true
      },
      {
        key: 'usePlaywright',
        label: 'استخدام متصفح حقيقي',
        type: 'boolean',
        required: false,
        default: false,
        description: 'فعّله للمواقع التي تعتمد على JavaScript (فيسبوك، تويتر، إلخ)'
      }
    ],
    outputs: [
      { key: 'markdown', type: 'string', description: 'محتوى الصفحة بصيغة Markdown' },
      { key: 'title', type: 'string', description: 'عنوان الصفحة' }
    ],
    handler: 'webFetchHandler'
  },

  'deep-research': {
    id: 'deep-research',
    label: 'بحث عميق',
    description: 'استخدمها للبحث المعمق عندما يحتاج المستخدم لتقرير شامل أو تحليل لعدة مصادر (مثل دراسة منافسين أو أسعار السوق). تتطلب وقتاً أطول.',
    category: 'search',
    icon: '🔬',
    params: [
      {
        key: 'query',
        label: 'موضوع البحث',
        type: 'text',
        required: true
      },
      {
        key: 'maxPages',
        label: 'عدد الصفحات',
        type: 'number',
        required: false,
        default: 3,
        description: 'عدد الصفحات التي سيجلبها (1-5 موصى به)'
      },
      {
        key: 'usePlaywright',
        label: 'متصفح حقيقي',
        type: 'boolean',
        required: false,
        default: false
      }
    ],
    outputs: [
      { key: 'content', type: 'string', description: 'المحتوى المدمج من كل المصادر' },
      { key: 'pagesCount', type: 'number', description: 'عدد الصفحات المجلوبة' },
      { key: 'sources', type: 'array', description: 'قائمة المصادر' }
    ],
    handler: 'deepResearchHandler'
  },

  'image-ocr': {
    id: 'image-ocr',
    label: 'استخراج نص من صورة',
    description: 'استخدم الوصف لاستخراج نصوص أو أرقام من صور الجداول أو منشورات المنافسين. لا تستخدمها إذا كان النص متوفراً كنص عادي.',
    category: 'search',
    icon: '🖼️',
    params: [
      {
        key: 'imageUrl',
        label: 'رابط الصورة',
        type: 'text',
        required: true
      },
      {
        key: 'prompt',
        label: 'تعليمات الاستخراج',
        type: 'text',
        required: false,
        default: 'استخرج كل النصوص والأرقام من هذه الصورة'
      }
    ],
    outputs: [
      { key: 'extractedText', type: 'string', description: 'النص المستخرج من الصورة' }
    ],
    handler: 'imageOCRHandler'
  },

  'extract-data': {
    id: 'extract-data',
    label: 'استخراج بيانات مهيكلة',
    description: 'يستخرج بيانات محددة من صفحة ويب: جداول، روابط، أسعار، أو نص معين بـ CSS selector.',
    category: 'search',
    icon: '📊',
    params: [
      {
        key: 'url',
        label: 'رابط الصفحة',
        type: 'text',
        required: true
      },
      {
        key: 'extractType',
        label: 'نوع البيانات',
        type: 'select',
        required: false,
        options: ['text', 'table', 'links', 'prices'],
        default: 'text'
      },
      {
        key: 'selector',
        label: 'CSS Selector (اختياري)',
        type: 'text',
        required: false,
        description: 'مثال: .price أو #content أو table.data'
      }
    ],
    outputs: [
      { key: 'extracted', type: 'unknown', description: 'البيانات المستخرجة' }
    ],
    handler: 'extractDataHandler'
  }
}
