-- Migration: نظام الصلاحيات والموافقات لإدارة المخلفات
-- تاريخ الإنشاء: 2025-01-01

-- 1. إنشاء جدول طلبات الموافقة على تغيير الأسعار
CREATE TABLE IF NOT EXISTS public.waste_price_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_material_id TEXT NOT NULL REFERENCES public.catalog_waste_materials(waste_no) ON DELETE CASCADE,
  stock_exchange_id INT REFERENCES public.stock_exchange(id) ON DELETE SET NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('price_change', 'base_price_set')),
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
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 2. إنشاء جدول طلبات الموافقة على استلام المخلفات
CREATE TABLE IF NOT EXISTS public.waste_receiving_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('delivery_boy', 'supplier', 'agent', 'direct')), -- مصدر الاستلام
  collection_session_id UUID REFERENCES public.waste_collection_sessions(id) ON DELETE SET NULL, -- من waste_collection_sessions (إذا كان source = delivery_boy)
  supplier_invoice_id UUID REFERENCES public.warehouse_invoices(id) ON DELETE SET NULL, -- من warehouse_invoices (إذا كان source = supplier)
  delivery_agent_id UUID, -- من delivery_boys (إذا كان source = delivery_boy)
  supplier_id INT REFERENCES public.suppliers(id) ON DELETE SET NULL, -- من suppliers (إذا كان source = supplier)
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL, -- من agents (إذا كان source = agent)
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE, -- المخزن المستلم
  waste_items JSONB NOT NULL, -- Array of {waste_material_id, quantity, unit, quality_grade, notes}
  total_weight NUMERIC(12,3),
  total_value NUMERIC(12,2),
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 3. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_price_approval_requests_status ON public.waste_price_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_approval_requests_waste_material ON public.waste_price_approval_requests(waste_material_id);
CREATE INDEX IF NOT EXISTS idx_price_approval_requests_requested_by ON public.waste_price_approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_price_approval_requests_created_at ON public.waste_price_approval_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_status ON public.waste_receiving_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_source ON public.waste_receiving_approval_requests(source);
CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_agent ON public.waste_receiving_approval_requests(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_supplier ON public.waste_receiving_approval_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_warehouse ON public.waste_receiving_approval_requests(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_receiving_approval_requests_created_at ON public.waste_receiving_approval_requests(created_at DESC);

-- 4. إنشاء الصلاحيات الأساسية في جدول permissions
-- ملاحظة: يجب أن تكون هذه الصلاحيات موجودة في جدول permissions أولاً
-- يمكن إضافتها يدوياً أو عبر API

-- 5. دالة للتحقق من الحاجة للموافقة على تغيير السعر
CREATE OR REPLACE FUNCTION public.requires_price_approval(
  old_price NUMERIC,
  new_price NUMERIC,
  threshold_percentage NUMERIC DEFAULT 10.0
) RETURNS BOOLEAN AS $$
BEGIN
  IF old_price IS NULL OR old_price = 0 THEN
    RETURN FALSE; -- السعر الأولي لا يحتاج موافقة
  END IF;
  
  RETURN ABS((new_price - old_price) / old_price * 100) >= threshold_percentage;
END;
$$ LANGUAGE plpgsql;

-- 6. دالة لتسجيل تغيير السعر في التاريخ تلقائياً
CREATE OR REPLACE FUNCTION public.log_price_change_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- تسجيل في exchange_price_history
    INSERT INTO public.exchange_price_history (
      stock_exchange_id,
      product_id,
      old_buy_price,
      new_buy_price,
      change_reason,
      change_source,
      changed_by
    ) VALUES (
      NEW.stock_exchange_id,
      NEW.waste_material_id,
      COALESCE(NEW.old_price, 0),
      NEW.new_price,
      NEW.reason,
      'approval_system',
      NEW.approved_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. إنشاء Trigger لتسجيل تغيير السعر عند الموافقة
CREATE TRIGGER trigger_log_price_change_on_approval
  AFTER UPDATE ON public.waste_price_approval_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.log_price_change_on_approval();

-- 8. دالة لتحديث السعر في stock_exchange عند الموافقة
CREATE OR REPLACE FUNCTION public.update_stock_exchange_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    IF NEW.stock_exchange_id IS NOT NULL THEN
      -- تحديث السعر الموجود
      UPDATE public.stock_exchange
      SET 
        buy_price = NEW.new_price,
        last_update = NOW(),
        price_change_percentage = NEW.price_change_percentage
      WHERE id = NEW.stock_exchange_id;
    ELSE
      -- إنشاء سجل جديد في stock_exchange
      INSERT INTO public.stock_exchange (
        product_id,
        buy_price,
        base_price,
        sell_price,
        auto_update_enabled,
        last_update,
        price_change_percentage
      ) VALUES (
        NEW.waste_material_id,
        NEW.new_price,
        NEW.new_price,
        NEW.new_price * 1.2, -- هامش ربح 20%
        FALSE,
        NOW(),
        NEW.price_change_percentage
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء Trigger لتحديث السعر عند الموافقة
CREATE TRIGGER trigger_update_stock_exchange_on_approval
  AFTER UPDATE ON public.waste_price_approval_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.update_stock_exchange_on_approval();

-- 10. RLS Policies (Row Level Security)
ALTER TABLE public.waste_price_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_receiving_approval_requests ENABLE ROW LEVEL SECURITY;

-- Policy: يمكن للمستخدمين رؤية طلباتهم فقط
CREATE POLICY "Users can view their own price approval requests"
  ON public.waste_price_approval_requests
  FOR SELECT
  USING (auth.uid() = requested_by);

-- Policy: يمكن لمديري المخلفات رؤية جميع الطلبات
CREATE POLICY "Waste managers can view all price approval requests"
  ON public.waste_price_approval_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      JOIN public.role_permissions rp ON a.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE a.user_id = auth.uid()
        AND p.code IN ('waste:pricing:approve', 'waste:pricing:view')
        AND a.is_active = TRUE
    )
  );

-- Policy: يمكن للمستخدمين إنشاء طلبات موافقة
CREATE POLICY "Users can create price approval requests"
  ON public.waste_price_approval_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

-- Policy: يمكن لمديري المخلفات الموافقة أو الرفض
CREATE POLICY "Waste managers can approve/reject price requests"
  ON public.waste_price_approval_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      JOIN public.role_permissions rp ON a.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE a.user_id = auth.uid()
        AND p.code = 'waste:pricing:approve'
        AND a.is_active = TRUE
    )
  );

