// src/domains/zoon-os/functions/registry/export-nodes.ts

import { FunctionNode } from './index';

export const EXPORT_NODES: Record<string, FunctionNode> = {
  'export-pdf': {
    id: 'export-pdf',
    label: 'استخراج PDF',
    description: 'يحول البيانات المستلمة إلى ملف PDF احترافي',
    category: 'export',
    icon: '📄',
    handler: 'exportPdfHandler',
    params: [
      {
        key: 'title',
        label: 'عنوان الملف',
        type: 'text',
        required: true,
        default: 'تقرير Zoon OS'
      },
      {
        key: 'data',
        label: 'البيانات المصدر',
        type: 'object',
        required: true,
        description: 'يمكن ربطها ببيانات من خطوة سابقة باستخدام {{prev.data}}'
      },
      {
        key: 'fileName',
        label: 'اسم الملف المحفوظ',
        type: 'text',
        required: false,
        default: 'report.pdf'
      }
    ],
    outputs: [
      {
        key: 'fileBase64',
        type: 'string',
        description: 'الملف بصيغة Base64 URI'
      },
      {
        key: 'fileName',
        type: 'string',
        description: 'اسم الملف المولد'
      }
    ]
  },
  'export-excel': {
    id: 'export-excel',
    label: 'استخراج Excel',
    description: 'يحول البيانات المستلمة إلى ملف Excel (XLSX)',
    category: 'export',
    icon: '📊',
    handler: 'exportExcelHandler',
    params: [
      { key: 'data', label: 'البيانات المصدر', type: 'object', required: true, description: 'كائن البيانات أو مصفوفة الكائنات' },
      { key: 'fileName', label: 'اسم الملف', type: 'text', required: false, default: 'report.xlsx', description: 'اسم الملف الناتج' }
    ],
    outputs: [
      { key: 'fileBase64', type: 'string', description: 'الملف بصيغة Base64' },
      { key: 'fileName', type: 'string', description: 'اسم الملف المولد' }
    ]
  },
  'export-word': {
    id: 'export-word',
    label: 'استخراج Word',
    description: 'يحول البيانات المستلمة إلى ملف مستند Word (DOCX)',
    category: 'export',
    icon: '📝',
    handler: 'exportWordHandler',
    params: [
      { key: 'title', label: 'العنوان', type: 'text', required: false, default: 'تقرير Word', description: 'عنوان المستند' },
      { key: 'data', label: 'البيانات المصدر', type: 'object', required: true, description: 'البيانات المحولة لجدول' },
      { key: 'fileName', label: 'اسم الملف', type: 'text', required: false, default: 'report.docx', description: 'اسم الملف الناتج' }
    ],
    outputs: [
      { key: 'fileBase64', type: 'string', description: 'الملف بصيغة Base64' },
      { key: 'fileName', type: 'string', description: 'اسم الملف المولد' }
    ]
  },
  'export-markdown': {
    id: 'export-markdown',
    label: 'استخراج Markdown',
    description: 'يحول البيانات إلى تنسيق Markdown النصي',
    category: 'export',
    icon: '📋',
    handler: 'exportMarkdownHandler',
    params: [
      { key: 'title', label: 'العنوان', type: 'text', required: false, default: 'تقرير MD', description: 'عنوان التقرير' },
      { key: 'data', label: 'البيانات المصدر', type: 'object', required: true, description: 'البيانات المراد تحويلها' }
    ],
    outputs: [{ key: 'fileBase64', type: 'string', description: 'النص بتنسيق Base64' }]
  }
};
