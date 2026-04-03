-- 🧠 إعدادات المساعد الذكي (AI Assistant Settings)

create table if not exists public.zoon_circle_ai_settings (
    id uuid default gen_random_uuid() primary key,
    circle_id uuid not null references public.zoon_circles(id) on delete cascade,
    
    assistant_name text default 'Zoon AI',
    personality_type text default 'BALANCED' check (personality_type in ('LOGICAL', 'EMPATHETIC', 'CREATIVE', 'BALANCED')),
    
    custom_instructions text, -- تعليمات خاصة من مدير الدائرة
    is_active boolean default true,
    
    -- ذاكرة المساعد (Context)
    last_analysis_at timestamp with time zone,
    analysis_data jsonb default '{}'::jsonb, -- نتائج التحليل النفسي للدائرة
    
    unique(circle_id)
);

-- تفعيل الحماية
alter table public.zoon_circle_ai_settings enable row level security;

-- القراءة (للأعضاء)
create policy "Members view AI settings" on public.zoon_circle_ai_settings
for select using (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_ai_settings.circle_id and user_id = auth.uid())
);

-- التعديل (للمدير فقط)
create policy "Admins edit AI settings" on public.zoon_circle_ai_settings
for update using (
    exists (select 1 from public.zoon_circle_members where circle_id = zoon_circle_ai_settings.circle_id and user_id = auth.uid() and role = 'admin')
);
