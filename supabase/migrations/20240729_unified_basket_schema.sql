-- =================================================================
--      UNIFIED SCHEMA FOR BASKET & COLLECTION MANAGEMENT
-- =================================================================
-- This single, consolidated migration file establishes the complete
-- schema for managing waste baskets, including configurations for
-- both main categories and subcategories, and all related
-- functions, triggers, and views.
-- =================================================================

-- ========= PART 1: CORE SCHEMA & MAIN CATEGORY CONFIG =========

-- 1. ENUM Types for defining basket properties
CREATE TYPE public.basket_supplier_type AS ENUM (
    'AUTHORIZED_AGENT', 'HOME_CLIENT', 'SCHOOL', 'RESTAURANT', 'OFFICE', 'OTHER'
);

CREATE TYPE public.basket_size AS ENUM (
    'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'
);

CREATE TYPE public.basket_status AS ENUM (
    'EMPTY', 'PARTIAL', 'FULL', 'READY_ORDER', 'COLLECTED'
);

-- 2. Table for main category basket configurations
CREATE TABLE public.category_bucket_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    supplier_type basket_supplier_type NOT NULL,
    basket_size basket_size NOT NULL,
    basket_empty_weight_kg DOUBLE PRECISION NOT NULL,
    max_net_weight_kg DOUBLE PRECISION NOT NULL,
    max_volume_liters DOUBLE PRECISION NULL,
    min_fill_percentage INTEGER NOT NULL DEFAULT 80,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    
    CONSTRAINT category_bucket_config_pkey PRIMARY KEY (id),
    CONSTRAINT category_bucket_config_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.categories (id) ON DELETE CASCADE,
    CONSTRAINT category_bucket_config_unique 
        UNIQUE (category_id, supplier_type, basket_size),
    CONSTRAINT min_fill_percentage_check 
        CHECK (min_fill_percentage >= 0 AND min_fill_percentage <= 100)
) TABLESPACE pg_default;
COMMENT ON TABLE public.category_bucket_config IS 'Defines basket configurations at the main category level.';

-- 3. Table for actual, distributed baskets
CREATE TABLE public.baskets (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    bucket_config_id UUID NOT NULL,
    supplier_id UUID NULL,
    basket_code VARCHAR(50) NOT NULL UNIQUE,
    location_address TEXT NULL,
    location_coordinates POINT NULL,
    current_total_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_net_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_volume_liters DOUBLE PRECISION NULL DEFAULT 0,
    fill_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
    status basket_status NOT NULL DEFAULT 'EMPTY',
    last_emptied_at TIMESTAMP WITH TIME ZONE NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    
    CONSTRAINT baskets_pkey PRIMARY KEY (id),
    CONSTRAINT baskets_bucket_config_id_fkey 
        FOREIGN KEY (bucket_config_id) REFERENCES public.category_bucket_config (id),
    CONSTRAINT fill_percentage_check 
        CHECK (fill_percentage >= 0 AND fill_percentage <= 100)
) TABLESPACE pg_default;
COMMENT ON TABLE public.baskets IS 'Represents the physical baskets distributed to suppliers/clients.';

-- 4. Table for basket contents (the items inside a basket)
CREATE TABLE public.basket_contents (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    basket_id UUID NOT NULL,
    waste_data_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_weight_kg DOUBLE PRECISION NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    added_by UUID NULL,
    
    CONSTRAINT basket_contents_pkey PRIMARY KEY (id),
    CONSTRAINT basket_contents_basket_id_fkey 
        FOREIGN KEY (basket_id) REFERENCES public.baskets (id) ON DELETE CASCADE,
    CONSTRAINT basket_contents_waste_data_id_fkey 
        FOREIGN KEY (waste_data_id) REFERENCES public.waste_data_admin (id),
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT weight_positive CHECK (total_weight_kg >= 0)
) TABLESPACE pg_default;
COMMENT ON TABLE public.basket_contents IS 'Logs each item added to a basket.';

