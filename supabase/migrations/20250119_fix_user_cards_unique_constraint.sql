-- Fix unique_primary_card_per_wallet constraint issue
-- This migration addresses the duplicate key error when creating default user cards

-- =================================================================
-- 1. إنشاء/تحديث القيد الفريد للبطاقة الأساسية (Partial Unique Index)
-- =================================================================

-- حذف القيد القديم إن كان موجوداً كـ CONSTRAINT
DO $$
BEGIN
  -- محاولة حذف القيد القديم إن كان موجوداً
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_primary_card_per_wallet'
  ) THEN
    ALTER TABLE public.user_cards 
    DROP CONSTRAINT IF EXISTS unique_primary_card_per_wallet;
  END IF;
END $$;

-- إنشاء Partial Unique Index بدلاً من CONSTRAINT
-- هذا يضمن وجود بطاقة أساسية واحدة فقط لكل محفظة
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_card_per_wallet 
ON public.user_cards (wallet_id) 
WHERE is_primary = true;

COMMENT ON INDEX unique_primary_card_per_wallet IS 
'يضمن وجود بطاقة أساسية واحدة فقط لكل محفظة (is_primary = true)';

-- =================================================================
-- 2. تحديث دالة create_default_user_card لتجاهل التكرار
-- =================================================================

CREATE OR REPLACE FUNCTION public.create_default_user_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  default_card_type_id uuid;
  default_wallet_id uuid;
  user_email text;
  existing_primary_card_exists boolean;
BEGIN
  -- الحصول على نوع الكارد الافتراضي
  SELECT id INTO default_card_type_id 
  FROM public.card_types 
  WHERE is_default = true 
  LIMIT 1;
  
  -- الحصول على المحفظة الافتراضية للمستخدم
  SELECT id INTO default_wallet_id 
  FROM public.wallets 
  WHERE user_id = NEW.user_id 
    AND wallet_type = 'CUSTOMER_HOME'::public.wallet_type_enum
  LIMIT 1;
  
  -- التحقق من وجود بطاقة أساسية موجودة مسبقاً
  SELECT EXISTS(
    SELECT 1 FROM public.user_cards 
    WHERE wallet_id = default_wallet_id 
      AND is_primary = true
  ) INTO existing_primary_card_exists;
  
  -- إذا كانت هناك بطاقة أساسية موجودة، لا ننشئ واحدة جديدة
  IF existing_primary_card_exists THEN
    RETURN NEW;
  END IF;
  
  -- الحصول على email المستخدم بدلاً من full_name
  SELECT email INTO user_email
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- إنشاء كارد افتراضي فقط إذا لم تكن هناك بطاقة أساسية موجودة
  -- التحقق المسبق يمنع التكرار، لكن نستخدم EXCEPTION كحماية إضافية
  BEGIN
    INSERT INTO public.user_cards (
      user_id,
      wallet_id,
      card_type_id,
      card_number,
      card_holder_name,
      expiry_date,
      cvv,
      is_primary,
      balance
    ) VALUES (
      NEW.user_id,
      default_wallet_id,
      default_card_type_id,
      generate_card_number(),
      COALESCE(user_email, 'User'),
      -- MM/YY بطول 5 فقط
      LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0')
        || '/'
        || RIGHT((EXTRACT(YEAR FROM NOW())::int + 5)::text, 2),
      LPAD(FLOOR(random() * 1000)::text, 3, '0'),
      true,
      NEW.balance
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- في حالة وجود انتهاك للقيد الفريد (بطاقة أساسية موجودة)، نتجاهل الخطأ
      -- هذا يحدث فقط في حالة race condition نادرة
      NULL;
  END;
  
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.create_default_user_card IS 
'إنشاء بطاقة افتراضية للمستخدم عند إنشاء محفظة - تتجاهل التكرار';

-- =================================================================
-- 3. إنشاء دالة لتعيين البطاقة الأساسية بأمان
-- =================================================================

CREATE OR REPLACE FUNCTION public.set_primary_card(
  p_card_id UUID,
  p_wallet_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- إلغاء تفعيل جميع البطاقات الأساسية للمحفظة
  UPDATE user_cards
  SET is_primary = false,
      updated_at = NOW()
  WHERE wallet_id = p_wallet_id
    AND is_primary = true
    AND id != p_card_id;

  -- تفعيل البطاقة المطلوبة
  UPDATE user_cards
  SET is_primary = true,
      updated_at = NOW()
  WHERE id = p_card_id
    AND wallet_id = p_wallet_id
  RETURNING json_build_object(
    'id', id,
    'wallet_id', wallet_id,
    'is_primary', is_primary,
    'card_number', card_number,
    'card_holder_name', card_holder_name
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Card not found or does not belong to the specified wallet';
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.set_primary_card IS 
'تعيين بطاقة كبطاقة أساسية بأمان - يلغي تفعيل البطاقات الأخرى تلقائياً';
