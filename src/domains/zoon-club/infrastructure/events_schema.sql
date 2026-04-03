-- 🎪 هيكلية الفعاليات (The Gathering Schema)

-- 1. جدول الفعاليات
create table if not exists public.zoon_circle_events (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.zoon_circles(id) on delete cascade,
    organizer_id uuid references public.new_profiles(id) on delete set null,
    
    title text not null,
    description text,
    event_date timestamp with time zone not null,
    location_url text, -- رابط الاجتماع (Zoom/Google Meet) أو مكان الفعالية
    
    max_attendees int,
    status text default 'UPCOMING' check (status in ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    
    created_at timestamp with time zone default now()
);

-- 2. جدول الحضور (Attendees)
create table if not exists public.zoon_event_attendees (
    id uuid default gen_random_uuid() primary key,
    event_id uuid not null references public.zoon_circle_events(id) on delete cascade,
    user_id uuid not null references public.new_profiles(id) on delete cascade,
    status text default 'GOING' check (status in ('GOING', 'MAYBE', 'DECLINED')),
    joined_at timestamp with time zone default now(),
    
    unique(event_id, user_id)
);

-- 3. تفعيل الحماية
alter table public.zoon_circle_events enable row level security;
alter table public.zoon_event_attendees enable row level security;

-- القراءة (للأعضاء فقط)
create policy "Members view events" on public.zoon_circle_events
for select using (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_events.circle_id and user_id = auth.uid())
);

-- الإنشاء (للأعضاء فقط)
create policy "Members create events" on public.zoon_circle_events
for insert with check (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_events.circle_id and user_id = auth.uid())
);

-- تسجيل الحضور
create policy "Members join events" on public.zoon_event_attendees
for insert with check (
    exists (
        select 1 from public.zoon_circle_events e
        join public.zoon_circle_members m on e.circle_id = m.circle_id
        where e.id = zoon_event_attendees.event_id
        and m.user_id = auth.uid()
    )
);

-- قراءة الحضور
create policy "View attendees" on public.zoon_event_attendees
for select using (true);
