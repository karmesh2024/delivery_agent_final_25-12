-- 💬 Zoon Chat System (Group & Direct)
-- هذا الملف يحدث هيكلية الدردشة لتشمل الخاص والمجموعات

-- ==========================================
-- 1. الدردشة الجماعية (موجود مسبقاً - للتأكيد)
-- ==========================================
create table if not exists public.zoon_circle_messages (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.zoon_circles(id) on delete cascade,
    sender_id uuid not null references public.new_profiles(id) on delete set null,
    content text,
    media_url text,
    message_type text default 'TEXT',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. الدردشة الخاصة (Direct Messages)
-- ==========================================

-- جدول المحادثات الثنائية (لتتبع من يتحدث مع من)
create table if not exists public.zoon_direct_chats (
    id uuid default gen_random_uuid() primary key,
    user1_id uuid not null references public.new_profiles(id),
    user2_id uuid not null references public.new_profiles(id),
    last_message_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(user1_id, user2_id) -- منع تكرار المحادثة بين نفس الشخصين
);

-- جدول رسائل الخاص
create table if not exists public.zoon_direct_messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid not null references public.zoon_direct_chats(id) on delete cascade,
    sender_id uuid not null references public.new_profiles(id),
    content text,
    message_type text default 'TEXT',
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. تفعيل Realtime
-- ==========================================
alter publication supabase_realtime add table public.zoon_circle_messages;
alter publication supabase_realtime add table public.zoon_direct_messages;

-- ==========================================
-- 4. سياسات الأمان (RLS)
-- ==========================================
alter table public.zoon_circle_messages enable row level security;
alter table public.zoon_direct_chats enable row level security;
alter table public.zoon_direct_messages enable row level security;

-- سياسات المجموعات (تمت تغطيتها سابقاً، نعيد تأكيدها)
create policy "Members view circle messages" on public.zoon_circle_messages
for select using (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_messages.circle_id and user_id = auth.uid())
);

create policy "Members send circle messages" on public.zoon_circle_messages
for insert with check (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_messages.circle_id and user_id = auth.uid())
);

-- سياسات الدردشة الخاصة
-- يمكن للمستخدم رؤية المحادثات التي هو طرف فيها
create policy "User can view own chats" on public.zoon_direct_chats
for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- يمكن للمستخدم إنشاء محادثة جديدة (بشروط التطبيق)
create policy "User can create chats" on public.zoon_direct_chats
for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- يمكن للمستخدم رؤية رسائل محادثاته
create policy "User can view direct messages" on public.zoon_direct_messages
for select using (
    exists (select 1 from public.zoon_direct_chats where id = zoon_direct_messages.chat_id and (user1_id = auth.uid() or user2_id = auth.uid()))
);

-- يمكن للمستخدم إرسال رسائل في محادثاته
create policy "User can send direct messages" on public.zoon_direct_messages
for insert with check (
    exists (select 1 from public.zoon_direct_chats where id = zoon_direct_messages.chat_id and (user1_id = auth.uid() or user2_id = auth.uid()))
    and sender_id = auth.uid()
);
