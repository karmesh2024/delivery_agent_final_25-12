-- 🧪 إضافة عضو تجريبي (Demo User) - النسخة النهائية
-- تم إضافة رقم هاتف وهمي لتجاوز قيد NOT NULL

-- 1. إنشاء مستخدم وهمي ببيانات كاملة
insert into public.new_profiles (id, full_name, avatar_url, phone_number)
values (
    '00000000-0000-0000-0000-000000000001', -- Fake UUID
    'عضو تجريبي (Demo)',
    'https://api.dicebear.com/9.x/micah/svg?seed=demo',
    '+966500000000' -- رقم وهمي
)
on conflict (id) do update 
set full_name = EXCLUDED.full_name; -- تحديث الاسم للتأكد

-- 2. إضافته للدائرة
insert into public.zoon_circle_members (circle_id, user_id, role)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- Circle ID
    '00000000-0000-0000-0000-000000000001', -- Demo User ID
    'member'
)
on conflict do nothing;

-- 3. تذكير: تأكد من تشغيل ملف Events إذا لم تفعل
-- لأنه يكمل الميزات المتبقية
