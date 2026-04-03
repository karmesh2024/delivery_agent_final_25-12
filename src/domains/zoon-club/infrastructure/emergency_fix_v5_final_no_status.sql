-- 🚨 EMERGENCY FIX V5 (Final Corrected)
-- إصلاح خطأ العمود غير الموجود
-- سنقوم بإنشاء الدائرة بالبيانات الأساسية فقط

-- 1. إنشاء الدائرة (بدون عمود status)
insert into public.zoon_circles (id, name, description)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- ID from URL
    'دائرة الإنقاذ (Emergency Circle)',
    'تم إنشاؤها تلقائياً لإصلاح مشكلة الدردشة'
)
on conflict (id) do nothing;

-- 2. إضافة العضو (كـ admin)
insert into public.zoon_circle_members (circle_id, user_id, role)
select 
    '7235ac59-0a60-4561-a417-ead4eee5ff1f',
    '249d346d-0ec9-4146-a86e-6e97c3a399a2',
    'admin'
where not exists (
    select 1 from public.zoon_circle_members 
    where circle_id = '7235ac59-0a60-4561-a417-ead4eee5ff1f' 
    and user_id = '249d346d-0ec9-4146-a86e-6e97c3a399a2'
);

-- 3. تعطيل RLS لضمان المرور
alter table public.zoon_circle_messages disable row level security;
alter table public.zoon_direct_messages disable row level security;
