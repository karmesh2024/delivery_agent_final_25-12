-- إعداد سلة لكل الفئات الرئيسية (تكوين عام)
-- يُستخدم للعميل بشكل أساسي، وللوكلاء (مع اختيار اسم الوكيل) وآخرين مستقبلاً

CREATE TABLE IF NOT EXISTS public.global_basket_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    supplier_type public.basket_supplier_type NOT NULL,
    basket_size public.basket_size NOT NULL,
    agent_id UUID NULL,
    basket_empty_weight_kg DOUBLE PRECISION NOT NULL,
    max_net_weight_kg DOUBLE PRECISION NOT NULL,
    max_volume_liters DOUBLE PRECISION NULL,
    min_fill_percentage INTEGER NOT NULL DEFAULT 80,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    allocated_net_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    allocated_volume_liters DOUBLE PRECISION NULL DEFAULT 0,

    CONSTRAINT global_basket_config_pkey PRIMARY KEY (id),
    CONSTRAINT global_basket_config_agent_id_fkey
        FOREIGN KEY (agent_id) REFERENCES public.agents (id) ON DELETE SET NULL,
    CONSTRAINT global_basket_config_unique
        UNIQUE (supplier_type, basket_size, agent_id),
    CONSTRAINT global_basket_config_min_fill_check
        CHECK (min_fill_percentage >= 0 AND min_fill_percentage <= 100)
);
COMMENT ON TABLE public.global_basket_config IS 'إعداد سلة واحد يطبق على كل الفئات الرئيسية - للعميل أو لوكيل محدد (عند اختيار نوع المورد وكيل)';

CREATE INDEX IF NOT EXISTS idx_global_basket_config_supplier_type
    ON public.global_basket_config (supplier_type);
CREATE INDEX IF NOT EXISTS idx_global_basket_config_agent_id
    ON public.global_basket_config (agent_id);
