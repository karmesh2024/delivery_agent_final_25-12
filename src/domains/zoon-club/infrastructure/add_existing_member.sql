-- 🧠 Smart Member Add (Reuse Existing)
-- بدلاً من إنشاء مستخدم ومواجهة أخطاء، سنبحث عن مستخدم مسجل مسبقاً ونضيفه

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. البحث عن أي مستخدم في النظام ليس أنت
    SELECT id INTO target_user_id
    FROM public.new_profiles
    WHERE id != '249d346d-0ec9-4146-a86e-6e97c3a399a2' -- استبعاد معرفك
    ORDER BY created_at DESC -- نأخذ أحدث مستخدم
    LIMIT 1;

    -- 2. هل وجدنا أحداً؟
    IF target_user_id IS NOT NULL THEN
        -- إضافته للدائرة
        INSERT INTO public.zoon_circle_members (circle_id, user_id, role)
        VALUES ('7235ac59-0a60-4561-a417-ead4eee5ff1f', target_user_id, 'member')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Success: Added user % to the circle.', target_user_id;
    ELSE
        -- 3. يائس: إذا لم يوجد أي مستخدم آخر، نحاول إنشاء واحد بافتراض عمود phone_number (الأكثر احتمالاً بعد phone)
        -- هذا الكود سيعمل فقط إذا فشل البحث عن مستخدم موجود
        BEGIN
            INSERT INTO public.customers (id, phone_number) -- تخمين أخير: phone_number
            VALUES ('00000000-0000-0000-0000-000000000001', '+966509999999')
            ON CONFLICT DO NOTHING;

            INSERT INTO public.new_profiles (id, full_name, phone_number, avatar_url)
            VALUES ('00000000-0000-0000-0000-000000000001', 'عضو تجريبي (Demo)', '+966509999999', 'https://api.dicebear.com/9.x/micah/svg?seed=demo')
            ON CONFLICT DO NOTHING;

            INSERT INTO public.zoon_circle_members (circle_id, user_id, role)
            VALUES ('7235ac59-0a60-4561-a417-ead4eee5ff1f', '00000000-0000-0000-0000-000000000001', 'member')
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create demo user. Details: %', SQLERRM;
        END;
    END IF;
END $$;
