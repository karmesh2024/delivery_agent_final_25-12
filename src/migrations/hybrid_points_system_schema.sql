-- =================================================================
-- Hybrid Points System Migration
-- تاريخ: يناير 2026
-- الهدف: تنفيذ نظام النقاط الهجين (Wallet + Store Points)
-- المرجع: docs/دليل_التنفيذ_للداش_بورد.md
-- =================================================================

-- ================================================================
-- 1) تحديث جدول new_profiles / profiles / customers
-- ملاحظة: new_profiles هو الجدول الأساسي للعملاء في تطبيق العملاء
-- ================================================================

-- تحديث new_profiles أولاً (الجدول الأساسي للعملاء)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
    ALTER TABLE public.new_profiles
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS store_points INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.new_profiles.wallet_balance IS 
    'المحفظة المالية - فلوس حقيقية قابلة للسحب النقدي (بالجنيه) - الجدول الأساسي للعملاء';
    COMMENT ON COLUMN public.new_profiles.store_points IS 
    'نقاط المتجر - للتحفيز والتسويق (منتجات/خصومات/هدايا) - غير قابلة للسحب النقدي - الجدول الأساسي للعملاء';
  END IF;
END $$;

-- تحديث profiles إن وجد (للتوافق مع الأنظمة القديمة)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS store_points INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.profiles.wallet_balance IS 
    'المحفظة المالية - فلوس حقيقية قابلة للسحب النقدي (بالجنيه)';
    COMMENT ON COLUMN public.profiles.store_points IS 
    'نقاط المتجر - للتحفيز والتسويق (منتجات/خصومات/هدايا) - غير قابلة للسحب النقدي';
  END IF;
END $$;

-- تحديث customers إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS store_points INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.customers.wallet_balance IS 
    'المحفظة المالية - فلوس حقيقية قابلة للسحب النقدي (بالجنيه)';
    COMMENT ON COLUMN public.customers.store_points IS 
    'نقاط المتجر - للتحفيز والتسويق (منتجات/خصومات/هدايا) - غير قابلة للسحب النقدي';
  END IF;
END $$;

-- ================================================================
-- 2) تحديث جدول waste_collection_sessions
-- ================================================================

DO $$
BEGIN
  -- التأكد من وجود الجدول
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_sessions') THEN
    ALTER TABLE public.waste_collection_sessions
    ADD COLUMN IF NOT EXISTS total_value NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS base_points INTEGER,
    ADD COLUMN IF NOT EXISTS bonus_points INTEGER,
    ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.waste_collection_sessions.total_value IS 
    'القيمة المالية الإجمالية للجلسة (بالجنيه)';
    COMMENT ON COLUMN public.waste_collection_sessions.base_points IS 
    'النقاط الأساسية - تذهب للمحفظة المالية';
    COMMENT ON COLUMN public.waste_collection_sessions.bonus_points IS 
    'نقاط البونص - تذهب لنقاط المتجر';
    COMMENT ON COLUMN public.waste_collection_sessions.is_settled IS 
    'هل تم تسوية الجلسة؟ - لا يمكن السحب إلا بعد التسوية';
  END IF;
END $$;

-- ================================================================
-- 3) تحديث جدول waste_collection_items
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_items') THEN
    ALTER TABLE public.waste_collection_items
    ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);
    
    COMMENT ON COLUMN public.waste_collection_items.unit_price IS 
    'سعر البورصة المجمد عند الجلسة (لا يتغير مهما تغيرت البورصة لاحقاً)';
  END IF;
END $$;

-- ================================================================
-- 4) إنشاء جدول points_transactions (Audit Log)
-- ================================================================

-- إنشاء جدول points_transactions إن لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    
    type TEXT NOT NULL,
    -- wallet: معاملة محفظة مالية
    -- store: معاملة نقاط متجر
    
    amount INTEGER NOT NULL,
    -- موجب للإيداع، سالب للسحب
    
    before_balance INTEGER NOT NULL,
    after_balance INTEGER NOT NULL,
    -- حسب النوع: wallet_balance أو store_points
    
    source TEXT,
    -- waste_collection_session, redemption, admin_adjustment, etc.
    
    reference_id UUID,
    -- معرف المرجع (session_id, redemption_id, etc.)
    
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة الأعمدة المفقودة إن كان الجدول موجوداً بالفعل
DO $$
BEGIN
  -- إضافة type إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN type TEXT NOT NULL DEFAULT 'wallet';
    
    -- تحديث القيم الموجودة إذا كانت هناك بيانات
    UPDATE public.points_transactions
    SET type = 'wallet'
    WHERE type IS NULL;
  END IF;
  
  -- إضافة amount إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN amount INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- إضافة before_balance إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'before_balance'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN before_balance INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- إضافة after_balance إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'after_balance'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN after_balance INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- إضافة reference_id إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN reference_id UUID;
  END IF;
  
  -- إضافة source إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN source TEXT;
  END IF;
  
  -- إضافة description إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN description TEXT;
  END IF;
  
  -- إضافة created_by إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN created_by UUID;
  END IF;
  
  -- إضافة created_at إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- إضافة constraint للـ type إن لم يكن موجوداً (بعد التأكد من وجود العمود)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_transactions_type_check'
  ) THEN
    ALTER TABLE public.points_transactions
    ADD CONSTRAINT points_transactions_type_check 
    CHECK (type IN ('wallet', 'store'));
  END IF;
