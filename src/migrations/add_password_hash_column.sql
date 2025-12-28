-- Fungsi untuk memeriksa apakah kolom sudah ada
CREATE OR REPLACE FUNCTION public.column_exists(
    tbl text, col text
) RETURNS boolean AS $$
DECLARE
    exists boolean;
BEGIN
    SELECT count(*) > 0 INTO exists
    FROM pg_attribute
    WHERE attrelid = tbl::regclass
    AND attname = col
    AND NOT attisdropped;
    RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Mencoba menambahkan kolom password_hash hanya jika belum ada
DO $$
BEGIN
    IF NOT public.column_exists('delivery_boys', 'password_hash') THEN
        ALTER TABLE public.delivery_boys 
        ADD COLUMN password_hash text;
        RAISE NOTICE 'Kolom password_hash ditambahkan ke tabel delivery_boys';
    ELSE
        RAISE NOTICE 'Kolom password_hash sudah ada di tabel delivery_boys';
    END IF;
END;
$$;

-- Hapus fungsi helper setelah selesai (opsional)
DROP FUNCTION IF EXISTS public.column_exists(text, text);

-- Update admin_create_delivery_boy function jika belum memiliki parameter password_hash
CREATE OR REPLACE FUNCTION public.admin_create_delivery_boy(
    user_id UUID,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    delivery_code TEXT,
    referral_code TEXT,
    national_id TEXT DEFAULT '000000000',
    preferred_vehicle TEXT DEFAULT 'tricycle',
    preferred_language TEXT DEFAULT 'ar',
    p_date_of_birth DATE DEFAULT NULL,
    p_license_number TEXT DEFAULT NULL,
    p_password_hash TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- التحقق من البيانات المطلوبة
    IF user_id IS NULL OR full_name IS NULL OR phone IS NULL THEN
        RAISE EXCEPTION 'البيانات المطلوبة مفقودة: user_id, full_name, phone هي حقول إلزامية';
    END IF;
    
    -- طباعة القيم للتشخيص
    RAISE NOTICE 'إنشاء مندوب: ID=%, NAME=%, PHONE=%, DOB=%, LICENSE=%', user_id, full_name, phone, p_date_of_birth, p_license_number;
    
    -- إدراج سجل في جدول delivery_boys
    INSERT INTO public.delivery_boys (
        id, 
        full_name, 
        phone, 
        email, 
        delivery_code, 
        referral_code, 
        national_id, 
        preferred_vehicle,
        status,
        created_at,
        updated_at,
        preferred_language,
        date_of_birth,
        license_number,
        password_hash
    ) VALUES (
        user_id,
        full_name,
        phone,
        email,
        delivery_code,
        referral_code,
        national_id,
        preferred_vehicle,
        'inactive',
        current_timestamp,
        current_timestamp,
        preferred_language,
        p_date_of_birth,
        p_license_number,
        p_password_hash
    )
    RETURNING to_jsonb(*) INTO result;
    
    -- إدراج سجل في جدول new_profiles_delivery
    BEGIN
        INSERT INTO public.new_profiles_delivery (
            id, 
            phone, 
            email, 
            full_name, 
            national_id, 
            preferred_vehicle,
            delivery_code,
            referral_code,
            status,
            created_at,
            updated_at,
            preferred_language
        ) VALUES (
            user_id,
            phone,
            email,
            full_name,
            national_id,
            preferred_vehicle,
            delivery_code,
            referral_code,
            'inactive',
            current_timestamp,
            current_timestamp,
            preferred_language
        );
    EXCEPTION WHEN OTHERS THEN
        -- تجاهل الخطأ في الإدراج في الجدول الثاني
        RAISE NOTICE 'خطأ في إنشاء سجل new_profiles_delivery: %', SQLERRM;
    END;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'فشل في إنشاء سجل مندوب: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 