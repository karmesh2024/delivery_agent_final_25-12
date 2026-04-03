-- 💬 Zoon Circle Chat Schema
-- هذا الملف يحتوي على هيكلية جداول الدردشة الجماعية للدوائر

-- 1. جدول الرسائل (Messages)
create table if not exists public.zoon_circle_messages (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.zoon_circles(id) on delete cascade,
    sender_id uuid not null references public.new_profiles(id) on delete set null,
    
    content text, -- محتوى الرسالة النصي
    media_url text, -- رابط الصورة أو الملف الصوتي (اختياري)
    message_type text default 'TEXT' check (message_type in ('TEXT', 'IMAGE', 'VOICE', 'SYSTEM')),
    
    reply_to_id uuid references public.zoon_circle_messages(id), -- للردود (Threads)
    is_edited boolean default false,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. الفهارس (Indexes) وعمليات البحث السريع
create index if not exists idx_zoon_messages_circle_id on public.zoon_circle_messages(circle_id);
create index if not exists idx_zoon_messages_created_at on public.zoon_circle_messages(created_at desc);

-- 3. تفعيل Realtime (مهم جداً للدردشة الحية)
alter publication supabase_realtime add table public.zoon_circle_messages;

-- 4. سياسات الأمان (RLS - Row Level Security)
alter table public.zoon_circle_messages enable row level security;

-- القراءة: مسموحة فقط لأعضاء الدائرة
create policy "Members can view messages"
on public.zoon_circle_messages for select
using (
    exists (
        select 1 from public.zoon_circle_members
        where circle_id = zoon_circle_messages.circle_id
        and user_id = auth.uid()
    )
);

-- الكتابة: مسموحة فقط لأعضاء الدائرة
create policy "Members can insert messages"
on public.zoon_circle_messages for insert
with check (
    exists (
        select 1 from public.zoon_circle_members
        where circle_id = zoon_circle_messages.circle_id
        and user_id = auth.uid()
    )
    and sender_id = auth.uid() -- التأكد من أن المرسل هو المستخدم نفسه
);

-- التعديل: المرسل فقط يمكنه تعديل رسالته (خلال فترة معينة - المنطق في التطبيق)
create policy "Users can update own messages"
on public.zoon_circle_messages for update
using (sender_id = auth.uid());
