-- ═══════════════════════════════════════════════════════════════════
-- 🧠 ZOON CONTENT ORCHESTRATION SCHEMA V1.2 (PRECISION UPDATE)
-- ═══════════════════════════════════════════════════════════════════

-- 1. تتبع عمليات التوليد (Generation Jobs Tracker)
CREATE TABLE IF NOT EXISTS public.content_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID REFERENCES public.zoon_circles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    news_fetched_at TIMESTAMPTZ,
    posts_generated INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. إعدادات المحتوى والذكاء الاصطناعي لكل غرفة
CREATE TABLE IF NOT EXISTS public.circle_content_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.zoon_circles(id) ON DELETE CASCADE,
    
    -- Layer 2: Room Policy
    room_policy TEXT DEFAULT 'مساحة إيجابية للنقاش البناء في حدود اهتمامات الغرفة.',
    
    -- Layer 3: Dynamic Goals
    active_goal TEXT DEFAULT 'الترحيب بالأعضاء وبناء الثقة الأولية.',
    
    -- Layer 4: Content Mix & Presets
    active_preset_name TEXT DEFAULT 'default',
    presets JSONB DEFAULT '{
        "default": {
            "question": 40,
            "story": 20,
            "info": 20,
            "discussion": 20
        },
        "engagement_boost": {
            "question": 70,
            "discussion": 30
        }
    }'::JSONB,
    
    -- Automation Logic
    publish_mode TEXT DEFAULT 'manual' CHECK (publish_mode IN ('manual', 'auto_fallback', 'auto')),
    fallback_hours INT DEFAULT 12,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(circle_id)
);

-- 3. طابور المنشورات (Content Queue) المطور
CREATE TABLE IF NOT EXISTS public.zoon_posts_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.zoon_circles(id) ON DELETE CASCADE,
    
    -- Content Data
    content TEXT NOT NULL,
    image_url TEXT,
    post_type TEXT NOT NULL,
    news_source_url TEXT, -- مصدر الخبر الأصلي
    
    -- Context & Tracking Metadata
    target_goal TEXT,
    psychological_analysis JSONB,
    generated_by TEXT DEFAULT 'gemini-1.5-flash',
    generation_prompt TEXT, -- لحفظ البرومبت المستخدم للمراجعة
    
    -- Lifecycle & Approval
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'published')),
    rejected_reason TEXT,    -- في حال الرفض
    approved_by UUID REFERENCES auth.users(id),
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT now(),
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    is_auto_published BOOLEAN DEFAULT FALSE
);

-- ═══════════════════════════════════════════════════════════════════
-- الأمن والسياسات (Improved RLS)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.circle_content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoon_posts_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_jobs ENABLE ROW LEVEL SECURITY;

-- الأدمن الفعال فقط يمكنه الوصول
CREATE POLICY "Admins manage content system" ON public.circle_content_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admins manage content queue" ON public.zoon_posts_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admins view jobs" ON public.content_generation_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- ═══════════════════════════════════════════════════════════════════
-- وظائف التحقق (Validation & Helpers)
-- ═══════════════════════════════════════════════════════════════════

-- دالة للتحقق من أن مجموع النسب في الـ Preset النشط يساوي 100
CREATE OR REPLACE FUNCTION validate_content_mix_total()
RETURNS TRIGGER AS $$
DECLARE
    v_total_percent INT;
    v_active_preset JSONB;
BEGIN
    v_active_preset := NEW.presets -> NEW.active_preset_name;
    
    IF v_active_preset IS NULL THEN
        RAISE EXCEPTION 'Active preset % not found in presets library', NEW.active_preset_name;
    END IF;

    SELECT SUM(value::int) INTO v_total_percent 
    FROM jsonb_each_text(v_active_preset);

    IF v_total_percent != 100 THEN
        RAISE EXCEPTION 'Total percentage for preset % must be exactly 100, currently %', NEW.active_preset_name, v_total_percent;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger للتحقق قبل الحفظ
CREATE TRIGGER check_preset_sum
    BEFORE INSERT OR UPDATE ON public.circle_content_settings
    FOR EACH ROW EXECUTE PROCEDURE validate_content_mix_total();

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_circle_settings_timestamp
    BEFORE UPDATE ON public.circle_content_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
