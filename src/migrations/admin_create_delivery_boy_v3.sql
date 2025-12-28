-- Function for creating delivery boys with improved error handling and duplicate checks
CREATE OR REPLACE FUNCTION public.admin_create_delivery_boy_v3(
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
    profile_id UUID;
    current_timestamp TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- التحقق من البيانات المطلوبة
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'معرف المستخدم (p_user_id) مطلوب ولا يمكن أن يكون فارغاً'
        );
    END IF;
    
    IF p_full_name IS NULL OR p_phone IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'البيانات المطلوبة مفقودة: الاسم الكامل ورقم الهاتف حقول إلزامية'
        );
    END IF;
    
    -- التحقق من وجود رقم هاتف مكرر
    IF EXISTS (SELECT 1 FROM public.delivery_boys WHERE phone = p_phone AND id != p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'يوجد مندوب بنفس رقم الهاتف مسجل بالفعل',
            'field', 'phone'
        );
    END IF;
    
    -- التحقق من وجود بريد إلكتروني مكرر
    IF p_email IS NOT NULL AND EXISTS (SELECT 1 FROM public.delivery_boys WHERE email = p_email AND id != p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'البريد الإلكتروني مستخدم بالفعل من قبل مندوب آخر',
            'field', 'email'
        );
    END IF;
    
    -- التحقق من وجود رقم هوية مكرر
    IF p_national_id IS NOT NULL AND p_national_id != '000000000' AND EXISTS (
        SELECT 1 FROM public.delivery_boys WHERE national_id = p_national_id AND id != p_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'يوجد مندوب بنفس الرقم القومي مسجل بالفعل',
            'field', 'national_id'
        );
    END IF;
    
    -- محاولة الإدراج في جدول delivery_boys
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
            'pending',
            current_timestamp,
            current_timestamp,
            p_preferred_language,
            p_date_of_birth,
            p_license_number,
            COALESCE(p_owner_id, p_user_id)
        )
        RETURNING to_jsonb(delivery_boys.*) INTO result;
    EXCEPTION 
        WHEN unique_violation THEN
            -- في حالة تكرار المفتاح، نعيد رسالة خطأ محددة
            RETURN jsonb_build_object(
                'success', false,
                'error', 'فشل إنشاء سجل المندوب: أحد الحقول الفريدة مكرر',
                'details', SQLERRM
            );
        WHEN OTHERS THEN
            -- في حالة أي خطأ آخر، نعيد تفاصيل الخطأ
            RETURN jsonb_build_object(
                'success', false,
                'error', 'فشل إنشاء سجل المندوب في جدول delivery_boys',
                'details', SQLERRM
            );
    END;
    
    -- إدراج سجل في جدول new_profiles_delivery - نستخدم نفس المعرف
    BEGIN
        INSERT INTO public.new_profiles_delivery (
            id, 
            phone, 
            email, 
            full_name, 
            national_id, 
            preferred_vehicle,
            license_number,
            delivery_code,
            status,
            online_status,
            completed_trips,
            cancelled_trips,
            avg_rating,
            avg_delivery_time,
            is_active,
            suspension_reason,
            preferred_language,
            referral_code,
            created_at,
            updated_at,
            suspension_end_date,
            avatar_url,
            account_status,
            fleet_id,
            violation_count,
            available_for_delivery,
            current_latitude,
            current_longitude
        ) VALUES (
            p_user_id, -- استخدام نفس المعرف المقدم كمعلمة
            p_phone,
            p_email,
            p_full_name,
            p_national_id,
            p_preferred_vehicle::public.vehicle_type,
            p_license_number,
            p_delivery_code,
            'pending',
            NULL,
            0,
            0,
            0.0,
            0.0,
            TRUE,
            NULL,
            p_preferred_language,
            p_referral_code,
            current_timestamp,
            current_timestamp,
            NULL,
            NULL,
            'pending',
            NULL,
            0,
            NULL,
            NULL,
            NULL
        );
    EXCEPTION 
        WHEN unique_violation THEN
            -- إذا حدث خطأ تكرار، نحاول التحديث بدلاً من ذلك
            UPDATE public.new_profiles_delivery
            SET 
                phone = p_phone,
                email = p_email,
                full_name = p_full_name,
                national_id = p_national_id,
                preferred_vehicle = p_preferred_vehicle::public.vehicle_type,
                license_number = p_license_number,
                delivery_code = p_delivery_code,
                referral_code = p_referral_code,
                preferred_language = p_preferred_language,
                updated_at = current_timestamp
            WHERE id = p_user_id;
        WHEN OTHERS THEN
            -- إذا حدث خطأ آخر في جدول new_profiles_delivery، نعيد معلومات delivery_boys على الأقل
            RETURN jsonb_build_object(
                'success', true,
                'warning', 'تم إنشاء سجل المندوب الرئيسي بنجاح، لكن فشل تحديث الملف الشخصي الإضافي',
                'delivery_boy', result,
                'error_details', SQLERRM
            );
    END;
    
    -- إعادة البيانات الكاملة
    RETURN jsonb_build_object(
        'success', true,
        'delivery_boy', result
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        -- في حالة أي خطأ آخر غير معالج
        RETURN jsonb_build_object(
            'success', false,
            'error', 'حدث خطأ غير متوقع أثناء إنشاء سجل المندوب',
            'details', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 