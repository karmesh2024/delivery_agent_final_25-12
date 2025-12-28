-- =====================================================
-- الجزء الرابع: الدوال المساعدة والتريغرز
-- =====================================================

-- 7. إنشاء الدوال المساعدة
CREATE OR REPLACE FUNCTION update_warehouse_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث مسار الهيكل الهرمي
    IF NEW.parent_warehouse_id IS NOT NULL THEN
        SELECT hierarchy_path || ',' || NEW.warehouse_id::text
        INTO NEW.hierarchy_path
        FROM warehouse_hierarchy
        WHERE warehouse_id = NEW.parent_warehouse_id;
        
        NEW.depth := (
            SELECT depth + 1
            FROM warehouse_hierarchy
            WHERE warehouse_id = NEW.parent_warehouse_id
        );
    ELSE
        NEW.hierarchy_path := NEW.warehouse_id::text;
        NEW.depth := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء التريغر لتحديث المسار تلقائياً
CREATE TRIGGER trigger_update_warehouse_hierarchy_path
    BEFORE INSERT OR UPDATE ON warehouse_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_hierarchy_path();

-- 8. دالة للحصول على جميع المخازن التابعة
CREATE OR REPLACE FUNCTION get_sub_warehouses(warehouse_uuid UUID)
RETURNS TABLE (
    warehouse_id UUID,
    warehouse_name VARCHAR(255),
    level_name VARCHAR(100),
    depth INTEGER,
    hierarchy_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        wl.name as level_name,
        wh.depth,
        wh.hierarchy_path
    FROM warehouses w
    JOIN warehouse_hierarchy wh ON w.id = wh.warehouse_id
    JOIN warehouse_levels wl ON wh.level_id = wl.id
    WHERE wh.hierarchy_path LIKE '%' || warehouse_uuid::text || '%'
    AND w.id != warehouse_uuid
    ORDER BY wh.depth, w.name;
END;
$$ LANGUAGE plpgsql;
