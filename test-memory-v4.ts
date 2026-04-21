import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { generateEmbedding } from '../src/domains/zoon-os/memory/embeddings';
import { spatialSearch } from '../src/domains/zoon-os/memory/palace-search';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runTest() {
  const testUserId = 'admin-user-id';
  const testContent = 'المستخدم يفضل التقارير المالية مختصرة يوم الخميس';
  
  console.log('⏳ 1. جاري حفظ الذاكرة التجريبية...');
  const embedding = await generateEmbedding('تقارير مالية مختصرة الخميس');
  
  const { error: insertError } = await supabase.from('agent_memory').insert({
    user_id: testUserId,
    content: testContent,
    wing_id: 'ADMIN',
    room_id: 'FINANCE',
    hall_id: 'FACT',
    is_active: true,
    embedding: embedding,
    confidence: 1.0
  });

  if (insertError) {
    console.error('❌ خطأ في الإدخال:', insertError.message);
    return;
  }
  console.log('✅ تم الحفظ بنجاح.');

  console.log('⏳ 2. جاري البحث عن الذاكرة...');
  const searchEmbedding = await generateEmbedding('كم أرباحنا هذا الشهر؟');
  const results = await spatialSearch(
    testUserId,
    searchEmbedding,
    'ADMIN', 
    'FINANCE'
  );

  console.log('🔍 النتيجة المسترجعة:', JSON.stringify(results, null, 2));

  if (results && results.length > 0) {
    const topResult = results[0];
    console.log(`✨ تم العثور على نتيجة! التشابه (Similarity): ${topResult.similarity}`);
    if (topResult.similarity > 0.7) {
      console.log('🚀 الاختبار نجح! المنظومة تعمل بكفاءة عالية.');
    } else {
      console.warn('⚠️ التشابه أقل من 0.7، قد نحتاج لضبط العتبة.');
    }
  } else {
    console.error('❌ الاختبار فشل: لم يتم استرجاع أي نتائج.');
  }
}

runTest().catch(console.error);
