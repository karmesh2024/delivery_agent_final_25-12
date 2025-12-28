-- ============================================================
-- قيود قاعدة البيانات لحماية الإدارة العليا للمخازن
-- ============================================================

-- 1. منع أن يكون للإدارة العليا parent_warehouse_id
CREATE OR REPLACE FUNCTION check_admin_warehouse_no_parent()
RETURNS TRIGGER AS $$
BEGIN
    -- التحقق من أن الإدارة العليا لا يمكن أن يكون لها أب
    IF (NEW.is_admin_warehouse = true OR NEW.warehouse_level = 'admin') THEN
        IF NEW.parent_warehouse_id IS NOT NULL THEN
            RAISE EXCEPTION 'الإدارة العليا للمخازن لا يمكن أن يكون لها مخزن أب';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحقق قبل الإدراج
DROP TRIGGER IF EXISTS trigger_check_admin_no_parent_insert ON warehouses;
CREATE TRIGGER trigger_check_admin_no_parent_insert
    BEFORE INSERT ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_warehouse_no_parent();

-- إنشاء trigger للتحقق قبل التحديث
DROP TRIGGER IF EXISTS trigger_check_admin_no_parent_update ON warehouses;
CREATE TRIGGER trigger_check_admin_no_parent_update
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_warehouse_no_parent();

-- 2. منع حذف الإدارة العليا
CREATE OR REPLACE FUNCTION prevent_admin_warehouse_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- منع حذف الإدارة العليا
    IF (OLD.is_admin_warehouse = true OR OLD.warehouse_level = 'admin') THEN
        RAISE EXCEPTION 'لا يمكن حذف الإدارة العليا للمخازن';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لمنع الحذف
DROP TRIGGER IF EXISTS trigger_prevent_admin_deletion ON warehouses;
CREATE TRIGGER trigger_prevent_admin_deletion
    BEFORE DELETE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION prevent_admin_warehouse_deletion();

-- 3. منع تعديل is_admin_warehouse و warehouse_level للإدارة العليا
CREATE OR REPLACE FUNCTION protect_admin_warehouse_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا كان السجل الحالي هو إدارة عليا، منع تغيير الحقول الحرجة
    IF (OLD.is_admin_warehouse = true OR OLD.warehouse_level = 'admin') THEN
        -- منع تغيير is_admin_warehouse من true إلى false
        IF OLD.is_admin_warehouse = true AND NEW.is_admin_warehouse = false THEN
            RAISE EXCEPTION 'لا يمكن تغيير حالة الإدارة العليا';
        END IF;
        
        -- منع تغيير warehouse_level من admin إلى شيء آخر
        IF OLD.warehouse_level = 'admin' AND NEW.warehouse_level != 'admin' THEN
            RAISE EXCEPTION 'لا يمكن تغيير مستوى الإدارة العليا';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لحماية الحقول
DROP TRIGGER IF EXISTS trigger_protect_admin_fields ON warehouses;
CREATE TRIGGER trigger_protect_admin_fields
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION protect_admin_warehouse_fields();

-- 4. التأكد من وجود إدارة عليا واحدة فقط
CREATE OR REPLACE FUNCTION ensure_single_admin_warehouse()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- التحقق من عدد الإدارات العليا
    IF (NEW.is_admin_warehouse = true OR NEW.warehouse_level = 'admin') THEN
        SELECT COUNT(*) INTO admin_count
        FROM warehouses
        WHERE (is_admin_warehouse = true OR warehouse_level = 'admin')
          AND id != COALESCE(NEW.id, 0);
        
        IF admin_count > 0 THEN
            RAISE EXCEPTION 'يمكن أن يكون هناك إدارة عليا واحدة فقط';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحقق من الإدارة الواحدة
DROP TRIGGER IF EXISTS trigger_ensure_single_admin ON warehouses;
CREATE TRIGGER trigger_ensure_single_admin
    BEFORE INSERT OR UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_admin_warehouse();

-- 5. التأكد من أن الإدارة العليا في depth = 0
CREATE OR REPLACE FUNCTION set_admin_warehouse_depth()
RETURNS TRIGGER AS $$
BEGIN
    -- التأكد من أن الإدارة العليا في depth = 0
    IF (NEW.is_admin_warehouse = true OR NEW.warehouse_level = 'admin') THEN
        NEW.depth := 0;
        NEW.parent_warehouse_id := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتعيين depth
DROP TRIGGER IF EXISTS trigger_set_admin_depth ON warehouses;
CREATE TRIGGER trigger_set_admin_depth
    BEFORE INSERT OR UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION set_admin_warehouse_depth();

-- ============================================================
-- ملاحظات:
-- 1. هذه القيود تضمن أن الإدارة العليا محمية على مستوى قاعدة البيانات
-- 2. حتى لو حاول شخص ما تعديل البيانات مباشرة، ستفشل العملية
-- 3. يجب تشغيل هذا الملف بعد إنشاء جدول warehouses
-- ============================================================

