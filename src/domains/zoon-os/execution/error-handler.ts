export type ZoonErrorType =
  | 'NETWORK_ERROR'      // فشل الاتصال بالشبكة
  | 'TIMEOUT'            // انتهت مهلة الاستجابة
  | 'AUTH_ERROR'         // خطأ في الصلاحيات (401/403)
  | 'NOT_FOUND'          // المورد غير موجود (404)
  | 'SERVER_ERROR'       // خطأ في السيرفر الخارجي (5xx)
  | 'VALIDATION_ERROR'   // بيانات إدخال غير صحيحة
  | 'UNKNOWN'            // خطأ غير مصنف

export interface ZoonError {
  type: ZoonErrorType
  message: string           // رسالة للمستخدم بالعربية
  technicalDetail: string   // للـ logs التقنية فقط
  retryable: boolean        // هل تستحق إعادة المحاولة؟
  suggestion?: string       // ماذا يقترح الوكيل للمستخدم
  statusCode?: number       // HTTP status إن وُجد
}

/**
 * تصنيف الخطأ بناءً على HTTP status أو نوع الخطأ
 * يُستدعى من المحرك المركزي فقط
 */
export function classifyError(error: unknown, statusCode?: number): ZoonError {
  const msg = error instanceof Error ? error.message : String(error)

  // --- تصنيف حسب HTTP Status Code ---
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return {
        type: 'AUTH_ERROR',
        message: 'لا توجد صلاحية للوصول لهذه الخدمة',
        technicalDetail: msg,
        retryable: false,
        suggestion: 'تحقق من إعدادات الاتصال في لوحة التحكم',
        statusCode
      }
    }
    if (statusCode === 404) {
      return {
        type: 'NOT_FOUND',
        message: 'المورد المطلوب غير موجود',
        technicalDetail: msg,
        retryable: false,
        statusCode
      }
    }
    if (statusCode === 422) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'البيانات المُرسلة غير صحيحة أو ناقصة',
        technicalDetail: msg,
        retryable: false,
        suggestion: 'تأكد من صحة البيانات المطلوبة',
        statusCode
      }
    }
    if (statusCode >= 500) {
      return {
        type: 'SERVER_ERROR',
        message: 'الخدمة الخارجية تواجه مشكلة مؤقتة',
        technicalDetail: msg,
        retryable: true, 
        suggestion: 'سأحاول مرة أخرى تلقائياً',
        statusCode
      }
    }
  }

  // --- تصنيف حسب نوع الخطأ النصي ---
  if (msg === 'TIMEOUT' || msg.toLowerCase().includes('timeout')) {
    return {
      type: 'TIMEOUT',
      message: 'انتهت مهلة الاستجابة من الخدمة',
      technicalDetail: msg,
      retryable: true,
      suggestion: 'سأحاول مجدداً، قد تكون الخدمة بطيئة مؤقتاً'
    }
  }

  if (
    msg.toLowerCase().includes('fetch') ||
    msg.toLowerCase().includes('network') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND')
  ) {
    return {
      type: 'NETWORK_ERROR',
      message: 'تعذر الاتصال بالخدمة',
      technicalDetail: msg,
      retryable: true,
      suggestion: 'تحقق من اتصال الإنترنت أو السيرفر الخارجي'
    }
  }

  return {
    type: 'UNKNOWN',
    message: 'حدث خطأ غير متوقع أثناء المعالجة',
    technicalDetail: msg,
    retryable: false,
    suggestion: 'إذا تكرر الخطأ، يُرجى مراجعة سجلات النظام'
  }
}

/**
 * تحويل ZoonError إلى نص يفهمه الوكيل ليُعيد صياغته للمستخدم
 */
export function errorToAgentMessage(error: ZoonError, toolName: string): string {
  let message = `⚠️ فشل تنفيذ الأداة "[${toolName}]": ${error.message}`
  if (error.suggestion) {
    message += `\n💡 اقتراح: ${error.suggestion}`
  }
  return message
}
