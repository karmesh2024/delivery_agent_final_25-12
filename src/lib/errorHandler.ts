// 🛡️ نظام Error Handling متطور وآمن لمشروع بيكب

import { logger } from './logger-safe';
import { logSecurityEvent, logUserAction } from './logger-safe';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization', 
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  EXTERNAL_API = 'external_api',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic',
  SECURITY = 'security',
  RATE_LIMIT = 'rate_limit'
}

export interface AppError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableNotification: boolean;
  enableReporting: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  isProduction: boolean;
}

class SecureErrorHandler {
  private config: ErrorHandlerConfig;
  private retryAttempts: Map<string, number> = new Map();
  private errorStats: Map<string, { count: number; lastSeen: number }> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableNotification: true,
      enableReporting: false,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      isProduction: process.env.NODE_ENV === 'production',
      ...config,
    };
  }

  // 🎯 إنشاء خطأ آمن
  createError(
    code: string,
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    details?: Record<string, unknown>
  ): AppError {
    const error: AppError = {
      code,
      message: this.sanitizeMessage(message),
      category,
      severity,
      details: this.sanitizeDetails(details),
      timestamp: new Date().toISOString(),
    };

    // إضافة معلومات السياق إذا كانت متوفرة
    if (typeof window !== 'undefined') {
      try {
        const state = (window as Window & { __REDUX_STATE__?: Record<string, unknown> }).__REDUX_STATE__;
        if (state?.auth && typeof state.auth === 'object') {
          const auth = state.auth as Record<string, unknown>;
          const currentAdmin = auth.currentAdmin as Record<string, unknown> | undefined;
          if (currentAdmin?.id) {
            error.userId = String(currentAdmin.id);
          }
        }
        error.userAgent = window.navigator.userAgent;
      } catch {
        // تجاهل أخطاء قراءة الحالة
      }
    }

    return error;
  }

  // 🔒 تنظيف الرسائل الحساسة
  private sanitizeMessage(message: string): string {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // أرقام بطاقات الائتمان
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // عناوين البريد الإلكتروني
      /\b\d{3}-\d{2}-\d{4}\b/g, // أرقام الضمان الاجتماعي
      /password\s*[:=]\s*[^\s]+/gi, // كلمات المرور
      /token\s*[:=]\s*[^\s]+/gi, // التوكن
    ];

    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  // 🔒 تنظيف تفاصيل الخطأ
  private sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sanitized: Record<string, unknown> = {};
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // 📊 تسجيل إحصائيات الأخطاء
  private updateErrorStats(code: string): void {
    const now = Date.now();
    const existing = this.errorStats.get(code) || { count: 0, lastSeen: 0 };
    
    existing.count++;
    existing.lastSeen = now;
    this.errorStats.set(code, existing);

    // تسجيل حدث أمني إذا تجاوز الخطأ حد معين
    if (existing.count > 10 && now - existing.lastSeen < 60000) { // أكثر من 10 أخطاء في دقيقة
      logSecurityEvent(`High Error Rate: ${code}`, {
        errorCode: code,
        count: existing.count,
        timeWindow: '1 minute'
      });
    }
  }

  // 🎯 التعامل مع الخطأ
  async handleError(
    code: string,
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    details?: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<void> {
    // إنشاء الخطأ
    const error = this.createError(code, message, category, severity, details);

    // إضافة السياق إذا كان متوفراً
    if (context) {
      error.details = { ...error.details, ...context };
    }

    // تحديث الإحصائيات
    this.updateErrorStats(code);

    // تسجيل الخطأ
    if (this.config.enableLogging) {
      await this.logError(error);
    }

    // إرسال إشعارات
    if (this.config.enableNotification) {
      await this.notifyError(error);
    }

    // إرسال تقارير
    if (this.config.enableReporting) {
      await this.reportError(error);
    }

    // محاولة إعادة المحاولة للخطأ
    if (this.config.enableRetry && severity !== ErrorSeverity.CRITICAL) {
      await this.retryError(error);
    }
  }

  // 📝 تسجيل الخطأ
  private async logError(error: AppError): Promise<void> {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`;
    const logContext = {
      ...error.details,
      category: error.category,
      timestamp: error.timestamp,
      userId: error.userId,
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info(logMessage, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(logMessage, logContext);
        break;
      case ErrorSeverity.HIGH:
        logger.error(logMessage, logContext);
        break;
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR: ${logMessage}`, logContext);
        break;
    }
  }

  // 📢 إرسال إشعارات
  private async notifyError(error: AppError): Promise<void> {
    // إرسال إشعار للخطأ شديد الخطورة
    if (error.severity === ErrorSeverity.CRITICAL) {
      logSecurityEvent(`Critical Error Detected: ${error.code}`, {
        error: error.message,
        category: error.category,
        details: error.details,
      });
    }

    // إرسال إشعار للخطأ أمني
    if (error.category === ErrorCategory.SECURITY) {
      logSecurityEvent(`Security Error: ${error.code}`, {
        error: error.message,
        details: error.details,
        userId: error.userId,
      });
    }
  }

  // 📊 إرسال تقارير
  private async reportError(error: AppError): Promise<void> {
    try {
      // يمكن إرسال التقرير لخدمة مراقبة الأخطاء
      // مثل Sentry, Bugsnag, etc.
      console.info('Error reported:', error);
    } catch (reportingError) {
      // تجاهل أخطاء التقرير
    }
  }

  // 🔄 محاولة إعادة المحاولة
  private async retryError(error: AppError): Promise<void> {
    if (!error.requestId) return;

    const attempts = this.retryAttempts.get(error.requestId) || 0;
    
    if (attempts < this.config.maxRetries) {
      this.retryAttempts.set(error.requestId, attempts + 1);
      
      // انتظار قبل إعادة المحاولة
      setTimeout(() => {
        // يمكن تنفيذ منطق إعادة المحاولة هنا
        logger.info(`Retrying error ${error.code}`, { 
          attempt: attempts + 1,
          maxRetries: this.config.maxRetries 
        });
      }, this.config.retryDelay);
    } else {
      // حد أقصى للمحاولات
      this.retryAttempts.delete(error.requestId);
      logger.error(`Max retries exceeded for error ${error.code}`, { 
        maxRetries: this.config.maxRetries,
        details: error.details 
      });
    }
  }

  // 📊 الحصول على إحصائيات الأخطاء
  getErrorStats(): Record<string, { count: number; lastSeen: number }> {
    return Object.fromEntries(this.errorStats);
  }

  // 🧹 مسح الإحصائيات
  clearStats(): void {
    this.errorStats.clear();
    this.retryAttempts.clear();
  }
}

