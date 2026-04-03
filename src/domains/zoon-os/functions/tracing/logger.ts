// src/domains/zoon-os/functions/tracing/logger.ts

import { prisma } from '@/lib/prisma'
import { PipelineContext } from './pipeline-context'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface TraceLog {
  traceId: string
  level: LogLevel
  nodeId?: string
  stepIndex?: number
  message: string
  data?: unknown
  durationMs?: number
  timestamp: string
}

/**
 * Logger مرتبط بـ Trace ID لحفظ السجلات في قاعدة البيانات
 */
export class PipelineLogger {
  private logs: TraceLog[] = []

  constructor(private context: PipelineContext) {}

  info(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('info', message, nodeId, stepIndex, data)
  }

  warn(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('warn', message, nodeId, stepIndex, data)
  }

  error(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('error', message, nodeId, stepIndex, data)
  }

  private log(
    level: LogLevel,
    message: string,
    nodeId?: string,
    stepIndex?: number,
    data?: unknown
  ) {
    const entry: TraceLog = {
      traceId: this.context.traceId,
      level,
      nodeId,
      stepIndex,
      message,
      data,
      timestamp: new Date().toISOString()
    }

    this.logs.push(entry)

    // طباعة في Terminal للـ Debugging
    const prefix = `[${this.context.traceId.slice(0, 8)}]`
    const step = stepIndex !== undefined ? ` [خطوة ${stepIndex + 1}]` : ''
    const node = nodeId ? ` [${nodeId}]` : ''
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefix}${step}${node} ${message}`
    )
  }

  /**
   * حفظ كل الـ logs في DB دفعة واحدة عند انتهاء الـ Pipeline
   */
  async flush(): Promise<void> {
    if (this.logs.length === 0) return

    try {
      // حفظ السجلات في جدول pipeline_trace_logs الجديد
      await Promise.all(this.logs.map(log => 
        (prisma as any).pipeline_trace_logs.create({
          data: {
            trace_id: log.traceId,
            level: log.level,
            node_id: log.nodeId,
            step_index: log.stepIndex,
            message: log.message,
            data: log.data ? log.data : undefined,
            duration_ms: log.durationMs || 0,
            created_at: log.timestamp
          }
        })
      ))
    } catch (err) {
      console.error('[Logger] ❌ فشل حفظ السجلات في قاعدة البيانات:', err)
    }
  }

  getLogs(): TraceLog[] {
    return this.logs
  }
}
