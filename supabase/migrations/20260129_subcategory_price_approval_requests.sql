-- =============================================================================
-- طلبات الموافقة على تغيير سعر الفئة الفرعية (أسعار البورصة للفئات)
-- تشغيل يدوي إن لزم. يتكامل مع subcategory_exchange_price و منطق 10%
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subcategory_price_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id BIGINT NOT NULL REFERENCES public.waste_sub_categories(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2) NOT NULL,
  price_change_percentage NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subcategory_price_approval_status ON public.subcategory_price_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_subcategory_price_approval_subcategory ON public.subcategory_price_approval_requests(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_price_approval_created ON public.subcategory_price_approval_requests(created_at DESC);

ALTER TABLE public.subcategory_price_approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read subcategory_price_approval" ON public.subcategory_price_approval_requests;
CREATE POLICY "Allow read subcategory_price_approval" ON public.subcategory_price_approval_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert subcategory_price_approval" ON public.subcategory_price_approval_requests;
CREATE POLICY "Allow insert subcategory_price_approval" ON public.subcategory_price_approval_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update subcategory_price_approval" ON public.subcategory_price_approval_requests;
CREATE POLICY "Allow update subcategory_price_approval" ON public.subcategory_price_approval_requests FOR UPDATE USING (true);

COMMENT ON TABLE public.subcategory_price_approval_requests IS 'طلبات الموافقة على تغيير سعر الفئة الفرعية عندما تكون نسبة التغيير >= 10%';