// 🎛️ إعدادات افتراضية
const defaultConfig: ErrorHandlerConfig = {
  enableLogging: true,
  enableNotification: true,
  enableReporting: false,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  isProduction: process.env.NODE_ENV === 'production',
};

// 🌍 مثيل عام
export const errorHandler = new SecureErrorHandler(defaultConfig);

// 🎯 دوال مساعدة
export const handleAuthError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'AUTH_ERROR',
    message,
    ErrorCategory.AUTHENTICATION,
    ErrorSeverity.HIGH,
    details
  );
};

export const handleValidationError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'VALIDATION_ERROR',
    message,
    ErrorCategory.VALIDATION,
    ErrorSeverity.MEDIUM,
    details
  );
};

export const handleSecurityError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'SECURITY_ERROR',
    message,
    ErrorCategory.SECURITY,
    ErrorSeverity.CRITICAL,
    details
  );
};

export const handleDatabaseError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'DATABASE_ERROR',
    message,
    ErrorCategory.DATABASE,
    ErrorSeverity.HIGH,
    details
  );
};

export const handleNetworkError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'NETWORK_ERROR',
    message,
    ErrorCategory.NETWORK,
    ErrorSeverity.MEDIUM,
    details
  );
};

export const handleBusinessLogicError = (message: string, details?: Record<string, unknown>) => {
  return errorHandler.handleError(
    'BUSINESS_ERROR',
    message,
    ErrorCategory.BUSINESS_LOGIC,
    ErrorSeverity.MEDIUM,
    details
  );
};