-- RLS Policies for Purchasing, Warehouse, and Pricing Management

-- 1. منع المخازن من رؤية سعر التكلفة في warehouse_invoice_items
-- فقط إدارة التسعير يمكنها رؤية unit_price

-- Policy: إدارة المشتريات يمكنها رؤية كل شيء
CREATE POLICY IF NOT EXISTS "purchasing_management_full_access"
ON public.warehouse_invoices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admins a ON a.user_id = u.id
    JOIN public.role_permissions rp ON a.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE u.id = auth.uid()
    AND p.code IN ('purchasing:invoices:view', 'purchasing:invoices:create', 'purchasing:invoices:edit')
  )
);

-- Policy: إدارة التسعير يمكنها رؤية الفواتير والأسعار
CREATE POLICY IF NOT EXISTS "pricing_management_view_invoices"
ON public.warehouse_invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admins a ON a.user_id = u.id
    JOIN public.role_permissions rp ON a.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE u.id = auth.uid()
    AND p.code = 'pricing:view'
  )
);

-- Policy: المخازن يمكنها رؤية الفواتير ولكن بدون unit_price
-- سنستخدم view منفصل أو نعتمد على API filtering

-- 2. منع المخازن من رؤية unit_price في warehouse_invoice_items
-- سنستخدم API filtering بدلاً من RLS مباشرة لأن Prisma لا يدعم RLS بشكل كامل

-- 3. منع المخازن من رؤية product_pricing (أسعار البيع)
CREATE POLICY IF NOT EXISTS "prevent_warehouse_from_viewing_pricing"
ON public.product_pricing
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admins a ON a.user_id = u.id
    JOIN public.role_permissions rp ON a.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE u.id = auth.uid()
    AND p.code = 'pricing:view'
  )
);

-- 4. منع المخازن من تعديل الأسعار
CREATE POLICY IF NOT EXISTS "prevent_warehouse_from_setting_pricing"
ON public.product_pricing
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admins a ON a.user_id = u.id
    JOIN public.role_permissions rp ON a.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE u.id = auth.uid()
    AND p.code = 'pricing:set'
  )
);

-- 5. منع المخازن من رؤية cost_price في product_pricing
-- سنستخدم API filtering في الكود

-- ملاحظة: RLS policies تعمل على مستوى قاعدة البيانات
-- لكننا نستخدم Prisma، لذا سنعتمد على API filtering في الكود

