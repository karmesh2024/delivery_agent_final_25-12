-- Migration: نظام طلبات إضافة المنتجات الجديدة
-- Date: 2026-01-29
-- Tables: product_addition_requests, product_addition_requests_audit
-- Triggers: sync on approve, prevent status reversal, audit

-- =============================================================================
-- 1. جدول طلبات إضافة المنتجات
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_addition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  requested_by_department VARCHAR(100),

  product_name VARCHAR(200) NOT NULL,
  main_category_id BIGINT REFERENCES waste_main_categories(id),
  sub_category_id BIGINT REFERENCES waste_sub_categories(id),
  description TEXT,
  specifications JSONB,

  proposed_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  profit_margin_percentage DECIMAL(5,2),

  market_study_url TEXT,
  financial_analysis_url TEXT,
  logistics_assessment_url TEXT,
  procurement_report_url TEXT,

  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',

  reviewed_by_user_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  rejection_reason TEXT,

  catalog_waste_id BIGINT REFERENCES catalog_waste_materials(id),
  waste_data_id UUID REFERENCES waste_data_admin(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  CONSTRAINT chk_proposed_price_positive CHECK (proposed_price IS NULL OR proposed_price > 0),
  CONSTRAINT chk_cost_price_non_negative CHECK (cost_price IS NULL OR cost_price >= 0),
  CONSTRAINT chk_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision'))
);

CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_addition_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_requested_by ON product_addition_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_category ON product_addition_requests(main_category_id, sub_category_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_catalog_waste ON product_addition_requests(catalog_waste_id) WHERE catalog_waste_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_requests_waste_data ON product_addition_requests(waste_data_id) WHERE waste_data_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_requests_request_number ON product_addition_requests(request_number);

-- تسلسل لأرقام الطلبات
CREATE SEQUENCE IF NOT EXISTS product_addition_requests_seq START 1;

-- دالة توليد رقم الطلب: PR-2026-000001
CREATE OR REPLACE FUNCTION generate_product_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(nextval('product_addition_requests_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_product_request_number ON product_addition_requests;
CREATE TRIGGER trigger_generate_product_request_number
  BEFORE INSERT ON product_addition_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_product_request_number();

-- =============================================================================
-- 2. جدول التدقيق
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_addition_requests_audit (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_request_id ON product_addition_requests_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON product_addition_requests_audit(changed_at);

CREATE OR REPLACE FUNCTION audit_product_addition_requests()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO product_addition_requests_audit (request_id, action, new_data, changed_by_user_id)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO product_addition_requests_audit (request_id, action, old_data, new_data, changed_by_user_id)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO product_addition_requests_audit (request_id, action, old_data, changed_by_user_id)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_product_addition_requests ON product_addition_requests;
CREATE TRIGGER trigger_audit_product_addition_requests
  AFTER INSERT OR UPDATE OR DELETE ON product_addition_requests
  FOR EACH ROW
  EXECUTE FUNCTION audit_product_addition_requests();

-- =============================================================================
-- 3. منع عكس حالة الموافقة
-- =============================================================================
CREATE OR REPLACE FUNCTION prevent_approved_status_reversal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    RAISE EXCEPTION 'Cannot change status from approved to %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_approved_reversal ON product_addition_requests;
CREATE TRIGGER trigger_prevent_approved_reversal
  BEFORE UPDATE ON product_addition_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_approved_status_reversal();

-- =============================================================================
-- 4. المزامنة عند الموافقة: catalog_waste_materials ثم waste_data_admin
--    (stock_exchange يتطلب category_id/subcategory_id UUID و region_id - يُدار من التطبيق)
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_approved_product_to_catalog()
RETURNS TRIGGER AS $$
DECLARE
  v_catalog_id BIGINT;
  v_waste_data_id UUID;
  v_waste_no TEXT;
  v_next_seq BIGINT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- 1. إدراج في catalog_waste_materials (لا يوجد عمود name، نستخدم notes)
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_next_seq FROM catalog_waste_materials;
    v_waste_no := 'WASTE-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(v_next_seq::TEXT, 6, '0');
    INSERT INTO catalog_waste_materials (
      waste_no, main_category_id, sub_category_id, expected_price, notes, created_at
    ) VALUES (
      v_waste_no, NEW.main_category_id, NEW.sub_category_id, NEW.proposed_price,
      NEW.product_name, NOW()
    )
    RETURNING id INTO v_catalog_id;
    NEW.catalog_waste_id := v_catalog_id;

    -- 2. إدراج في waste_data_admin (category_id اختياري؛ subcategory_id من الطلب)
    INSERT INTO waste_data_admin (
      name, description, weight, price, quantity, points, initial_points,
      subcategory_id, points_mode, pricing_mode, calculated_price, calculated_points
    ) VALUES (
      NEW.product_name,
      COALESCE(NEW.description, ''),
      1,
      COALESCE(NEW.proposed_price::double precision, 0),
      0,
      0,
      0,
      NEW.sub_category_id,
      'per_kg',
      'per_kg',
      COALESCE(NEW.proposed_price, 0),
      0
    )
    RETURNING id INTO v_waste_data_id;
    NEW.waste_data_id := v_waste_data_id;

    PERFORM pg_notify('product_approved', json_build_object(
      'request_id', NEW.id,
      'catalog_waste_id', v_catalog_id,
      'waste_data_id', v_waste_data_id
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_approved_product ON product_addition_requests;
CREATE TRIGGER trigger_sync_approved_product
  BEFORE UPDATE ON product_addition_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION sync_approved_product_to_catalog();

-- =============================================================================
-- 5. تحديث updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_product_addition_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_requests_updated_at ON product_addition_requests;
CREATE TRIGGER trigger_product_requests_updated_at
  BEFORE UPDATE ON product_addition_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_product_addition_requests_updated_at();

-- =============================================================================
-- 6. RLS
-- =============================================================================
ALTER TABLE product_addition_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON product_addition_requests;
CREATE POLICY "Users can view their own requests"
  ON product_addition_requests FOR SELECT
  USING (auth.uid() = requested_by_user_id);

-- مديرو المخلفات يرون الكل (التحقق من الصلاحيات عبر جدول admins أو user_permissions حسب مشروعك)
DROP POLICY IF EXISTS "Authenticated users can view all requests" ON product_addition_requests;
CREATE POLICY "Authenticated users can view all requests"
  ON product_addition_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create requests" ON product_addition_requests;
CREATE POLICY "Users can create requests"
  ON product_addition_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by_user_id);

DROP POLICY IF EXISTS "Authenticated can update for review" ON product_addition_requests;
CREATE POLICY "Authenticated can update for review"
  ON product_addition_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- تدقيق: قراءة فقط للمستخدمين المصرح لهم
ALTER TABLE product_addition_requests_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read audit" ON product_addition_requests_audit;
CREATE POLICY "Authenticated read audit"
  ON product_addition_requests_audit FOR SELECT
  TO authenticated
  USING (true);
