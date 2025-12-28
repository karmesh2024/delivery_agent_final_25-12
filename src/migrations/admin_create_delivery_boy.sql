-- Function for creating delivery boys
CREATE OR REPLACE FUNCTION public.admin_create_delivery_boy(
    p_user_id UUID,
    p_full_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_delivery_code TEXT,
    p_referral_code TEXT,
    p_national_id TEXT DEFAULT '000000000',
    p_preferred_vehicle TEXT DEFAULT 'tricycle',
    p_preferred_language TEXT DEFAULT 'ar',
    p_date_of_birth DATE DEFAULT NULL,
    p_license_number TEXT DEFAULT NULL,
    p_owner_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- التحقق من البيانات المطلوبة
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id is required and cannot be null.';
    END IF;
    IF p_full_name IS NULL OR p_phone IS NULL THEN
        RAISE EXCEPTION 'البيانات المطلوبة مفقودة: p_full_name, p_phone هي حقول إلزامية';
    END IF;
    
    -- طباعة القيم للتشخيص
    RAISE NOTICE 'إنشاء مندوب: ID=%, NAME=%, PHONE=%, DOB=%, LICENSE=%, VEHICLE=%', p_user_id, p_full_name, p_phone, p_date_of_birth, p_license_number, p_preferred_vehicle;
    
    -- محاولة الإدراج في جدول delivery_boys مع التعامل مع خطأ التكرار
    BEGIN
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
            owner_id
        ) VALUES (
            p_user_id,
            p_full_name,
            p_phone,
            p_email,
            p_delivery_code,
            p_referral_code,
            p_national_id,
            p_preferred_vehicle::public.vehicle_type,
            'inactive',
            current_timestamp,
            current_timestamp,
            p_preferred_language,
            p_date_of_birth,
            p_license_number,
            COALESCE(p_owner_id, p_user_id)
        )
        RETURNING to_jsonb(row_to_json(delivery_boys.*)) INTO result;
    EXCEPTION 
        WHEN unique_violation THEN
            -- في حالة تكرار المفتاح، حاول تحديث السجل الموجود
            UPDATE public.delivery_boys
            SET 
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                delivery_code = EXCLUDED.delivery_code,
                referral_code = EXCLUDED.referral_code,
                national_id = EXCLUDED.national_id,
                preferred_vehicle = EXCLUDED.preferred_vehicle::public.vehicle_type,
                status = EXCLUDED.status,
                updated_at = current_timestamp,
                preferred_language = EXCLUDED.preferred_language,
                date_of_birth = EXCLUDED.date_of_birth,
                license_number = EXCLUDED.license_number,
                owner_id = EXCLUDED.owner_id
            WHERE id = p_user_id
            RETURNING to_jsonb(row_to_json(delivery_boys.*)) INTO result;
            
            IF result IS NULL THEN
                RAISE EXCEPTION 'فشل في تحديث سجل المندوب الموجود: %', p_user_id;
            END IF;
    END;
    
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
            p_user_id,
            p_phone,
            p_email,
            p_full_name,
            p_national_id,
            p_preferred_vehicle::public.vehicle_type,
            p_delivery_code,
            p_referral_code,
            'inactive',
            current_timestamp,
            current_timestamp,
            p_preferred_language
        )
        ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            national_id = EXCLUDED.national_id,
            preferred_vehicle = EXCLUDED.preferred_vehicle::public.vehicle_type,
            delivery_code = EXCLUDED.delivery_code,
            referral_code = EXCLUDED.referral_code,
            status = EXCLUDED.status,
            updated_at = current_timestamp,
            preferred_language = EXCLUDED.preferred_language;
    EXCEPTION WHEN OTHERS THEN
        -- تجاهل الخطأ في الإدراج في الجدول الثاني
        RAISE NOTICE 'خطأ في إنشاء/تحديث سجل new_profiles_delivery لـ ID %: %', p_user_id, SQLERRM;
    END;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'فشل في إنشاء سجل مندوب لـ ID %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 