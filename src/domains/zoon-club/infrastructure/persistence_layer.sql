-- 🌌 Zoon Club Persistence Layer (2026 Update)
-- هذا الملف ينشئ الجداول اللازمة لحفظ البيانات بشكل دائم في قاعدة البيانات

-- 1. جدول العضوية في الدوائر (Persistence for Joining Circles)
create table if not exists public.zoon_circle_members (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.scope_circles(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(circle_id, user_id)
);

-- 2. جدول التعليقات على المنشورات (Persistence for Comments)
-- يتم استخدامه لحفظ الـ Justifications والتعليقات العادية
create table if not exists public.zoon_post_comments (
    id uuid default gen_random_uuid() primary key,
    post_id uuid not null references public.zoon_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    is_diamond_buzz boolean default false, -- لتمييز تعليقات الـ Diamond Buzz
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول التفاعلات (Persistence for Bazzzz)
-- لحفظ من قام بأي نوع من الـ Bazzzz على أي منشور
create table if not exists public.zoon_post_interactions (
    id uuid default gen_random_uuid() primary key,
    post_id uuid not null references public.zoon_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    bazzzz_type_id uuid not null references public.zoon_bazzzz_types(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(post_id, user_id) -- منع تكرار التفاعل من نفس المستخدم على نفس المنشور (أو يمكن حذفه للسماح بتغيير النوع)
);

-- 4. تحديث جدول الرسائل (للتأكد من وجوده)
create table if not exists public.zoon_circle_messages (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.scope_circles(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    content text,
    media_url text,
    message_type text default 'TEXT',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. تفعيل RLS (Row Level Security)
alter table public.zoon_circle_members enable row level security;
alter table public.zoon_post_comments enable row level security;
alter table public.zoon_post_interactions enable row level security;
alter table public.zoon_circle_messages enable row level security;

-- سياسات الوصول (Permissions)
-- الجميع يمكنهم رؤية الأعضاء والتعليقات والتفاعلات
create policy "Allow public view circle members" on public.zoon_circle_members for select using (true);
create policy "Allow individual join circle" on public.zoon_circle_members for insert with check (auth.uid() = user_id);

create policy "Allow public view comments" on public.zoon_post_comments for select using (true);
create policy "Allow users to comment" on public.zoon_post_comments for insert with check (auth.uid() = user_id);

create policy "Allow public view interactions" on public.zoon_post_interactions for select using (true);
create policy "Allow users to interact" on public.zoon_post_interactions for insert with check (auth.uid() = user_id);

create policy "Allow members to view messages" on public.zoon_circle_messages for select using (true); -- للمعاينة حالياً، يمكن تقييدها لاحقاً
create policy "Allow members to send messages" on public.zoon_circle_messages for insert with check (auth.uid() = sender_id);

-- 6. تفعيل Realtime
alter publication supabase_realtime add table public.zoon_post_comments;
alter publication supabase_realtime add table public.zoon_circle_messages;
alter publication supabase_realtime add table public.zoon_post_interactions;
