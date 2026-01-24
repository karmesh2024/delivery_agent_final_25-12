-- ================================================================
-- Create recycling_conversion_requests table (Standalone)
-- ================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS recycling_conversion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  recycling_points INTEGER NOT NULL CHECK (recycling_points > 0),
  club_points_expected INTEGER NOT NULL CHECK (club_points_expected > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  processed_by UUID REFERENCES new_profiles(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recycling_requests_user ON recycling_conversion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_status ON recycling_conversion_requests(status);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_created_at ON recycling_conversion_requests(created_at DESC);

-- Add comments
COMMENT ON TABLE recycling_conversion_requests IS 'طلبات تحويل نقاط المخلفات إلى نقاط النادي (Request Only) في V1.3';
COMMENT ON COLUMN recycling_conversion_requests.user_id IS 'المستخدم صاحب الطلب';
COMMENT ON COLUMN recycling_conversion_requests.recycling_points IS 'عدد نقاط المخلفات المطلوب تحويلها';
COMMENT ON COLUMN recycling_conversion_requests.club_points_expected IS 'عدد نقاط النادي المتوقع (حسب النسبة الثابتة)';
COMMENT ON COLUMN recycling_conversion_requests.status IS 'حالة الطلب: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN recycling_conversion_requests.processed_by IS 'الأدمن الذي قام بمعالجة الطلب';
COMMENT ON COLUMN recycling_conversion_requests.processed_at IS 'تاريخ معالجة الطلب';
COMMENT ON COLUMN recycling_conversion_requests.rejection_reason IS 'سبب الرفض (إن وجد)';

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_recycling_conversion_requests_updated_at ON recycling_conversion_requests;
CREATE TRIGGER update_recycling_conversion_requests_updated_at
  BEFORE UPDATE ON recycling_conversion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
