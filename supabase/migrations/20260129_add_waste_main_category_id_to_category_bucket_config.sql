-- دعم إعداد سلة الفئة الرئيسية لفئات waste_main_categories (معرّف رقمي)
-- واجهة "إدارة التنظيم والتسلسل" تعرض الفئات من waste_main_categories وليس public.categories

-- 0. التأكد من وجود agent_id (إذا لم يُطبّق migration add_agent_id مسبقاً)
ALTER TABLE public.category_bucket_config
ADD COLUMN IF NOT EXISTS agent_id UUID NULL REFERENCES public.agents (id) ON DELETE SET NULL;

-- 1. جعل category_id قابلاً للإلغاء (للاستخدام مع public.categories عند الحاجة)
ALTER TABLE public.category_bucket_config
ALTER COLUMN category_id DROP NOT NULL;

-- 2. إضافة عمود لفئة المخلفات الرئيسية (waste_main_categories.id = BIGINT)
ALTER TABLE public.category_bucket_config
ADD COLUMN IF NOT EXISTS waste_main_category_id BIGINT NULL REFERENCES public.waste_main_categories (id) ON DELETE CASCADE;

-- 3. قيد التحقق: يجب وجود إما category_id أو waste_main_category_id
ALTER TABLE public.category_bucket_config
ADD CONSTRAINT category_bucket_config_category_check
CHECK (
  (category_id IS NOT NULL AND waste_main_category_id IS NULL)
  OR (category_id IS NULL AND waste_main_category_id IS NOT NULL)
);

-- 4. تحديث القيد الفريد ليشمل النوعين (مع الحفاظ على agent_id)
ALTER TABLE public.category_bucket_config
DROP CONSTRAINT IF EXISTS category_bucket_config_unique;

DROP INDEX IF EXISTS category_bucket_config_unique;

CREATE UNIQUE INDEX category_bucket_config_unique
ON public.category_bucket_config (
  COALESCE(category_id::text, ''),
  COALESCE(waste_main_category_id::text, ''),
  supplier_type,
  basket_size,
  COALESCE(agent_id::text, '00000000-0000-0000-0000-000000000000')
);

-- 5. فهرس للبحث حسب waste_main_category_id
CREATE INDEX IF NOT EXISTS idx_category_bucket_config_waste_main_category_id
ON public.category_bucket_config (waste_main_category_id);

COMMENT ON COLUMN public.category_bucket_config.waste_main_category_id IS 'معرف الفئة الرئيسية من waste_main_categories (عند استخدام واجهة التنظيم/المخلفات)';
