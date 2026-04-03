-- 🛠️ تصحيح وإكمال هيكلية الدردشة
-- يركز هذا الملف فقط على إضافة جداول الدردشة الخاصة (Direct)
-- ويتخطى ما تم إنشاؤه سابقاً لتجنب الأخطاء

-- 1. إنشاء جداول الدردشة الخاصة (إذا لم تكن موجودة)
create table if not exists public.zoon_direct_chats (
    id uuid default gen_random_uuid() primary key,
    user1_id uuid not null references public.new_profiles(id),
    user2_id uuid not null references public.new_profiles(id),
    last_message_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(user1_id, user2_id)
);

create table if not exists public.zoon_direct_messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid not null references public.zoon_direct_chats(id) on delete cascade,
    sender_id uuid not null references public.new_profiles(id),
    content text,
    message_type text default 'TEXT',
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. تفعيل Realtime للجدول الجديد فقط (لتجنب خطأ التكرار)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'zoon_direct_messages'
  ) then
    alter publication supabase_realtime add table public.zoon_direct_messages;
  end if;
end;
$$;

-- 3. تفعيل سياسات الأمان (RLS) للخاص
alter table public.zoon_direct_chats enable row level security;
alter table public.zoon_direct_messages enable row level security;

-- حذف السياسات القديمة إذا وجدت لتجنب التضارب
drop policy if exists "User can view own chats" on public.zoon_direct_chats;
drop policy if exists "User can create chats" on public.zoon_direct_chats;
drop policy if exists "User can view direct messages" on public.zoon_direct_messages;
drop policy if exists "User can send direct messages" on public.zoon_direct_messages;

-- إعادة إنشاء السياسات
create policy "User can view own chats" on public.zoon_direct_chats
for select using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "User can create chats" on public.zoon_direct_chats
for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "User can view direct messages" on public.zoon_direct_messages
for select using (
    exists (select 1 from public.zoon_direct_chats where id = zoon_direct_messages.chat_id and (user1_id = auth.uid() or user2_id = auth.uid()))
);

create policy "User can send direct messages" on public.zoon_direct_messages
for insert with check (
    exists (select 1 from public.zoon_direct_chats where id = zoon_direct_messages.chat_id and (user1_id = auth.uid() or user2_id = auth.uid()))
    and sender_id = auth.uid()
);
