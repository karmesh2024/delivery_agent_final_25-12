// src/domains/zoon-os/functions/tracing/pipeline-context.ts

import { v4 as uuidv4 } from 'uuid'

export interface PipelineContext {
  traceId: string          // UUID فريد لكل تشغيل Pipeline
  pipelineId?: string      // إذا كانت Pipeline محفوظة في DB
  userId: string
  triggeredBy: 'agent' | 'manual' | 'cron' | 'webhook' | 'dlq-retry'
  startTime: number
  metadata?: Record<string, unknown>
}

/**
 * إنشاء Context جديد لكل تشغيل Pipeline
 */
export function createPipelineContext(
  userId: string,
  triggeredBy: PipelineContext['triggeredBy'],
  pipelineId?: string
): PipelineContext {
  return {
    traceId: uuidv4(),
    pipelineId,
    userId,
    triggeredBy,
    startTime: Date.now(),
    metadata: {}
  }
}