END $$;

-- إنشاء الفهارس (بعد التأكد من وجود الأعمدة)
DO $$
BEGIN
  -- فهرس profile_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'profile_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_points_transactions_profile 
    ON public.points_transactions(profile_id);
  END IF;
  
  -- فهرس created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_points_transactions_created 
    ON public.points_transactions(created_at);
  END IF;
  
  -- فهرس reference_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'reference_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_points_transactions_reference 
    ON public.points_transactions(reference_id);
  END IF;
  
  -- فهرس type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'points_transactions' 
    AND column_name = 'type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_points_transactions_type 
    ON public.points_transactions(type);
  END IF;
END $$;

COMMENT ON TABLE public.points_transactions IS 
'سجل تدقيق لجميع معاملات النقاط (المحفظة المالية ونقاط المتجر)';

-- ================================================================
-- 5) إنشاء/تحديث جدول points_redemptions
-- ================================================================

CREATE TABLE IF NOT EXISTS public.points_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    points_redeemed INTEGER NOT NULL,
    amount_egp NUMERIC(10,2) DEFAULT 0,
    redemption_type VARCHAR(50) DEFAULT 'cash' CHECK (redemption_type IN ('cash', 'product', 'gift', 'donation')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'cancelled')),
    reference_number TEXT,
    notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث الحقول إن كان الجدول موجوداً بالفعل
DO $$
BEGIN
  ALTER TABLE public.points_redemptions
  ADD COLUMN IF NOT EXISTS redemption_type VARCHAR(50) DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS processed_by UUID,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_points_redemptions_customer 
ON public.points_redemptions(customer_id);

CREATE INDEX IF NOT EXISTS idx_points_redemptions_status 
ON public.points_redemptions(status);

CREATE INDEX IF NOT EXISTS idx_points_redemptions_type 
ON public.points_redemptions(redemption_type);

COMMENT ON TABLE public.points_redemptions IS 
'جدول طلبات استبدال النقاط (سحب نقدي، منتجات، هدايا)';

-- ================================================================
-- 6) إنشاء جدول points_configuration إن لم يكن موجوداً
-- ================================================================

CREATE TABLE IF NOT EXISTS public.points_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_egp INTEGER NOT NULL DEFAULT 100,
    min_redemption_points INTEGER DEFAULT 1000,
    max_daily_redeem_amount NUMERIC(10,2) DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج إعدادات افتراضية إن لم تكن موجودة
INSERT INTO public.points_configuration (points_per_egp, min_redemption_points, max_daily_redeem_amount, is_active)
SELECT 100, 1000, 1000, true
WHERE NOT EXISTS (SELECT 1 FROM public.points_configuration WHERE is_active = true);

COMMENT ON TABLE public.points_configuration IS 
'إعدادات نظام النقاط (معامل التحويل، الحدود، إلخ)';

-- ================================================================
-- 7) تفعيل RLS على الجداول الجديدة
-- ================================================================

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_configuration ENABLE ROW LEVEL SECURITY;

-- سياسات points_transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.points_transactions;
CREATE POLICY "Admins can view all transactions" ON public.points_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.points_transactions;
CREATE POLICY "Users can view own transactions" ON public.points_transactions
FOR SELECT USING (
  auth.uid() = profile_id
);

DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;
CREATE POLICY "System can insert transactions" ON public.points_transactions
FOR INSERT WITH CHECK (true);

-- سياسات points_redemptions
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.points_redemptions;
CREATE POLICY "Admins can view all redemptions" ON public.points_redemptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can view own redemptions" ON public.points_redemptions;
CREATE POLICY "Users can view own redemptions" ON public.points_redemptions
FOR SELECT USING (
  auth.uid() = customer_id
);

DROP POLICY IF EXISTS "Users can create own redemptions" ON public.points_redemptions;
CREATE POLICY "Users can create own redemptions" ON public.points_redemptions
FOR INSERT WITH CHECK (
  auth.uid() = customer_id
);

DROP POLICY IF EXISTS "Admins can update redemptions" ON public.points_redemptions;
CREATE POLICY "Admins can update redemptions" ON public.points_redemptions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true
  )
);

-- سياسات points_configuration
DROP POLICY IF EXISTS "Admins can manage configuration" ON public.points_configuration;
CREATE POLICY "Admins can manage configuration" ON public.points_configuration
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Everyone can view active configuration" ON public.points_configuration;
CREATE POLICY "Everyone can view active configuration" ON public.points_configuration
FOR SELECT USING (is_active = true);

-- ================================================================
-- نهاية Migration Schema
-- ================================================================
