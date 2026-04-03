// 📋 نظام Logging مركزي آمن ومطور لمشروع بيكب

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  AUDIT = "audit",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
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

  // 🔒 إخفاء البيانات الحساسة
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const masked = { ...data } as Record<string, unknown>;
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "card",
      "credit",
      "ssn",
      "social",
      "phone",
      "email",
      "address",
    ];

    for (const key in masked) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        masked[key] = "[REDACTED]";
      } else if (typeof masked[key] === "object") {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  // 📝 إنشاء entry آمن
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      userAgent: typeof window !== "undefined"
        ? window.navigator.userAgent
        : "server",
    };

    // إضافة معلومات السياق مع إخفاء البيانات الحساسة
    if (context) {
      entry.context = this.maskSensitiveData(context) as Record<
        string,
        unknown
      >;
    }

    return entry;
  }

  // 🚀 تسجيل رسالة
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void {
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
    const logMessage =
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;

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
      const key = "secure_logs";
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) as LogEntry[] : [];

      // الاحتفاظ بآخر 1000 سجل فقط
      logs.push(entry);
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem(key, JSON.stringify(logs));
    } catch {
      // تجاهل أخطاء التخزين
    }
  }

  // 🌐 إرسال للخادم
  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      const response = await fetch(this.config.remoteEndpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch {
      // تجاهل أخطاء الشبكة لتجنب تكرار الطلبات
    }
  }

  // 🎯 API العامة
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  audit(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.AUDIT, message, context);
  }

  // 🔍 الحصول على السجلات المحلية
  getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem("secure_logs");
      return stored ? JSON.parse(stored) as LogEntry[] : [];
    } catch {
      return [];
    }
  }

  // 🗑️ مسح السجلات
  clearLogs(): void {
    localStorage.removeItem("secure_logs");
  }
}

// 🎛️ إعدادات افتراضية
const defaultConfig: LoggerConfig = {
  enableConsole: process.env.NODE_ENV === "development",
  enableRemote: process.env.NODE_ENV === "production",
  enableStorage: true,
  minLevel: process.env.NODE_ENV === "development"
    ? LogLevel.DEBUG
    : LogLevel.INFO,
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
  apiKey: process.env.LOG_API_KEY,
};

// 🌍 مثيل عام
export const logger = new SecureLogger(defaultConfig);

// 🎯 دوال مساعدة
export const createLogger = (context: Record<string, unknown>) => {
  return {
    debug: (message: string, extraContext?: Record<string, unknown>) =>
      logger.debug(message, { ...context, ...extraContext }),
    info: (message: string, extraContext?: Record<string, unknown>) =>
      logger.info(message, { ...context, ...extraContext }),
    warn: (message: string, extraContext?: Record<string, unknown>) =>
      logger.warn(message, { ...context, ...extraContext }),
    error: (message: string, extraContext?: Record<string, unknown>) =>
      logger.error(message, { ...context, ...extraContext }),
    audit: (message: string, extraContext?: Record<string, unknown>) =>
      logger.audit(message, { ...context, ...extraContext }),
  };
};

