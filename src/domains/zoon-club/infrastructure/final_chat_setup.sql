-- 🏁 Final Chat Setup (Simple & Safe)
-- هذا الملف يضمن وجود جداول الدردشة وسياسات الأمان الصحيحة

-- 1. جدول المحادثات الثنائية (Direct Chats)
create table if not exists public.zoon_direct_chats (
    id uuid default gen_random_uuid() primary key,
    user1_id uuid not null references public.new_profiles(id),
    user2_id uuid not null references public.new_profiles(id),
    last_message_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(user1_id, user2_id)
);

-- 2. جدول رسائل الخاص (Direct Messages)
create table if not exists public.zoon_direct_messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid not null references public.zoon_direct_chats(id) on delete cascade,
    sender_id uuid not null references public.new_profiles(id),
    content text,
    message_type text default 'TEXT',
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. تفعيل الحماية (RLS)
alter table public.zoon_circle_messages enable row level security;
alter table public.zoon_direct_chats enable row level security;
alter table public.zoon_direct_messages enable row level security;

-- 4. تنظيف السياسات القديمة (لتجنب التضارب)
drop policy if exists "Members send circle messages" on public.zoon_circle_messages;
drop policy if exists "Members can insert messages" on public.zoon_circle_messages;
drop policy if exists "User can send direct messages" on public.zoon_direct_messages;

-- 5. إضافة السياسات الصحيحة (Permissive Policies for Testing)

-- أ) إرسال للعام: مسموح لأي عضو مسجل في الدائرة
create policy "Members send circle messages"
on public.zoon_circle_messages
for insert
with check (
    exists (
        select 1 from public.zoon_circle_members
        where circle_id = zoon_circle_messages.circle_id
        and user_id = auth.uid()
    )
);

-- ب) إرسال للخاص: مسموح للمرسل نفسه إذا كان طرفاً في المحادثة
create policy "User can send direct messages"
on public.zoon_direct_messages
for insert
with check (
    sender_id = auth.uid()
    and exists (
        select 1 from public.zoon_direct_chats
        where id = zoon_direct_messages.chat_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
);

-- 6. تفعيل Realtime (بشكل آمن جداً يدوياً)
-- ملاحظة: إذا ظهر خطأ "already member" هنا، فهذا جيد ويعني أنه مفعل مسبقاً
alter publication supabase_realtime add table public.zoon_direct_messages;
