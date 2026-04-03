-- 🧪 إضافة عضو تجريبي (Demo User) - مصحح
-- تم إزالة عمود 'role' من جدول new_profiles

-- 1. إنشاء مستخدم وهمي (بدون role)
insert into public.new_profiles (id, full_name, avatar_url)
values (
    '00000000-0000-0000-0000-000000000001', -- Fake UUID
    'عضو تجريبي (Demo)',
    'https://api.dicebear.com/9.x/micah/svg?seed=demo'
)
on conflict (id) do nothing;

-- 2. إضافته للدائرة (هنا يوجد role وهو صحيح)
insert into public.zoon_circle_members (circle_id, user_id, role)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- Circle ID
    '00000000-0000-0000-0000-000000000001', -- Demo User ID
    'member'
)
on conflict do nothing;

-- 3. (اختياري) التأكد من أن RLS معطل للمحادثات الخاصة لكي تعمل التجربة
alter table public.zoon_direct_chats disable row level security;
alter table public.zoon_direct_messages disable row level security;
