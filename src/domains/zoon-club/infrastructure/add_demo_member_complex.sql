-- 🧪 إضافة عضو تجريبي (Complex Version)
-- يحترم التراتبية: customers -> new_profiles -> circle members

-- 1. إضافة العميل الأساسي (Customers Table)
-- (نفترض وجود جدول customers، وإذا كان id من نوع uuid)
insert into public.customers (id, phone)
values (
    '00000000-0000-0000-0000-000000000001', 
    '+966500000000'
)
on conflict (id) do nothing;

-- 2. إضافة البروفايل (New Profiles)
insert into public.new_profiles (id, full_name, phone_number, avatar_url)
values (
    '00000000-0000-0000-0000-000000000001', -- نفس الـ ID للربط
    'عضو تجريبي (Demo)',
    '+966500000000', -- يجب أن يطابق
    'https://api.dicebear.com/9.x/micah/svg?seed=demo'
)
on conflict (id) do nothing;

-- 3. إضافته للدائرة
insert into public.zoon_circle_members (circle_id, user_id, role)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- Circle ID
    '00000000-0000-0000-0000-000000000001', 
    'member'
)
on conflict do nothing;

-- 4. تعطيل RLS للمحادثات (تذكير)
alter table public.zoon_direct_chats disable row level security;
alter table public.zoon_direct_messages disable row level security;
