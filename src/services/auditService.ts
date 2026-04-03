/**
 * خدمة تسجيل العمليات والمزامنة (Audit Service)
 * 
 * هذه الخدمة مسؤولة عن تسجيل جميع عمليات المزامنة والتعديلات في النظام
 * لضمان الشفافية وإمكانية التتبع والتحليل
 */

import { supabase } from '@/lib/supabase';

export type EntityType = 'subcategory' | 'product' | 'main_category' | 'brand' | 'unit' | 'classification' | 'sector';
export type OperationType = 'create' | 'update' | 'delete' | 'sync';
export type SyncStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'partial';

export interface AuditLogEntry {
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  operation: OperationType;
  sourceTable: string;
  targetTables?: string[];
  payload?: any;
  userId?: string;
  userEmail?: string;
}

export interface AuditLogResult {
  success: boolean;
  failed: boolean;
  partial: boolean;
  executionTimeMs: number;
  errorMessage?: string;
  errorStack?: string;
  response?: any;
}

export interface AuditLog {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  operation: OperationType;
  source_table: string;
  target_tables?: string[];
  sync_status: SyncStatus;
  execution_time_ms?: number;
  error_message?: string;
  error_stack?: string;
  payload?: any;
  response?: any;
  user_id?: string;
  user_email?: string;
  created_at: string;
  completed_at?: string;
}

class AuditService {
  private static instance: AuditService;
  
  private constructor() {}
  
  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * بدء تسجيل عملية جديدة
   * @param entry بيانات العملية المراد تسجيلها
   * @returns audit log ID أو string فارغ إذا فشل التسجيل
   */
  async startOperation(entry: AuditLogEntry): Promise<string> {
    if (!supabase) {
      console.warn('Supabase not initialized, skipping audit log');
      return '';
    }

    try {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .insert({
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          entity_name: entry.entityName,
          operation: entry.operation,
          source_table: entry.sourceTable,
          target_tables: entry.targetTables || [],
          payload: entry.payload,
          user_id: entry.userId,
          user_email: entry.userEmail,
          sync_status: 'in_progress',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        const errMsg = error?.message || JSON.stringify(error) || 'Unknown error';
        console.warn('Failed to create audit log:', errMsg, { code: error?.code, details: error?.details });
        // لا نرمي خطأ هنا - نكمل العملية حتى لو فشل التسجيل
        return '';
      }

      return data?.id || '';
    } catch (error) {
      console.error('Exception in startOperation:', error);
      return '';
    }
  }

  /**
   * تسجيل نجاح العملية
   * @param auditId معرف سجل العملية
   * @param result نتيجة العملية
   */
  async logSuccess(
    auditId: string, 
    result: Partial<AuditLogResult>
  ): Promise<void> {
    if (!supabase || !auditId) return;

    try {
      await supabase
        .from('sync_audit_log')
        .update({
          sync_status: 'success',
          execution_time_ms: result.executionTimeMs,
          response: result.response,
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId);
    } catch (error) {
      console.error('Failed to log success:', error);
    }
  }

  /**
   * تسجيل فشل العملية
   * @param auditId معرف سجل العملية
   * @param error الخطأ الذي حدث
   * @param executionTimeMs وقت التنفيذ بالميلي ثانية
   */
  async logFailure(
    auditId: string,
    error: Error,
    executionTimeMs: number
  ): Promise<void> {
    if (!supabase || !auditId) return;

    try {
      await supabase
        .from('sync_audit_log')
        .update({
          sync_status: 'failed',
          execution_time_ms: executionTimeMs,
          error_message: error.message,
          error_stack: error.stack,
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId);
    } catch (error) {
      console.error('Failed to log failure:', error);
    }
  }

  /**
   * تسجيل نجاح جزئي (بعض الجداول نجحت، بعضها فشل)
   * @param auditId معرف سجل العملية
   * @param result نتيجة العملية الجزئية
   */
  async logPartial(
    auditId: string,
    result: AuditLogResult
  ): Promise<void> {
    if (!supabase || !auditId) return;

    try {
      await supabase
        .from('sync_audit_log')
        .update({
          sync_status: 'partial',
          execution_time_ms: result.executionTimeMs,
          error_message: result.errorMessage,
          response: result.response,
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId);
    } catch (error) {
      console.error('Failed to log partial:', error);
    }
  }

  /**
   * الحصول على آخر العمليات
   * @param limit عدد السجلات المطلوبة
   * @returns قائمة بآخر العمليات
   */
  async getRecentLogs(limit: number = 50): Promise<AuditLog[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AuditLog[];
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  }

  /**
   * الحصول على العمليات الفاشلة
   * @param limit عدد السجلات المطلوبة
   * @returns قائمة بالعمليات الفاشلة
   */
  async getFailedOperations(limit: number = 50): Promise<AuditLog[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .eq('sync_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AuditLog[];
    } catch (error) {
      console.error('Failed to get failed operations:', error);
      return [];
    }
  }

  /**
   * إحصائيات المزامنة
   * @param entityType نوع الكيان (اختياري) للفلترة
   * @returns إحصائيات المزامنة
   */
  async getSyncStats(entityType?: EntityType): Promise<{
    total: number;
    success: number;
    failed: number;
    partial: number;
    pending: number;
  }> {
    if (!supabase) {
      return { total: 0, success: 0, failed: 0, partial: 0, pending: 0 };
    }

    try {
      let query = supabase
        .from('sync_audit_log')
        .select('sync_status');

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const logs = (data || []) as Array<{ sync_status: SyncStatus }>;
      
      return {
        total: logs.length,
        success: logs.filter(l => l.sync_status === 'success').length,
        failed: logs.filter(l => l.sync_status === 'failed').length,
        partial: logs.filter(l => l.sync_status === 'partial').length,
        pending: logs.filter(l => l.sync_status === 'pending' || l.sync_status === 'in_progress').length
      };
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return { total: 0, success: 0, failed: 0, partial: 0, pending: 0 };
    }
  }

  /**
   * الحصول على عمليات كيان معين
   * @param entityType نوع الكيان
   * @param entityId معرف الكيان
   * @returns قائمة بعمليات الكيان
   */
  async getEntityLogs(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('sync_audit_log')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AuditLog[];
    } catch (error) {
      console.error('Failed to get entity logs:', error);
      return [];
    }
  }
}

export const auditService = AuditService.getInstance();
