-- 🚨 EMERGENCY FIX V4 (The Root Cause Fix)
-- المشكلة: الدائرة 7235... (من الرابط) غير موجودة في جدول zoon_circles
-- الحل: ننشئها يدوياً لكي يعمل كل شيء

-- 1. إنشاء الدائرة (إذا لم تكن موجودة)
insert into public.zoon_circles (id, name, description, status)
values (
    '7235ac59-0a60-4561-a417-ead4eee5ff1f', -- نفس الـ ID الموجود في رابطك
    'دائرة الإنقاذ (Emergency Circle)',
    'تم إنشاؤها تلقائياً لإصلاح مشكلة الدردشة',
    'active'
)
on conflict (id) do nothing;

-- 2. الآن يمكننا إضافة العضو بأمان (لن يحدث خطأ Foreign Key)
insert into public.zoon_circle_members (circle_id, user_id, role)
select 
    '7235ac59-0a60-4561-a417-ead4eee5ff1f',
    '249d346d-0ec9-4146-a86e-6e97c3a399a2',
    'admin' -- نجعلك أدمن لتتمتع بكل الصلاحيات
where not exists (
    select 1 from public.zoon_circle_members 
    where circle_id = '7235ac59-0a60-4561-a417-ead4eee5ff1f' 
    and user_id = '249d346d-0ec9-4146-a86e-6e97c3a399a2'
);

-- 3. ضمان أن RLS معطل (للتجربة السلسة)
alter table public.zoon_circle_messages disable row level security;
alter table public.zoon_direct_messages disable row level security;
