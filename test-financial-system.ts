import { runPipeline } from './src/domains/zoon-os/functions/pipeline/pipeline-engine';
import { createPipelineContext } from './src/domains/zoon-os/functions/tracing/pipeline-context';

async function testFinancialPipeline() {
  console.log('🧪 بدء اختبار مهارات المالية...');

  const context = createPipelineContext('test-admin', 'manual');

  // مثال لـ Pipeline: حساب الربح لليوم ثم حفظه في ملف
  const steps = [
    {
      nodeId: 'financial-calc-agent-profit',
      params: {
        period: 'this_month'
      }
    },
    {
      nodeId: 'file-write',
      params: {
        filePath: 'financial-report-test.md',
        content: '# تقرير أداء الوكيل\n\n{{prev.data.summary}}\n\nإجمالي الإيرادات: {{prev.data.gross_revenue}} ج.م'
      }
    }
  ];

  try {
    const result = await runPipeline(steps as any, context);
    
    if (result.success) {
      console.log('✅ نجح الاختبار المالي!');
      console.log('📊 ملخص التنفيذ:', result.finalData);
    } else {
      console.error('❌ فشل الاختبار المالي:', result.error);
    }
  } catch (error) {
    console.error('💥 حدث كسر في الاختبار:', error);
  }
}

testFinancialPipeline();