-- 5. Table for collection orders, created when a user requests a pickup
CREATE TABLE public.collection_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    basket_id UUID NOT NULL,
    total_weight_kg DOUBLE PRECISION NOT NULL,
    net_weight_kg DOUBLE PRECISION NOT NULL,
    basket_weight_kg DOUBLE PRECISION NOT NULL,
    total_value DOUBLE PRECISION NOT NULL,
    total_points INTEGER NOT NULL,
    order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_date TIMESTAMP WITH TIME ZONE NULL,
    collected_date TIMESTAMP WITH TIME ZONE NULL,
    collector_id UUID NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    
    CONSTRAINT collection_orders_pkey PRIMARY KEY (id),
    CONSTRAINT collection_orders_basket_id_fkey 
        FOREIGN KEY (basket_id) REFERENCES public.baskets (id),
    CONSTRAINT order_status_check 
        CHECK (order_status IN ('PENDING', 'SCHEDULED', 'COLLECTED', 'CANCELLED'))
) TABLESPACE pg_default;
COMMENT ON TABLE public.collection_orders IS 'Stores collection requests initiated by users for their baskets.';

-- ========= PART 2: SUBCATEGORY ENHANCEMENTS & FUNCTIONS =========

-- 6. Table for subcategory-specific basket configurations
CREATE TABLE public.subcategory_bucket_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    subcategory_id UUID NOT NULL,
    supplier_type basket_supplier_type NOT NULL,
    basket_size basket_size NOT NULL,
    basket_empty_weight_kg DOUBLE PRECISION NOT NULL,
    max_net_weight_kg DOUBLE PRECISION NOT NULL,
    max_volume_liters DOUBLE PRECISION NULL,
    min_fill_percentage INTEGER NOT NULL DEFAULT 80,
    max_items_count INTEGER NULL,
    requires_separation BOOLEAN NOT NULL DEFAULT FALSE,
    special_handling_notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    
    CONSTRAINT subcategory_bucket_config_pkey PRIMARY KEY (id),
    CONSTRAINT subcategory_bucket_config_subcategory_id_fkey 
        FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE CASCADE,
    CONSTRAINT subcategory_bucket_config_unique 
        UNIQUE (subcategory_id, supplier_type, basket_size),
    CONSTRAINT subcategory_min_fill_percentage_check 
        CHECK (min_fill_percentage >= 0 AND min_fill_percentage <= 100)
) TABLESPACE pg_default;
COMMENT ON TABLE public.subcategory_bucket_config IS 'Overrides for basket configurations at the more specific subcategory level.';

-- 7. Modify 'baskets' and 'waste_data_admin' tables to support enhancements
ALTER TABLE public.baskets 
    ADD COLUMN IF NOT EXISTS subcategory_bucket_config_id UUID NULL,
    ADD CONSTRAINT baskets_subcategory_bucket_config_id_fkey 
        FOREIGN KEY (subcategory_bucket_config_id) REFERENCES public.subcategory_bucket_config (id)
        ON DELETE SET NULL;
COMMENT ON COLUMN public.baskets.subcategory_bucket_config_id IS 'FK to subcategory_bucket_config, used if this basket has specific subcategory rules.';

ALTER TABLE public.basket_contents 
    ADD COLUMN IF NOT EXISTS item_volume_liters DOUBLE PRECISION NULL,
    ADD COLUMN IF NOT EXISTS item_dimensions_cm VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS requires_special_handling BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.waste_data_admin 
    ADD COLUMN IF NOT EXISTS volume_liters DOUBLE PRECISION NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dimensions_cm VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS requires_special_basket BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN public.waste_data_admin.volume_liters IS 'The volume (in liters) of a single unit of this waste item.';

-- 8. Advanced function to check if an item can be added to a basket
CREATE OR REPLACE FUNCTION public.can_add_item_to_basket(
    basket_id_param UUID,
    waste_data_id_param UUID,
    quantity_param INTEGER
) RETURNS TEXT AS $$
DECLARE
    basket_rec RECORD;
    waste_rec RECORD;
    config_rec RECORD;
    item_weight DOUBLE PRECISION;
    item_volume DOUBLE PRECISION;
    current_items INTEGER;
    is_subcategory_basket BOOLEAN;
