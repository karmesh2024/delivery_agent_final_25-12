// test-function-system.ts
import { runPipeline } from './src/domains/zoon-os/functions/pipeline/pipeline-engine'
import { createPipelineContext } from './src/domains/zoon-os/functions/tracing/pipeline-context'

async function test() {
  console.log('🧪 بدء اختبار نظام الـ Functions...')

  const context = createPipelineContext('test-user', 'manual')
  
  const steps = [
    {
      nodeId: 'file-write',
      params: {
        filePath: 'test-from-engine.md',
        content: '# تقرير تجريبي\nتم إنشاء هذا الملف بواسطة محرك الـ Pipeline.',
        mode: 'overwrite'
      }
    },
    {
      nodeId: 'file-patch',
      params: {
        filePath: 'test-from-engine.md',
        oldText: 'تقرير تجريبي',
        newText: 'تقرير معدّل بالذكاء الاصطناعي'
      }
    },
    {
      nodeId: 'file-read',
      params: {
        filePath: 'test-from-engine.md'
      }
    },
    {
      nodeId: 'file-list',
      params: {
        extension: '.md'
      }
    }
  ]

  try {
    const result = await runPipeline(steps as any, context)
    
    console.log('\n📊 نتيجة الاختبار:')
    console.log('النجاح الكلي:', result.success)
    console.log('Trace ID:', result.traceId)
    
    result.steps.forEach((s, i) => {
      console.log(`\nخطوة ${i+1} [${s.nodeId}]:`)
      console.log(' - نجاح:', s.success)
      console.log(' - ملخص:', s.summary)
      if (s.data && i === 2) { // عرض محتوى الملف في خطوة القراءة
          console.log(' - محتوى الملف المسترجع:', (s.data as any).content)
      }
    })

  } catch (error) {
    console.error('🚨 فشل الاختبار:', error)
  }
}

test()
