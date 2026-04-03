-- إضافة agent_id لجدول category_bucket_config
-- للسماح باختيار وكيل محدد أو "الكل" (null) عند نوع المورد = وكيل معتمد

ALTER TABLE public.category_bucket_config
ADD COLUMN IF NOT EXISTS agent_id UUID NULL REFERENCES public.agents (id) ON DELETE SET NULL;

-- تحديث القيد الفريد: COALESCE يضمن صف واحد فقط عند agent_id = null لكل (category, supplier_type, basket_size)
ALTER TABLE public.category_bucket_config
DROP CONSTRAINT IF EXISTS category_bucket_config_unique;

CREATE UNIQUE INDEX category_bucket_config_unique
ON public.category_bucket_config (category_id, supplier_type, basket_size, COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_category_bucket_config_agent_id
ON public.category_bucket_config (agent_id);
