// 🔐 نظام Audit Logging شامل لمشروع بيكب

import { logger } from './logger-safe';
import { logSecurityEvent, logUserAction } from './logger-safe';

export enum AuditAction {
  // 🔐 المصادقة والأمان
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  TOKEN_REFRESHED = 'token_refreshed',
  
  // 👥 إدارة المستخدمين
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  ROLE_CHANGED = 'role_changed',
  
  // 💰 العمليات المالية
  PAYMENT_PROCESSED = 'payment_processed',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_FAILED = 'transaction_failed',
  WITHDRAWAL_REQUESTED = 'withdrawal_requested',
  DEPOSIT_MADE = 'deposit_made',
  REFUND_PROCESSED = 'refund_processed',
  
  // 🏪 إدارة المخازن
  WAREHOUSE_CREATED = 'warehouse_created',
  WAREHOUSE_UPDATED = 'warehouse_updated',
  WAREHOUSE_DELETED = 'warehouse_deleted',
  STOCK_UPDATED = 'stock_updated',
  INVENTORY_ADJUSTED = 'inventory_adjusted',
  
  // 📦 إدارة الطلبات
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_COMPLETED = 'order_completed',
  DELIVERY_ASSIGNED = 'delivery_assigned',
  
  // 🔧 العمليات الحساسة
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  BACKUP_CREATED = 'backup_created',
  SECURITY_SETTING_CHANGED = 'security_setting_changed',
  