BEGIN
    SELECT * INTO basket_rec FROM public.baskets WHERE id = basket_id_param;
    IF NOT FOUND THEN RETURN 'BASKET_NOT_FOUND'; END IF;
    
    SELECT * INTO waste_rec FROM public.waste_data_admin WHERE id = waste_data_id_param;
    IF NOT FOUND THEN RETURN 'WASTE_NOT_FOUND'; END IF;
    
    is_subcategory_basket := basket_rec.subcategory_bucket_config_id IS NOT NULL;
    
    IF is_subcategory_basket THEN
        SELECT sbc.*, s.category_id INTO config_rec 
        FROM public.subcategory_bucket_config sbc
        JOIN public.subcategories s ON sbc.subcategory_id = s.id
        WHERE sbc.id = basket_rec.subcategory_bucket_config_id;
    ELSE
        SELECT * INTO config_rec FROM public.category_bucket_config 
        WHERE id = basket_rec.bucket_config_id;
    END IF;

    IF config_rec IS NULL THEN RETURN 'CONFIG_NOT_FOUND'; END IF;
    
    IF config_rec.category_id != waste_rec.category_id THEN RETURN 'CATEGORY_MISMATCH'; END IF;
    
    IF is_subcategory_basket AND waste_rec.subcategory_id != config_rec.subcategory_id THEN
        RETURN 'SUBCATEGORY_MISMATCH';
    END IF;
    
    item_weight := waste_rec.weight * quantity_param;
    item_volume := COALESCE(waste_rec.volume_liters, 0) * quantity_param;
    
    IF (basket_rec.current_net_weight_kg + item_weight) > config_rec.max_net_weight_kg THEN
        RETURN 'WEIGHT_LIMIT_EXCEEDED';
    END IF;
    
    IF config_rec.max_volume_liters IS NOT NULL AND (COALESCE(basket_rec.current_volume_liters, 0) + item_volume) > config_rec.max_volume_liters THEN
        RETURN 'VOLUME_LIMIT_EXCEEDED';
    END IF;
    
    IF is_subcategory_basket AND config_rec.max_items_count IS NOT NULL THEN
        SELECT COUNT(*) INTO current_items FROM public.basket_contents WHERE basket_id = basket_id_param;
        IF (current_items + quantity_param) > config_rec.max_items_count THEN
            RETURN 'ITEM_COUNT_EXCEEDED';
        END IF;
    END IF;
    
    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.can_add_item_to_basket IS 'Checks if an item can be added to a basket, returning "OK" or an error code.';

-- 9. Trigger function to automatically update basket status
CREATE OR REPLACE FUNCTION public.update_basket_status()
RETURNS TRIGGER AS $$
DECLARE
    basket_rec RECORD;
    config_rec RECORD;
    fill_percentage DOUBLE PRECISION;
    basket_id_to_update UUID;
BEGIN
    basket_id_to_update := CASE WHEN TG_OP = 'DELETE' THEN OLD.basket_id ELSE NEW.basket_id END;

    SELECT * INTO basket_rec FROM public.baskets WHERE id = basket_id_to_update;
    
    IF basket_rec.subcategory_bucket_config_id IS NOT NULL THEN
        SELECT * INTO config_rec FROM public.subcategory_bucket_config WHERE id = basket_rec.subcategory_bucket_config_id;
    ELSE
        SELECT * INTO config_rec FROM public.category_bucket_config WHERE id = basket_rec.bucket_config_id;
    END IF;

    IF config_rec.max_net_weight_kg = 0 THEN
        fill_percentage := 100;
    ELSE
        fill_percentage := (basket_rec.current_net_weight_kg / config_rec.max_net_weight_kg) * 100;
    END IF;
    
    UPDATE public.baskets 
    SET 
        fill_percentage = LEAST(fill_percentage, 100),
        status = CASE
            WHEN fill_percentage >= 100 THEN 'FULL'::basket_status
            WHEN fill_percentage >= config_rec.min_fill_percentage THEN 'READY_ORDER'::basket_status
            WHEN fill_percentage > 0 THEN 'PARTIAL'::basket_status
            ELSE 'EMPTY'::basket_status
        END,
        updated_at = NOW()
    WHERE id = basket_id_to_update;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_basket_status IS 'Trigger function to auto-update basket fill percentage and status.';

