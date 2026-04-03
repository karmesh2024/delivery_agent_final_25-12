-- =============================================================================
-- Workflow التسلسل والتسعير: سعر الفئة الفرعية + معدّل المنتج
-- تاريخ: 2026-01-30
-- تشغيل يدوي: نفّذ هذا الملف في Supabase SQL Editor أو عبر migration
-- =============================================================================

-- 1. جدول سعر البورصة للفئة الفرعية (واحد لكل فئة فرعية مخلفات)
-- يستخدم waste_sub_categories.id (BIGINT) كمرجع
CREATE TABLE IF NOT EXISTS public.subcategory_exchange_price (
    subcategory_id BIGINT NOT NULL REFERENCES public.waste_sub_categories(id) ON DELETE CASCADE,
    buy_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(12,2) NULL,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT subcategory_exchange_price_pkey PRIMARY KEY (subcategory_id)
);

COMMENT ON TABLE public.subcategory_exchange_price IS 'سعر البورصة المرجعي لكل فئة فرعية (مثل ألومنيوم طري) - تُشتق أسعار المنتجات منه مع نسبة/مبلغ التعديل';
COMMENT ON COLUMN public.subcategory_exchange_price.buy_price IS 'سعر الشراء للكيلو (ج/كجم) - السعر المرجعي للفئة';
COMMENT ON COLUMN public.subcategory_exchange_price.sell_price IS 'سعر البيع للطن أو للكيلو إن وُجد';

CREATE INDEX IF NOT EXISTS idx_subcategory_exchange_price_subcategory ON public.subcategory_exchange_price(subcategory_id);

-- 2. أعمدة معدّل السعر وترتيب العرض على المنتجات (waste_data_admin)
-- إذا كان subcategory_id في waste_data_admin من نوع UUID (قبل migrate_waste_data_admin_subcategory_id)
-- فربط المنتج بجدول السعر يتم عبر جدول ربط أو تحويل؛ إن كان BIGINT يُربط مباشرة.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waste_data_admin' AND column_name = 'price_premium_percentage'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN price_premium_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;
    COMMENT ON COLUMN public.waste_data_admin.price_premium_percentage IS 'نسبة تعديل السعر عن سعر الفئة الفرعية: موجبة = زيادة، سالبة = خصم (مثال: 10 = +10%)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waste_data_admin' AND column_name = 'price_premium_fixed_amount'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN price_premium_fixed_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
    COMMENT ON COLUMN public.waste_data_admin.price_premium_fixed_amount IS 'مبلغ ثابت يُضاف لسعر الكيلو بعد تطبيق النسبة (جنيه)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waste_data_admin' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    COMMENT ON COLUMN public.waste_data_admin.display_order IS 'ترتيب عرض المنتج في القوائم والتطبيقات';
  END IF;
END $$;

-- 3. عمود لربط المنتج بفئة التسعير (إن كان المنتج تحت فئة فرعية فرعية)
-- إن لم يُستخدم يمكن تركه NULL والاعتماد على subcategory_id الحالي
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waste_data_admin' AND column_name = 'pricing_subcategory_id'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN pricing_subcategory_id BIGINT NULL;
    COMMENT ON COLUMN public.waste_data_admin.pricing_subcategory_id IS 'معرف الفئة الفرعية (waste_sub_categories.id) التي يُؤخذ منها سعر البورصة إن اختلفت عن subcategory_id';
  END IF;
END $$;

-- 4. RLS و policies للجدول الجديد (اختياري - تفعيل حسب صلاحيات المشروع)
ALTER TABLE public.subcategory_exchange_price ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read subcategory_exchange_price" ON public.subcategory_exchange_price;
CREATE POLICY "Allow read subcategory_exchange_price" ON public.subcategory_exchange_price
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert subcategory_exchange_price" ON public.subcategory_exchange_price;
CREATE POLICY "Allow insert subcategory_exchange_price" ON public.subcategory_exchange_price
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update subcategory_exchange_price" ON public.subcategory_exchange_price;
CREATE POLICY "Allow update subcategory_exchange_price" ON public.subcategory_exchange_price
  FOR UPDATE USING (true);
