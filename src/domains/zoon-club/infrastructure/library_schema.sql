-- 📚 Zoon Knowledge Library Schema
-- هيكلية مكتبة المعرفة والمصادر التعليمية

-- 1. جدول المصادر (Resources)
-- ملاحظة: قد يكون الجدول موجوداً، لذا نستخدم IF NOT EXISTS أو نعدله
create table if not exists public.zoon_circle_resources (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.zoon_circles(id) on delete cascade,
    added_by uuid references public.new_profiles(id) on delete set null,
    
    title text not null,
    description text,
    resource_type text check (resource_type in ('LINK', 'PDF', 'IMAGE', 'VIDEO', 'NOTE')),
    url text, -- رابط خارجي أو رابط Supabase Storage
    
    votes_count int default 0,
    created_at timestamp with time zone default now()
);

-- 2. جدول التصويتات (Upvotes/Likes)
create table if not exists public.zoon_resource_votes (
    id uuid default gen_random_uuid() primary key,
    resource_id uuid not null references public.zoon_circle_resources(id) on delete cascade,
    user_id uuid not null references public.new_profiles(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(resource_id, user_id) -- منع التصويت المكرر
);

-- 3. سياسات الأمان (RLS)
alter table public.zoon_circle_resources enable row level security;
alter table public.zoon_resource_votes enable row level security;

-- القراءة متاحة لكل أعضاء الدائرة
create policy "Members view resources" on public.zoon_circle_resources
for select using (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_resources.circle_id and user_id = auth.uid())
);

-- الإضافة متاحة للأعضاء
create policy "Members add resources" on public.zoon_circle_resources
for insert with check (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_resources.circle_id and user_id = auth.uid())
);

-- التصويت متاح للأعضاء
create policy "Members vote resources" on public.zoon_resource_votes
for insert with check (
    exists (
        select 1 from public.zoon_circle_resources res
        join public.zoon_circle_members mem on res.circle_id = mem.circle_id
        where res.id = zoon_resource_votes.resource_id
        and mem.user_id = auth.uid()
    )
);