-- 10. Procedure to add an item to a basket, with checks
CREATE OR REPLACE FUNCTION public.add_item_to_basket(
    basket_id_param UUID,
    waste_data_id_param UUID,
    quantity_param INTEGER,
    added_by_param UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    add_status TEXT;
    item_weight DOUBLE PRECISION;
    item_volume DOUBLE PRECISION;
    waste_rec RECORD;
BEGIN
    SELECT public.can_add_item_to_basket(basket_id_param, waste_data_id_param, quantity_param) INTO add_status;
    
    IF add_status != 'OK' THEN RETURN add_status; END IF;
    
    SELECT * INTO waste_rec FROM public.waste_data_admin WHERE id = waste_data_id_param;
    
    item_weight := waste_rec.weight * quantity_param;
    item_volume := COALESCE(waste_rec.volume_liters, 0) * quantity_param;
    
    INSERT INTO public.basket_contents (basket_id, waste_data_id, quantity, total_weight_kg, item_volume_liters, added_by) 
    VALUES (basket_id_param, waste_data_id_param, quantity_param, item_weight, item_volume, added_by_param);
    
    UPDATE public.baskets 
    SET 
        current_net_weight_kg = current_net_weight_kg + item_weight,
        current_total_weight_kg = current_total_weight_kg + item_weight,
        current_volume_liters = COALESCE(current_volume_liters, 0) + item_volume,
        updated_at = NOW()
    WHERE id = basket_id_param;
    
    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.add_item_to_basket IS 'Procedure to add an item to a basket, invoking checks and updating weights.';

-- ========= PART 3: TRIGGERS, VIEWS, and INDEXES =========

-- 11. Trigger to activate the status update function
DROP TRIGGER IF EXISTS trigger_update_basket_status ON public.basket_contents;
CREATE TRIGGER trigger_update_basket_status
    AFTER INSERT OR UPDATE OR DELETE ON public.basket_contents
    FOR EACH ROW EXECUTE FUNCTION public.update_basket_status();

-- 12. Unified view for all basket configurations (main and sub)
CREATE OR REPLACE VIEW public.basket_configurations AS
SELECT 
    'CATEGORY' as config_type, cbc.id as config_id, c.id as category_id, c.name as category_name,
    NULL as subcategory_id, NULL as subcategory_name, cbc.supplier_type, cbc.basket_size,
    cbc.basket_empty_weight_kg, cbc.max_net_weight_kg, cbc.max_volume_liters,
    cbc.min_fill_percentage, NULL as max_items_count, NULL as requires_separation,
    cbc.description as notes, cbc.is_active, cbc.created_at
FROM public.category_bucket_config cbc
JOIN public.categories c ON cbc.category_id = c.id
UNION ALL
SELECT 
    'SUBCATEGORY' as config_type, sbc.id as config_id, c.id as category_id, c.name as category_name,
    s.id as subcategory_id, s.name as subcategory_name, sbc.supplier_type, sbc.basket_size,
    sbc.basket_empty_weight_kg, sbc.max_net_weight_kg, sbc.max_volume_liters,
    sbc.min_fill_percentage, sbc.max_items_count, sbc.requires_separation,
    sbc.special_handling_notes as notes, sbc.is_active, sbc.created_at
FROM public.subcategory_bucket_config sbc
JOIN public.subcategories s ON sbc.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id;
COMMENT ON VIEW public.basket_configurations IS 'A unified view of all active basket configurations, from both category and subcategory levels.';

-- 13. View to show baskets that are ready for collection
CREATE OR REPLACE VIEW public.ready_for_collection AS
SELECT 
    b.id as basket_id,
    b.basket_code,
    b.location_address,
    b.current_total_weight_kg,
    b.current_net_weight_kg,
    cbc.basket_empty_weight_kg,
    b.fill_percentage,
    c.name as category_name,
    cbc.supplier_type,
    cbc.basket_size,
    cbc.max_net_weight_kg,
    (SELECT COUNT(*) FROM public.basket_contents bc WHERE b.id = bc.basket_id) as items_count,
    (SELECT SUM(bc.total_weight_kg * wd.price) 
     FROM public.basket_contents bc
     JOIN public.waste_data_admin wd ON bc.waste_data_id = wd.id
     WHERE b.id = bc.basket_id
    ) as estimated_value
FROM public.baskets b
JOIN public.category_bucket_config cbc ON b.bucket_config_id = cbc.id
JOIN public.categories c ON cbc.category_id = c.id
WHERE b.status = 'READY_ORDER' AND b.is_active = true;
COMMENT ON VIEW public.ready_for_collection IS 'View for operational use, showing baskets that have reached the "READY_ORDER" status.';

-- 14. Indexes for performance enhancement
CREATE INDEX IF NOT EXISTS idx_baskets_status ON public.baskets(status);
CREATE INDEX IF NOT EXISTS idx_baskets_supplier_id ON public.baskets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_basket_contents_basket_id ON public.basket_contents(basket_id);
CREATE INDEX IF NOT EXISTS idx_category_bucket_config_category_id ON public.category_bucket_config(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_bucket_config_subcategory_id ON public.subcategory_bucket_config(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_collection_orders_status ON public.collection_orders(order_status);

-- =================================================================
--                      END OF MIGRATION
-- ================================================================= 