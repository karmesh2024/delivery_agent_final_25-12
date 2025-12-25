import { supabase } from '@/lib/supabase';
import { Admin, AdminPermissions } from '@/domains/admins/types';

/**
 * التحقق من امتلاك المسؤول للصلاحية عن طريق استدعاء دالة قاعدة البيانات.
 * هذه هي الطريقة الموصى بها للتحقق الدقيق من الصلاحيات.
 * @param adminId معرف المسؤول للتحقق منه
 * @param permissionCode رمز الصلاحية للتحقق منها
 * @returns وعد بقيمة بوليانية تشير إلى النتيجة
 */
export const hasPermission = async (adminId: string | null | undefined, permissionCode: string): Promise<boolean> => {
  // إذا لم يكن هناك معرف مسؤول، فلا توجد صلاحيات
  console.log(`[TESTING] utils.hasPermission called with: adminId=${adminId}, permissionCode=${permissionCode}`);
  if (!adminId) {
    console.log('[TESTING] No adminId, returning false.');
    return false;
  }

  // --- بداية التعديل المؤقت لأغراض التشخيص ---
  // قم بإلغاء التعليق عن السطر التالي لتجاوز التحقق من RPC وإرجاع true دائمًا
  // console.log('[TESTING] Bypassing RPC check and returning true.');
  // return true;
  // --- نهاية التعديل المؤقت ---

  try {
    // التحقق من وجود كائن supabase
    if (!supabase) {
      console.error('خطأ: كائن supabase غير متاح');
      return false;
    }
    
    // استدعاء الدالة المحسنة في قاعدة البيانات (الاسم الصحيح)
    console.log(`[utils.hasPermission] Checking permission: adminId='${adminId}', permissionCode='${permissionCode}'`);
    const { data, error } = await supabase.rpc('check_admin_permission_enhanced', {
      p_admin_id: adminId,
      permission_code: permissionCode
    });

    if (error) {
      console.error(`خطأ في التحقق من الصلاحية (${permissionCode}):`, error);
      return false;
    }
    
    // RPC ترجع القيمة مباشرة
    return data === true;

  } catch (error) {
    console.error(`خطأ غير متوقع في التحقق من الصلاحية (${permissionCode}):`, error);
    return false;
  }
};

/**
 * فحص صلاحية مع نطاق بيانات
 * مثال: التحقق من صلاحية عرض طلب محدد
 * 
 * @param admin معلومات المسؤول
 * @param permissionCode رمز الصلاحية
 * @param scopeType نوع النطاق (مثل "طلب"، "مستخدم"، إلخ)
 * @param scopeValue قيمة النطاق (مثل معرف الطلب)
 * @returns وعد بقيمة بوليانية تشير إلى النتيجة
 */
export async function hasPermissionWithScope(
  admin: Admin | null, 
  permissionCode: string,
  scopeType: string,
  scopeValue: string | number | object
): Promise<boolean> {
  // التحقق من وجود كائن المسؤول
  if (!admin || !admin.id) return false; // Use admin.id
  
  // ملاحظة: لا نتحقق من الصلاحية العامة هنا لأن الدالة check_permission_with_scope في قاعدة البيانات
  // يجب أن تقوم بالتحقق الشامل (بما في ذلك الصلاحية العامة والنطاق).
  // إذا كانت check_permission_with_scope لا تتحقق من الصلاحية العامة، يجب إضافتها هنا أو تعديل الدالة في قاعدة البيانات.
  
  try {
    // تحويل قيمة النطاق إلى تنسيق JSON إذا لم تكن كذلك
    let jsonScopeValue = scopeValue;
    // Ensure complex objects are handled correctly if needed
    if (typeof scopeValue !== 'object' || scopeValue === null) {
       // Basic handling for primitive types, assuming 'id' is the key
       // Adjust if other keys or structures are used for scope values
       jsonScopeValue = { id: scopeValue };
    } else if (Array.isArray(scopeValue)) {
       // Handle array scope values if necessary
       console.warn("Array scope values might need specific JSON structure for check_permission_with_scope.");
       // Example: jsonScopeValue = { ids: scopeValue }; 
       // Adjust based on expected DB function input
    }
    // If scopeValue is already a suitable object, it passes through
    
    // التحقق من وجود كائن supabase
    if (!supabase) {
      console.error('خطأ: كائن supabase غير متاح');
      return false;
    }
    
    // استعلام من قاعدة البيانات
    // تأكد من أن اسم الدالة RPC والمعاملات صحيحة وموجودة
    const { data, error } = await supabase.rpc('check_permission_with_scope', {
      p_admin_id: admin.id,
      p_permission_code: permissionCode,
      p_scope_type: scopeType,
      p_scope_value: jsonScopeValue // Ensure this matches expected JSONB format in the DB function
    });
    
    if (error) {
      // Log specific permission check errors
      console.error(`خطأ في التحقق من الصلاحية (${permissionCode}) مع النطاق (${scopeType}):`, error);
      return false;
    }
    
    return data === true; // Ensure the RPC returns boolean
  } catch (error) {
    console.error(`خطأ غير متوقع في التحقق من الصلاحية (${permissionCode}) مع النطاق (${scopeType}):`, error);
    return false;
  }
}

/**
 * (مهملة - Deprecated) التحقق المحلي السريع من الصلاحيات (قد تكون البيانات غير دقيقة).
 * تعتمد هذه الدالة على حقل 'permissions' في كائن Admin الذي قد لا يعكس
 * الصلاحيات الكاملة الممنوحة عبر الأدوار والمجموعات والتجاوزات.
 * يوصى باستخدام دالة `hasPermission` التي تستدعي قاعدة البيانات للتحقق الدقيق.
 *
 * @param admin معلومات المسؤول (يجب أن يحتوي على حقل permissions محدث بشكل كامل ليكون مفيدًا)
 * @param permissionCode رمز الصلاحية
 * @returns قيمة بوليانية تشير إلى النتيجة (قد تكون غير دقيقة)
 */
/*
export function hasPermissionLocal(admin: Admin | null, permissionCode: string): boolean {
  if (!admin || !admin.permissions) {
    return false;
  }
  
  // This check is basic and might be inaccurate as it only checks the direct permissions field.
  // It does not account for roles, groups, overrides, or hierarchy.
  const permissions = admin.permissions as AdminPermissions | null | undefined;
  if (permissions && typeof permissions === 'object' && permissions[permissionCode] === true) {
     return true;
   }

  return false;
}
*/

/**
 * دالة مساعدة للحصول على كائن الصلاحيات المستخدم للتحقق المحلي (إذا لزم الأمر).
 * يجب التأكد من أن هذا الكائن يتم تحديثه بشكل صحيح عند تحميل بيانات المستخدم.
 * @param admin معلومات المسؤول
 * @returns كائن الصلاحيات أو null
 */
export const getAdminPermissionsObject = (admin: Admin | null): AdminPermissions | null => {
  if (!admin || !admin.permissions) {
    return null;
  }
  // قد تحتاج لتحويل أو دمج الصلاحيات هنا إذا كان الهيكل معقدًا
  return admin.permissions as AdminPermissions;
};

// يمكنك إضافة المزيد من الدوال المساعدة هنا إذا لزم الأمر