// 🔐 دوال أمان
export const logSecurityEvent = (
  event: string,
  details?: Record<string, unknown>,
) => {
  logger.audit(`Security Event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logUserAction = (
  action: string,
  userId: string,
  details?: Record<string, unknown>,
) => {
  logger.audit(`User Action: ${action}`, {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// 🎯 دوال متخصصة للخدمات

// API Logger - للمهام المتعلقة بالـ API
export const apiLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    logger.info(`[API] ${message}`, context),
  error: (message: string, context?: Record<string, unknown>) =>
    logger.error(`[API] ${message}`, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    logger.warn(`[API] ${message}`, context),
  debug: (message: string, context?: Record<string, unknown>) =>
    logger.debug(`[API] ${message}`, context),
};

// Auth Logger - للمهام المتعلقة بالمصادقة
export const authLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    logger.info(`[AUTH] ${message}`, context),
  error: (message: string, context?: Record<string, unknown>) =>
    logger.error(`[AUTH] ${message}`, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    logger.warn(`[AUTH] ${message}`, context),
  audit: (message: string, context?: Record<string, unknown>) =>
    logger.audit(`[AUTH] ${message}`, context),
};

// Validation Logger - للمهام المتعلقة بالتحقق
export const validationLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    logger.info(`[VALIDATION] ${message}`, context),
  error: (message: string, context?: Record<string, unknown>) =>
    logger.error(`[VALIDATION] ${message}`, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    logger.warn(`[VALIDATION] ${message}`, context),
  debug: (message: string, context?: Record<string, unknown>) =>
    logger.debug(`[VALIDATION] ${message}`, context),
};

// DB Logger - للمهام المتعلقة بقاعدة البيانات
export const dbLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    logger.info(`[DB] ${message}`, context),
  error: (message: string, context?: Record<string, unknown>) =>
    logger.error(`[DB] ${message}`, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    logger.warn(`[DB] ${message}`, context),
  debug: (message: string, context?: Record<string, unknown>) =>
    logger.debug(`[DB] ${message}`, context),
};

// 🔒 دالة تنظيف البيانات قبل التسجيل
export const cleanForLog = (data: unknown): unknown => {
  if (typeof data === "string") {
    // تنظيف النصوص من المعلومات الحساسة
    return data
      .replace(/password/gi, "[PASSWORD]")
      .replace(/token/gi, "[TOKEN]")
      .replace(/secret/gi, "[SECRET]")
      .replace(/key/gi, "[KEY]")
      .replace(/auth/gi, "[AUTH]")
      .replace(/credential/gi, "[CREDENTIAL]");
  }

  if (typeof data === "object" && data !== null) {
    const cleaned = { ...data } as Record<string, unknown>;
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "card",
      "credit",
      "ssn",
      "social",
      "phone",
      "email",
      "address",
      "user_password",
      "access_token",
      "refresh_token",
      "api_key",
      "private_key",
      "public_key",
      "hash",
      "salt",
    ];

    for (const key in cleaned) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        cleaned[key] = "[REDACTED]";
      } else if (typeof cleaned[key] === "string") {
        // تنظيف القيم النصية
        cleaned[key] = cleanForLog(cleaned[key]);
      } else if (typeof cleaned[key] === "object") {
        // تنظيف الكائنات المتداخلة
        cleaned[key] = cleanForLog(cleaned[key]);
      }
    }

    return cleaned;
  }

  return data;
};

// 🎛️ دوال مساعدة للتكامل مع Redux
export const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // محاولة الحصول من Redux store أولاً
    const state = localStorage.getItem("persist:app");
    if (state) {
      const parsed = JSON.parse(state);
      const auth = JSON.parse(parsed.auth || "{}");
      if (auth.user?.id || auth.currentAdmin?.id) {
        return auth.user?.id || auth.currentAdmin?.id;
      }
    }
  } catch {
    // تجاهل أخطاء التحليل
  }

  return null;
};

export const getCurrentSession = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      const session = localStorage.getItem("auth_session");
      return session ? JSON.parse(session).id : null;
    } catch {
      return null;
    }
  }
  return null;
};

// 🌍 Environment Logger - للتحقق من متغيرات البيئة
export const envLogger = {
  check: (key: string, value: string): boolean => {
    // فحص أساسي لقيم متغيرات البيئة
    if (!value || typeof value !== "string") {
      return false;
    }

    // فحص طول المفاتيح
    if (key.length < 3 || key.length > 100) {
      return false;
    }

    // فحص الأحرف المسموحة في أسماء المتغيرات
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      return false;
    }

    // فحص قيم محددة حسب نوع المتغير
    if (key.includes("URL") || key.includes("ENDPOINT")) {
      return /^https?:\/\/.+/.test(value);
    }

    if (
      key.includes("KEY") || key.includes("SECRET") || key.includes("TOKEN")
    ) {
      // فحص طول المفاتيح (على الأقل 20 حرف للـ API keys)
      return value.length >= 20;
    }

    if (key.includes("EMAIL")) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    if (key.includes("PASSWORD")) {
      // فحص قوة كلمة المرور (على الأقل 8 أحرف وتحتوي على حروف وأرقام)
      return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value);
    }

    // التحقق من القيم المحظورة
    const forbiddenValues = [
      "null",
      "undefined",
      "none",
      "test",
      "example",
      "placeholder",
    ];
    if (forbiddenValues.includes(value.toLowerCase())) {
      return false;
    }

    // فحص إضافية للقيم التي تحتوي على معلومات حساسة
    const sensitivePatterns = [
      /password\s*=\s*['\"]?123/i,
      /secret\s*=\s*['\"]?secret/i,
      /key\s*=\s*['\"]?key/i,
      /token\s*=\s*['\"]?token/i,
    ];

    if (sensitivePatterns.some((pattern) => pattern.test(value))) {
      return false;
    }

    return true;
  },

  validate: (
    config: Record<string, string>,
  ): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];

    for (const [key, value] of Object.entries(config)) {
      if (!envLogger.check(key, value)) {
        issues.push(`Invalid environment variable: ${key}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};
