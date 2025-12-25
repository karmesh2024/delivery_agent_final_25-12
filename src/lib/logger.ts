// 📋 نظام Logging مركزي آمن لمشروع بيكب

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  AUDIT = 'audit'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  enableStorage: boolean;
  minLevel: LogLevel;
  remoteEndpoint?: string;
  apiKey?: string;
}

class SecureLogger {
  private config: LoggerConfig;
  private sessionId: string;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
  }

  // 🔐 إنشاء معرف جلسة آمن
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🔒 تشفير البيانات الحساسة
  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const masked = { ...data };
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'card', 'credit', 'ssn', 'social', 'phone', 'email', 'address'
    ];

    for (const key in masked) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  // 📝 إنشاء entry آمن
  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    };

    // إضافة معلومات السياق مع إخفاء البيانات الحساسة
    if (context) {
      entry.context = this.maskSensitiveData(context);
    }

    // إضافة معلومات المستخدم من Redux إذا كانت متوفرة
    if (typeof window !== 'undefined' && (window as any).__REDUX_STATE__) {
      try {
        const state = (window as any).__REDUX_STATE__;
        const currentAdmin = state.auth?.currentAdmin;
        if (currentAdmin?.id) {
          entry.userId = currentAdmin.id;
        }
      } catch (e) {
        // تجاهل أخطاء قراءة حالة Redux
      }
    }

    return entry;
  }

  // 🚀 تسجيل رسالة
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, context);

    // التحقق من مستوى التسجيل المطلوب
    if (!this.shouldLog(level)) {
      return;
    }

    // طباعة في وحدة التحكم
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }

    // حفظ في التخزين المحلي
    if (this.config.enableStorage) {
      this.saveToStorage(entry);
    }

    // إرسال للخادم
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  // 🎯 التحقق من مستوى التسجيل
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configLevelIndex = levels.indexOf(this.config.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  // 📋 تسجيل في وحدة التحكم
  private consoleLog(entry: LogEntry): void {
    const logMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.context || {});
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.context || {});
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.context || {});
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.context || {});
        break;
      case LogLevel.AUDIT:
        console.info(`🔐 AUDIT: ${logMessage}`, entry.context || {});
        break;
    }
  }

  // 💾 حفظ في التخزين المحلي
  private saveToStorage(entry: LogEntry): void {
    try {
      const key = 'secure_logs';
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];
      
      // الاحتفاظ بآخر 1000 سجل فقط
      logs.push(entry);
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      // تجاهل أخطاء التخزين
    }
  }

  // 🌐 إرسال للخادم
  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      const response = await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // تجاهل أخطاء الشبكة لتجنب تكرار الطلبات
    }
  }

  // 🎯 API العامة
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  audit(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.AUDIT, message, context);
  }

  // 🔍 الحصول على السجلات المحلية
  getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('secure_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // 🗑️ مسح السجلات
  clearLogs(): void {
    localStorage.removeItem('secure_logs');
  }
}

// 🎛️ إعدادات افتراضية
const defaultConfig: LoggerConfig = {
  enableConsole: process.env.NODE_ENV === 'development',
  enableRemote: process.env.NODE_ENV === 'production',
  enableStorage: true,
  minLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
  apiKey: process.env.LOG_API_KEY,
};

// 🌍 مثيل عام
export const logger = new SecureLogger(defaultConfig);

// 🎯 دوال مساعدة
export const createLogger = (context: Record<string, any>) => {
  return {
    debug: (message: string, extraContext?: Record<string, any>) => 
      logger.debug(message, { ...context, ...extraContext }),
    info: (message: string, extraContext?: Record<string, any>) => 
      logger.info(message, { ...context, ...extraContext }),
    warn: (message: string, extraContext?: Record<string, any>) => 
      logger.warn(message, { ...context, ...extraContext }),
    error: (message: string, extraContext?: Record<string, any>) => 
      logger.error(message, { ...context, ...extraContext }),
    audit: (message: string, extraContext?: Record<string, any>) => 
      logger.audit(message, { ...context, ...extraContext }),
  };
};

// 🔐 دوال أمان
export const logSecurityEvent = (event: string, details?: Record<string, any>) => {
  logger.audit(`Security Event: ${event}`, { 
    event, 
    timestamp: new Date().toISOString(),
    ...details 
  });
};

export const logUserAction = (action: string, userId: string, details?: Record<string, any>) => {
  logger.audit(`User Action: ${action}`, { 
    action, 
    userId, 
    timestamp: new Date().toISOString(),
    ...details 
  });
};