-- migrate-file-management-skill.sql
-- أضف هذا الـ SQL في Supabase SQL Editor
-- ========================================

-- 1. إضافة Skill Module
INSERT INTO ai_skill_modules (name, label, description, icon, category)
VALUES (
  'fileManagement',
  'إدارة الملفات',
  'قراءة وكتابة وتعديل ملفات التقارير والمستندات المولّدة تلقائياً. الوكيل يستطيع إنشاء مستندات .md وتحديثها ورفعها للـ Storage.',
  '📁',
  'files'
)
RETURNING id;

-- ملاحظة: استبدل <MODULE_ID> بالـ id الذي يظهر من الـ INSERT أعلاه

-- 2. إضافة Functions تحت الـ Module
INSERT INTO ai_skill_functions
  (skill_module_id, function_name, label, description, type, endpoint, input_schema, sort_order)
VALUES
  (
    '<MODULE_ID>',
    'file-read',
    'قراءة ملف',
    'يقرأ محتوى ملف .md أو .txt أو .json من مجلد التقارير.',
    'internal',
    '/api/internal/run-function',
    '{"filePath": {"type": "string", "required": true, "description": "مثال: reports/march.md"}}',
    1
  ),
  (
    '<MODULE_ID>',
    'file-write',
    'كتابة ملف',
    'ينشئ ملفاً جديداً أو يكتب فوق ملف موجود.',
    'internal',
    '/api/internal/run-function',
    '{"filePath": {"type": "string", "required": true}, "content": {"type": "string", "required": true}, "mode": {"type": "string", "enum": ["overwrite", "append", "prepend"], "default": "overwrite"}}',
    2
  ),
  (
    '<MODULE_ID>',
    'file-patch',
    'تعديل جزء من ملف',
    'يستبدل نصاً محدداً داخل ملف موجود.',
    'internal',
    '/api/internal/run-function',
    '{"filePath": {"type": "string", "required": true}, "oldText": {"type": "string", "required": true}, "newText": {"type": "string", "required": true}}',
    3
  ),
  (
    '<MODULE_ID>',
    'file-delete',
    'حذف ملف',
    'يحذف ملفاً من مجلد التقارير — يحتاج موافقة المدير.',
    'hitl',
    '/api/internal/run-function',
    '{"filePath": {"type": "string", "required": true}}',
    4
  ),
  (
    '<MODULE_ID>',
    'file-list',
    'قائمة الملفات',
    'يعرض الملفات المتاحة في مجلد التقارير.',
    'internal',
    '/api/internal/run-function',
    '{"subFolder": {"type": "string"}, "extension": {"type": "string", "enum": ["all", ".md", ".txt", ".json", ".pdf"], "default": "all"}}',
    5
  ),
  (
    '<MODULE_ID>',
    'file-to-storage',
    'رفع لـ Storage',
    'يرفع ملفاً محلياً إلى Supabase Storage ويعيد رابطاً عاماً.',
    'internal',
    '/api/internal/run-function',
    '{"filePath": {"type": "string", "required": true}, "bucket": {"type": "string", "default": "zoon-reports"}}',
    6
  );
