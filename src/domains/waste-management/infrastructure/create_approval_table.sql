-- إنشاء جدول طلبات الموافقة على تغيير الأسعار
CREATE TABLE IF NOT EXISTS public.waste_price_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_material_id TEXT NOT NULL, -- معرف المادة من الكتالوج (قد يكون نصاً أو UUID حسب النظام)
    stock_exchange_id INTEGER, -- معرف السجل في البورصة (اختياري للإضافة الجديدة)
    approval_type TEXT NOT NULL CHECK (approval_type IN ('price_change', 'base_price_set')),
    old_price NUMERIC DEFAULT 0,
    new_price NUMERIC NOT NULL,
    price_change_percentage NUMERIC DEFAULT 0,
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES auth.users(id),
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

-- تفعيل RLS
ALTER TABLE public.waste_price_approval_requests ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: الجميع يمكنهم قراءة طلباتهم، والأدمن يمكنه قراءة الكل
CREATE POLICY "Users can see their own requests" ON public.waste_price_approval_requests
    FOR SELECT USING (auth.uid() = requested_by);

CREATE POLICY "Admins can see all requests" ON public.waste_price_approval_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') -- Adjust based on your admin role logic
    );

-- سياسة للإدراج: المستخدم المسجل يمكنه إنشاء طلب
CREATE POLICY "Users can create requests" ON public.waste_price_approval_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- سياسة للتحديث: الأدمن فقط يمكنه الموافقة/الرفض (تحديث الحالة)
CREATE POLICY "Admins can update requests" ON public.waste_price_approval_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- إضافة عمود نسبة التغيير لجدول البورصة إذا لم يكن موجوداً
ALTER TABLE public.stock_exchange ADD COLUMN IF NOT EXISTS price_change_percentage NUMERIC DEFAULT 0;
ALTER TABLE public.stock_exchange ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NOW();
