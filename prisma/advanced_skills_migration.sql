-- SQL Migration: Zoon OS Advanced Skills & Pipelines (Option B)
-- قم بتنفيذ هذا الاستعلام في Supabase SQL Editor

-- 1. جدول الـ Pipelines المحفوظة (المستودع الرئيسي لسلاسل العمليات)
CREATE TABLE IF NOT EXISTS public.function_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,
    input_params JSONB DEFAULT '[]',
    is_schedulable BOOLEAN DEFAULT false,
    created_by TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ترقية موديولات المهارات (ai_skills)
-- نستخدم DO block للتأكد من إضافة الحقول فقط إذا لم تكن موجودة
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_skills' AND column_name='source') THEN
        ALTER TABLE public.ai_skills ADD COLUMN source TEXT DEFAULT 'code' CHECK (source IN ('code', 'workflow_builder'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_skills' AND column_name='pipeline_id') THEN
        ALTER TABLE public.ai_skills ADD COLUMN pipeline_id UUID REFERENCES public.function_pipelines(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_skills' AND column_name='icon') THEN
        ALTER TABLE public.ai_skills ADD COLUMN icon TEXT DEFAULT '⚡';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_skills' AND column_name='category') THEN
        ALTER TABLE public.ai_skills ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
END $$;

-- 3. إنشاء جدول وظائف المهارات
CREATE TABLE IF NOT EXISTS public.ai_skill_functions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES public.ai_skills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'webhook', 'hitl', 'pipeline')),
    endpoint TEXT,
    input_schema JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(skill_id, name)
);

-- 4. فهارس البحث السريع
CREATE INDEX IF NOT EXISTS idx_ai_skills_source ON public.ai_skills(source);
CREATE INDEX IF NOT EXISTS idx_ai_skills_pipeline ON public.ai_skills(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_skill_functions_skill ON public.ai_skill_functions(skill_id);
