-- 🧪 إضافة عضو تجريبي (Demo User) للدائرة
-- لتمكين تجربة المحادثة الخاصة

-- 1. إنشاء مستخدم وهمي في جدول البروفايل (لأننا لا نستطيع الإضافة لـ auth.users بسهولة، لكن new_profiles يكفي للعرض)
insert into public.new_profiles (id, full_name, avatar_url, role)
values (
    '00000000-0000-0000-0000-000000000001', -- Fake UUID
    'عضو تجريبي (Demo)',
    'https://api.dicebear.com/9.x/micah/svg?seed=demo',
    'customer'
)
on conflict (id) do nothing;

-- 2. إضافته للدائرة
insert into public.zoon_circle_members (circle_id, user_id, role)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- Circle ID
    '00000000-0000-0000-0000-000000000001', -- Demo User ID
    'member'
)
on conflict do nothing;