  // 🚨 أحداث أمنية
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  API_ABUSE_DETECTED = 'api_abuse_detected',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AuditEntity {
  USER = 'user',
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  WAREHOUSE = 'warehouse',
  PRODUCT = 'product',
  ORDER = 'order',
  TRANSACTION = 'transaction',
  SYSTEM = 'system'
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  userId?: string;
  adminId?: string;
  severity: AuditSeverity;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditConfig {
  enableConsole: boolean;
  enableDatabase: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  retentionDays: number;
  batchSize: number;
  remoteEndpoint?: string;
}

class AuditLogger {
  private config: AuditConfig;
  private batch: AuditEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    
    // إرسال دفعة كل 30 ثانية
    setInterval(() => this.flushBatch(), 30000);
  }

  // 🔐 إنشاء معرف فريد
  private generateSessionId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🆔 إنشاء معرف entry
  private generateEntryId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🔒 تنظيف البيانات الحساسة
  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data } as Record<string, unknown>;
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'card', 'credit', 'ssn', 'social', 'phone', 'email', 'address',
      'pin', 'cvv', 'iban', 'account', 'balance', 'amount'
    ];

    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  // 📝 تسجيل حدث audit
  log(
    action: AuditAction,
    entity: AuditEntity,
    description: string,
    entityId?: string,
    userId?: string,
    adminId?: string,
    severity: AuditSeverity = AuditSeverity.INFO,
    metadata?: Record<string, unknown>,
    success: boolean = true,
    errorMessage?: string
  ): void {
    const entry: AuditEntry = {
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      userId,
      adminId,
      severity,
      description: this.sanitizeMessage(description),
      metadata: metadata ? this.sanitizeData(metadata) as Record<string, unknown> : undefined,
      ip: this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      sessionId: this.sessionId,
      success,
      errorMessage: errorMessage ? this.sanitizeMessage(errorMessage) : undefined,
    };

    // إضافة للدفعة
    this.batch.push(entry);

    // إرسال فوري للأحداث الحرجة
    if (severity === AuditSeverity.CRITICAL) {
      this.flushBatch();
    }

    // إرسال دفعة إذا امتلأت
    if (this.batch.length >= this.config.batchSize) {
      this.flushBatch();
    }

    // تسجيل في وحدة التحكم
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }
  }

  // 🔒 تنظيف الرسائل
  private sanitizeMessage(message: string): string {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /password\s*[:=]\s*[^\s]+/gi,
      /token\s*[:=]\s*[^\s]+/gi,
    ];

    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  // 🔍 الحصول على IP العميل
  private getClientIP(): string {
    if (typeof window !== 'undefined') {
      // في المتصفح
      return 'client';
    }
    return 'server';
  }

  // 📋 تسجيل في وحدة التحكم
  private consoleLog(entry: AuditEntry): void {
    const icon = this.getSeverityIcon(entry.severity);
    const message = `${icon} [AUDIT] ${entry.action.toUpperCase()}: ${entry.description}`;
    
    switch (entry.severity) {
      case AuditSeverity.INFO:
        console.info(message, entry);
        break;
      case AuditSeverity.WARNING:
        console.warn(message, entry);
        break;
      case AuditSeverity.ERROR:
        console.error(message, entry);
        break;
      case AuditSeverity.CRITICAL:
        console.error(`🚨 CRITICAL AUDIT: ${message}`, entry);
        break;
    }
  }

  // 🎯 أيقونة الخطورة
  private getSeverityIcon(severity: AuditSeverity): string {
    switch (severity) {
      case AuditSeverity.INFO: return 'ℹ️';
      case AuditSeverity.WARNING: return '⚠️';
      case AuditSeverity.ERROR: return '❌';
      case AuditSeverity.CRITICAL: return '🚨';
      default: return '📝';
    }
  }

  // 💾 إرسال الدفعة
  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const entriesToSend = [...this.batch];
    this.batch = [];

    try {
      // حفظ في قاعدة البيانات
      if (this.config.enableDatabase) {
        await this.saveToDatabase(entriesToSend);
      }

      // حفظ في ملف
      if (this.config.enableFile) {
        await this.saveToFile(entriesToSend);
      }

      // إرسال للخادم
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(entriesToSend);
      }

    } catch (error) {
      console.error('فشل في إرسال دفعة audit:', error);
      // إعادة إدخال الدفعة للمراجعة لاحقاً
      this.batch.unshift(...entriesToSend);
    }
  }

  // 🗄️ حفظ في قاعدة البيانات
  private async saveToDatabase(entries: AuditEntry[]): Promise<void> {
    try {
      // يمكن تطبيق منطق حفظ في قاعدة البيانات هنا
      console.log(`Saving ${entries.length} audit entries to database`);
    } catch (error) {
      console.error('خطأ في حفظ audit entries في قاعدة البيانات:', error);
    }
  }

  // 📁 حفظ في ملف
  private async saveToFile(entries: AuditEntry[]): Promise<void> {
    try {
      const logData = entries.map(entry => JSON.stringify(entry)).join('\n');
      // يمكن تطبيق منطق حفظ في ملف هنا
      console.log(`Saving audit entries to file:\n${logData}`);
    } catch (error) {
      console.error('خطأ في حفظ audit entries في ملف:', error);
    }
  }

  // 🌐 إرسال للخادم
  private async sendToRemote(entries: AuditEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      console.warn('Remote endpoint not configured, skipping remote audit logging');
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer audit-token',
        },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('خطأ في إرسال audit entries للخادم:', error);
      throw error;
    }
  }

  // 🔍 الاستعلام عن السجلات
  async query(filters: {
    action?: AuditAction;
    entity?: AuditEntity;
    userId?: string;
    adminId?: string;
    severity?: AuditSeverity;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditEntry[]> {
    // تطبيق منطق الاستعلام هنا
    return [];
  }

  // 📊 إحصائيات
  getStats(): {
    totalEntries: number;
    entriesByAction: Record<AuditAction, number>;
    entriesBySeverity: Record<AuditSeverity, number>;
    entriesByEntity: Record<AuditEntity, number>;
  } {
    const entriesByAction = {} as Record<AuditAction, number>;
    const entriesBySeverity = {} as Record<AuditSeverity, number>;
    const entriesByEntity = {} as Record<AuditEntity, number>;

    // حساب الإحصائيات من الدفعة الحالية
    this.batch.forEach(entry => {
      // Count by action
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
      
      // Count by severity
      entriesBySeverity[entry.severity] = (entriesBySeverity[entry.severity] || 0) + 1;
      
      // Count by entity
      entriesByEntity[entry.entity] = (entriesByEntity[entry.entity] || 0) + 1;
    });

    return {
      totalEntries: this.batch.length,
      entriesByAction,
      entriesBySeverity,
      entriesByEntity,
    };
  }
}

// 🎛️ إعدادات افتراضية
const defaultConfig: AuditConfig = {
  enableConsole: process.env.NODE_ENV === 'development',
  enableDatabase: process.env.NODE_ENV === 'production',
  enableFile: false,
  enableRemote: false,
  retentionDays: 90,
  batchSize: 10,
  remoteEndpoint: process.env.NEXT_PUBLIC_AUDIT_ENDPOINT,
};

// 🌍 مثيل عام
export const auditLogger = new AuditLogger(defaultConfig);

// 🎯 دوال مساعدة للأمان
export const auditLogin = (userId: string, success: boolean, errorMessage?: string) => {
  auditLogger.log(
    success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    AuditEntity.USER,
    success ? 'تسجيل دخول ناجح' : 'فشل في تسجيل الدخول',
    undefined,
    userId,
    undefined,
    success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    { timestamp: new Date().toISOString() },
    success,
    errorMessage
  );
};

export const auditPermissionDenied = (userId: string, action: string, resource: string) => {
  auditLogger.log(
    AuditAction.PERMISSION_DENIED,
    AuditEntity.USER,
    `رفض الإذن: ${action} على ${resource}`,
    undefined,
    userId,
    undefined,
    AuditSeverity.WARNING,
    { action, resource }
  );
};

export const auditSensitiveOperation = (adminId: string, operation: string, entity: AuditEntity, entityId?: string) => {
  auditLogger.log(
    AuditAction.SYSTEM_CONFIG_CHANGED,
    entity,
    `عملية حساسة: ${operation}`,
    entityId,
    undefined,
    adminId,
    AuditSeverity.WARNING,
    { operation }
  );
};

export const auditSecurityEvent = (event: string, details?: Record<string, unknown>) => {
  auditLogger.log(
    AuditAction.SUSPICIOUS_ACTIVITY,
    AuditEntity.SYSTEM,
    `حدث أمني: ${event}`,
    undefined,
    undefined,
    undefined,
    AuditSeverity.CRITICAL,
    details
  );
};