-- ================================================================
-- RLS Policies for recycling_conversion_requests
-- ================================================================

-- Enable RLS
ALTER TABLE recycling_conversion_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own conversion requests" ON recycling_conversion_requests;
DROP POLICY IF EXISTS "Users can create own conversion requests" ON recycling_conversion_requests;
DROP POLICY IF EXISTS "Admins can view all conversion requests" ON recycling_conversion_requests;
DROP POLICY IF EXISTS "Admins can update conversion requests" ON recycling_conversion_requests;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own conversion requests"
  ON recycling_conversion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create own conversion requests"
  ON recycling_conversion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all requests
-- Note: Admin is identified by existence in admins table
CREATE POLICY "Admins can view all conversion requests"
  ON recycling_conversion_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Policy: Admins can update requests (approve/reject)
CREATE POLICY "Admins can update conversion requests"
  ON recycling_conversion_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

COMMENT ON POLICY "Users can view own conversion requests" ON recycling_conversion_requests IS 'السماح للمستخدمين بعرض طلباتهم الخاصة';
COMMENT ON POLICY "Users can create own conversion requests" ON recycling_conversion_requests IS 'السماح للمستخدمين بإنشاء طلبات تحويل خاصة بهم';
COMMENT ON POLICY "Admins can view all conversion requests" ON recycling_conversion_requests IS 'السماح للأدمن بعرض جميع الطلبات';
COMMENT ON POLICY "Admins can update conversion requests" ON recycling_conversion_requests IS 'السماح للأدمن بالموافقة/الرفض على الطلبات';
