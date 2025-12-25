/**
 * نظام التحقق من متغيرات البيئة بشكل آمن
 * يمنع تسريب مفاتيح حساسة في اللوج
 */

import { envLogger, logger } from './logger-safe';

interface EnvironmentConfig {
  // مطلوبة
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // اختيارية
  NEXT_PUBLIC_APP_ENV?: 'development' | 'production' | 'staging';
  DATABASE_URL?: string;
}

class EnvironmentManager {
  private config: EnvironmentConfig | null = null;

  public loadConfig(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    // الحصول على متغيرات البيئة
    const nextPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const nextPublicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const nextPublicAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
    const databaseUrl = process.env.DATABASE_URL;

    const required = {
      NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey || '',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey || ''
    };

    // فحص المتغيرات المطلوبة (فقط للمتغيرات غير الفارغة)
    const missingVars = Object.entries(required)
      .filter(([, value]) => !value || value.trim() === '')
      .map(([key]) => key);

    // في client-side، نتجاهل فحص SUPABASE_SERVICE_ROLE_KEY
    const isClientSide = typeof window !== 'undefined';
    if (isClientSide) {
      const publicMissingVars = missingVars.filter(key => 
        key !== 'SUPABASE_SERVICE_ROLE_KEY' && key.startsWith('NEXT_PUBLIC_')
      );
      
      if (publicMissingVars.length > 0) {
        logger.error(`Missing required public environment variables: ${publicMissingVars.join(', ')}`);
        throw new Error(`Missing required public environment variables: ${publicMissingVars.join(', ')}`);
      }
    } else {
      // في server-side، نفحص جميع المتغيرات
      if (missingVars.length > 0) {
        logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    }

    // فحص المتغيرات الآمن (فقط للمتغيرات الموجودة)
    const isDevelopment = process.env.NODE_ENV === 'development';
    Object.entries(required).forEach(([key, value]) => {
      if (value && !envLogger.check(key, value)) {
        // في development، نتابع حتى لو كان الفحص fail
        if (!isDevelopment) {
          throw new Error(`Environment variable ${key} validation failed`);
        }
      }
    });

    // التحقق من صحة URL (فقط إذا كان موجوداً)
    if (required.NEXT_PUBLIC_SUPABASE_URL && !this.isValidUrl(required.NEXT_PUBLIC_SUPABASE_URL)) {
      logger.error('Invalid Supabase URL format');
      throw new Error('Invalid Supabase URL format');
    }

    // التحقق من أن ANON_KEY يبدو صحيح (فقط إذا كان موجوداً)
    if (required.NEXT_PUBLIC_SUPABASE_ANON_KEY && !this.isValidAnonKey(required.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      logger.error('Invalid Supabase ANON_KEY format');
      throw new Error('Invalid Supabase ANON_KEY format');
    }

    // التحقق من أن Service Role Key لا يبدأ بـ NEXT_PUBLIC (فقط إذا كان موجوداً)
    if (required.SUPABASE_SERVICE_ROLE_KEY && required.SUPABASE_SERVICE_ROLE_KEY.startsWith('NEXT_PUBLIC_')) {
      logger.security('Service role key incorrectly exposed with NEXT_PUBLIC_ prefix');
      throw new Error('Service role key security violation: starts with NEXT_PUBLIC_');
    }

    this.config = {
      NEXT_PUBLIC_SUPABASE_URL: required.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: required.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: required.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_ENV: (nextPublicAppEnv as 'development' | 'production' | 'staging') || 'development',
      DATABASE_URL: databaseUrl
    };

    logger.info(`Environment configuration loaded successfully for: ${this.config.NEXT_PUBLIC_APP_ENV} environment`);
    return this.config;
  }

  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  public isProduction(): boolean {
    return this.getConfig().NEXT_PUBLIC_APP_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.getConfig().NEXT_PUBLIC_APP_ENV === 'development';
  }

  public isStaging(): boolean {
    return this.getConfig().NEXT_PUBLIC_APP_ENV === 'staging';
  }

  private isValidUrl(url: string): boolean {
    if (!url || url.trim() === '') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && url.includes('.supabase.co');
    } catch {
      return false;
    }
  }

  private isValidAnonKey(key: string): boolean {
    if (!key || key.trim() === '') return false;
    // Supabase ANON keys usually start with 'eyJ' (JWT) and are 200+ chars
    return key.startsWith('eyJ') && key.length > 100;
  }

  public validateSecuritySettings(): SecurityValidationResult {
    const issues: SecurityIssue[] = [];
    
    // في client-side، لا نفحص الأمان بعمق
    if (typeof window !== 'undefined') {
      return {
        isValid: true,
        issues: []
      };
    }
    
    const config = this.getConfig();

    // فحص Service Role Key
    if (config.SUPABASE_SERVICE_ROLE_KEY && config.SUPABASE_SERVICE_ROLE_KEY.startsWith('NEXT_PUBLIC_')) {
      issues.push({
        type: 'CRITICAL',
        category: 'Environment',
        message: 'Service role key exposed to client',
        recommendation: 'Remove NEXT_PUBLIC_ prefix from SUPABASE_SERVICE_ROLE_KEY'
      });
    }

    // فحص بيئة الإنتاج
    if (this.isProduction()) {
      if (!config.DATABASE_URL) {
        issues.push({
          type: 'WARNING',
          category: 'Performance',
          message: 'DATABASE_URL not set for production',
          recommendation: 'Set DATABASE_URL for optimized performance'
        });
      }
    }

    // فحص URLs
    if (config.NEXT_PUBLIC_SUPABASE_URL && !this.isValidUrl(config.NEXT_PUBLIC_SUPABASE_URL)) {
      issues.push({
        type: 'CRITICAL',
        category: 'Configuration',
        message: 'Invalid Supabase URL',
        recommendation: 'Check NEXT_PUBLIC_SUPABASE_URL format'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'CRITICAL').length === 0,
      issues
    };
  }

  public getSafeConfigForLogging(): Partial<EnvironmentConfig> {
    const config = this.getConfig();
    return {
      NEXT_PUBLIC_APP_ENV: config.NEXT_PUBLIC_APP_ENV,
      DATABASE_URL: config.DATABASE_URL ? '[SET]' : '[NOT SET]'
      // لا نعرض المفاتيح الحساسة
    };
  }
}

export interface SecurityIssue {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'Environment' | 'Configuration' | 'Performance' | 'Security';
  message: string;
  recommendation: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
}

export const envManager = new EnvironmentManager();

// دالة للتحقق من البيئة بشكل آمن
export function validateEnvironment(): void {
  // Check if we're in client-side code
  if (typeof window !== 'undefined') {
    // In client-side, only validate public environment variables
    try {
      const config = envManager.getConfig();
      
      // Check only public variables in client-side
      if (!config.NEXT_PUBLIC_SUPABASE_URL || !config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        logger.error('Missing required public environment variables in client-side');
        throw new Error('Missing required public environment variables');
      }
      
      logger.info('Client-side environment validation passed successfully');
      return;
    } catch (error) {
      logger.error('Client-side environment validation error:', error);
      // Don't throw error in client-side to prevent app crash
      return;
    }
  }
  
  // Server-side validation (full validation)
  try {
    const validation = envManager.validateSecuritySettings();
    
    if (!validation.isValid) {
      logger.error('Environment validation failed');
      validation.issues.forEach(issue => {
        logger.error(`[${issue.type}] ${issue.message}: ${issue.recommendation}`);
      });
      throw new Error('Environment validation failed');
    }

    if (validation.issues.length > 0) {
      logger.warn(`Environment validation completed with ${validation.issues.length} warnings`);
    } else {
      logger.info('Environment validation passed successfully');
    }
  } catch (error) {
    logger.error('Environment validation error:', error);
    throw error;
  }
}