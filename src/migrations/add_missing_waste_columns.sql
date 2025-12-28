-- إضافة الأعمدة المفقودة لجدول catalog_waste_materials
-- التاريخ: 2025-12-28

-- التحقق من الأعمدة وإضافتها إذا لم تكن موجودة
DO $$ 
BEGIN
    -- 1. أعمدة الـ Emergency Flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='emergency_flags') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN emergency_flags JSONB DEFAULT '{"urgent_processing": false, "special_approvals": false, "health_hazard": false, "environmental_hazard": false}'::jsonb;
    END IF;

    -- 2. أعمدة النظام المحسن (قطاع، عميل، مصدر، سبب)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='sector_id') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN sector_id BIGINT REFERENCES public.waste_sectors(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='client_type_id') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN client_type_id BIGINT REFERENCES public.client_types(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='source_code') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN source_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='reason_id') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN reason_id BIGINT REFERENCES public.source_reasons(id);
    END IF;

    -- 3. أعمدة أنواع الخامات التفصيلية
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_type_id') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_type_id BIGINT REFERENCES public.plastic_types(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='metal_type_id') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN metal_type_id BIGINT REFERENCES public.metal_types(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_code') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_shape') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_shape TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_color') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_color TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_cleanliness') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_cleanliness TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='plastic_hardness') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN plastic_hardness TEXT;
    END IF;

    -- 4. أعمدة المعادن والورق والزجاج والأقمشة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='metal_shape') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN metal_shape TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='metal_condition') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN metal_condition TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='paper_type') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN paper_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='paper_condition') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN paper_condition TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='paper_print_type') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN paper_print_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='glass_type') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN glass_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='glass_shape') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN glass_shape TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='fabric_type') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN fabric_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='fabric_condition') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN fabric_condition TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='fabric_cut_type') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN fabric_cut_type TEXT;
    END IF;

    -- 5. أعمدة إضافية للفرز والتقييم
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='is_returnable_after_sorting') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN is_returnable_after_sorting BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='initial_sorting_from_supplier') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN initial_sorting_from_supplier TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='initial_sorting_percentage') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN initial_sorting_percentage NUMERIC(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='pollution_percentage') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN pollution_percentage NUMERIC(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog_waste_materials' AND column_name='registration_date') THEN
        ALTER TABLE public.catalog_waste_materials ADD COLUMN registration_date DATE DEFAULT CURRENT_DATE;
    END IF;

END $$;
