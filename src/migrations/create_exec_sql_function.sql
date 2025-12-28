-- =========================================================
-- 🔧 دالة مساعدة لتطبيق أوامر SQL من JavaScript
-- =========================================================
-- تاريخ الإنشاء: 2025-01-18
-- الهدف: إنشاء دالة تسمح بتطبيق أوامر SQL من JavaScript

-- إنشاء دالة exec_sql
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT AS $$
BEGIN
  -- تنفيذ الأمر SQL
  EXECUTE sql_query;
  
  -- إرجاع رسالة نجاح
  RETURN 'تم تنفيذ الأمر بنجاح';
EXCEPTION
  WHEN OTHERS THEN
    -- إرجاع رسالة الخطأ
    RETURN 'خطأ: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- منح الصلاحيات للمستخدمين المصرح لهم
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- تعليق على الدالة
COMMENT ON FUNCTION exec_sql(TEXT) IS 'دالة مساعدة لتطبيق أوامر SQL من JavaScript';


