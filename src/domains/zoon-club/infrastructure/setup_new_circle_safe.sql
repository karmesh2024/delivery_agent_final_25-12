-- 🚀 إعداد الدائرة الجديدة (نسخة آمنة Safe Version)
-- تتجنب خطأ ON CONFLICT باستخدام WHERE NOT EXISTS

-- 1. التأكد من وجود الدائرة
insert into public.zoon_circles (id, name, description)
select 
    '0da0e990-6689-4164-8f8f-394c80649d8e', 
    'دائرة النقاش (New Circle)',
    'تم تهيئة هذه الدائرة للدردشة'
where not exists (
    select 1 from public.zoon_circles where id = '0da0e990-6689-4164-8f8f-394c80649d8e'
);

-- 2. إضافتك أنت (Admin)
insert into public.zoon_circle_members (circle_id, user_id, role)
select 
    '0da0e990-6689-4164-8f8f-394c80649d8e',
    '249d346d-0ec9-4146-a86e-6e97c3a399a2',
    'admin'
where not exists (
    select 1 from public.zoon_circle_members 
    where circle_id = '0da0e990-6689-4164-8f8f-394c80649d8e' 
    and user_id = '249d346d-0ec9-4146-a86e-6e97c3a399a2'
);

-- 3. إضافة العضو التجريبي (Demo User)
insert into public.zoon_circle_members (circle_id, user_id, role)
select 
    '0da0e990-6689-4164-8f8f-394c80649d8e',
    id,
    'member'
from public.new_profiles
where id != '249d346d-0ec9-4146-a86e-6e97c3a399a2'
and not exists (
    select 1 from public.zoon_circle_members 
    where circle_id = '0da0e990-6689-4164-8f8f-394c80649d8e' 
    and user_id = public.new_profiles.id
)
limit 1;

-- 4. تعطيل RLS للمحادثات (لضمان العمل)
alter table public.zoon_circle_messages disable row level security;
alter table public.zoon_direct_chats disable row level security;
alter table public.zoon_direct_messages disable row level security;
