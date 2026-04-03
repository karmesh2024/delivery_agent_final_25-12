-- SQL Migration: Zoon OS Function System & Reliability
-- قم بتنفيذ هذا الاستعلام في Supabase SQL Editor

-- 1. جدول تتبع الخطوات (Tracing Logs)
CREATE TABLE IF NOT EXISTS public.pipeline_trace_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    level TEXT NOT NULL, -- info, warn, error
    node_id TEXT,
    step_index INTEGER,
    message TEXT NOT NULL,
    data JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول منع التكرار (Idempotency)
CREATE TABLE IF NOT EXISTS public.idempotency_records (
    key TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    result JSONB,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول صندوق الأخطاء (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS public.pipeline_dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    pipeline_id UUID,
    steps JSONB NOT NULL,
    partial_results JSONB,
    failed_at_step INTEGER NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, retrying, resolved, abandoned
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- 4. جداول الـ Pipelines المحفوظة (اختياري للمرحلة القادمة)
CREATE TABLE IF NOT EXISTS public.function_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    nodes JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- إضافة الفهارس لتحسين السرعة
CREATE INDEX IF NOT EXISTS idx_trace_logs_trace_id ON public.pipeline_trace_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_dlq_status ON public.pipeline_dead_letter_queue(status);