-- Policy: يمكن للدليفري بوي رؤية طلبات الاستلام الخاصة به
CREATE POLICY "Delivery agents can view their own receiving requests"
  ON public.waste_receiving_approval_requests
  FOR SELECT
  USING (
    source = 'delivery_boy' AND 
    EXISTS (
      SELECT 1 FROM public.delivery_boys 
      WHERE id::text = delivery_agent_id::text 
      AND user_id = auth.uid()
    )
  );
  
-- Policy: يمكن للموردين رؤية طلبات الاستلام الخاصة بهم
CREATE POLICY "Suppliers can view their own receiving requests"
  ON public.waste_receiving_approval_requests
  FOR SELECT
  USING (
    source = 'supplier' AND 
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.admins a ON s.created_by = a.user_id
      WHERE s.id = supplier_id 
      AND a.user_id = auth.uid()
    )
  );

-- Policy: يمكن لمديري المخلفات رؤية جميع طلبات الاستلام
CREATE POLICY "Waste managers can view all receiving requests"
  ON public.waste_receiving_approval_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      JOIN public.role_permissions rp ON a.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE a.user_id = auth.uid()
        AND p.code IN ('waste:receiving:view', 'waste:receiving:verify', 'waste:receiving:approve')
        AND a.is_active = TRUE
    )
  );

-- Policy: يمكن لمديري المخلفات التحقق والموافقة على الاستلام
CREATE POLICY "Waste managers can verify and approve receiving"
  ON public.waste_receiving_approval_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      JOIN public.role_permissions rp ON a.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE a.user_id = auth.uid()
        AND p.code IN ('waste:receiving:verify', 'waste:receiving:approve')
        AND a.is_active = TRUE
    )
  );

-- 11. تعليقات على الجداول
COMMENT ON TABLE public.waste_price_approval_requests IS 'طلبات الموافقة على تغيير أسعار المخلفات';
COMMENT ON TABLE public.waste_receiving_approval_requests IS 'طلبات الموافقة على استلام المخلفات من الدليفري بوي';

COMMENT ON COLUMN public.waste_price_approval_requests.price_change_percentage IS 'نسبة التغيير في السعر (إيجابية أو سلبية)';
COMMENT ON COLUMN public.waste_price_approval_requests.approval_type IS 'نوع الطلب: price_change أو base_price_set';
COMMENT ON COLUMN public.waste_receiving_approval_requests.source IS 'مصدر الاستلام: delivery_boy (من الدليفري بوي), supplier (من الموردين), agent (من الوكلاء), direct (مباشر)';
COMMENT ON COLUMN public.waste_receiving_approval_requests.waste_items IS 'مصفوفة JSONB تحتوي على المخلفات المستلمة';

