-- 🚀 إعداد الدائرة الجديدة (0da0e990...)
-- نقوم بنقل الأعضاء لهذه الدائرة الجديدة لتظهر البيانات

-- 1. التأكد من وجود الدائرة
insert into public.zoon_circles (id, name, description)
values (
    '0da0e990-6689-4164-8f8f-394c80649d8e', -- ID من الصورة الأخيرة
    'دائرة النقاش (New Circle)',
    'تم تهيئة هذه الدائرة للدردشة'
)
on conflict (id) do nothing;

-- 2. إضافتك أنت (Admin)
insert into public.zoon_circle_members (circle_id, user_id, role)
values (
    '0da0e990-6689-4164-8f8f-394c80649d8e',
    '249d346d-0ec9-4146-a86e-6e97c3a399a2', -- معرفك
    'admin'
)
on conflict (circle_id, user_id) do nothing;

-- 3. إضافة العضو التجريبي (Demo User) أو أي عضو آخر
insert into public.zoon_circle_members (circle_id, user_id, role)
select 
    '0da0e990-6689-4164-8f8f-394c80649d8e',
    id,
    'member'
from public.new_profiles
where id != '249d346d-0ec9-4146-a86e-6e97c3a399a2'
limit 1
on conflict (circle_id, user_id) do nothing;

-- 4. ضمان الصلاحيات (RLS)
alter table public.zoon_circle_messages disable row level security;
alter table public.zoon_direct_chats disable row level security;
alter table public.zoon_direct_messages disable row level security;
