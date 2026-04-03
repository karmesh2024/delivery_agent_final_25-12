// src/app/api/zoon/run-function/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runPipeline, PipelineStep } from '@/domains/zoon-os/functions/pipeline/pipeline-engine'
import { createPipelineContext } from '@/domains/zoon-os/functions/tracing/pipeline-context'

/**
 * API الموحد لتشغيل الوظائف و الـ Pipelines
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { steps, mode = 'single', userId = 'admin' } = body

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'يجب توفير قائمة بالخطوات (steps)' }, { status: 400 })
    }

    // 1. إنشاء سياق التتبع (Context)
    const context = createPipelineContext(
      userId,
      mode === 'pipeline' ? 'agent' : 'manual'
    )

    // 2. تشغيل المحرك (Engine)
    const result = await runPipeline(steps as PipelineStep[], context)

    // 3. تحليل النتيجة النهائية
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error: any) {
    console.error('[RunFunctionAPI] 🚨 خطأ كارثي:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      traceId: 'failed-to-start' 
    }, { status: 500 })
  }
}
