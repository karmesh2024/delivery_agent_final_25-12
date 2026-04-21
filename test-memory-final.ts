import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// إعدادات المتغيرات
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: { parts: [{ text }] },
        output_dimensionality: 768 
      })
    }
  );
  if (!response.ok) throw new Error(`Embedding Failed: ${await response.text()}`);
  const data = await response.json();
  return data.embedding.values;
}

async function runTest() {
  console.log('--- اختبار قصر الذاكرة السيادي (نسخة الاختبار المباشر) ---');
  
  const testUserId = 'admin-user-id';
  const testContent = 'المستخدم يفضل التقارير المالية مختصرة يوم الخميس';
  
  try {
    console.log('⏳ 1. توليد الـ Embedding...');
    const embedding = await generateEmbedding('تقارير مالية مختصرة الخميس');

    console.log('⏳ 2. حفظ الذاكرة في Supabase...');
    const { error: insertError } = await supabase.from('agent_memory').insert({
      user_id: testUserId,
      content: testContent,
      wing_id: 'ADMIN',
      room_id: 'FINANCE',
      hall_id: 'FACT',
      is_active: true,
      embedding: embedding,
      confidence: 1.0,
      memory_type: 'FACT'
    });

    if (insertError) throw insertError;
    console.log('✅ تم الحفظ بنجاح.');

    console.log('⏳ 3. البحث عن الذاكرة (استدعاء RPC)...');
    const searchEmbedding = await generateEmbedding('كم أرباحنا هذا الشهر؟');
    
    const { data: results, error: searchError } = await supabase.rpc('match_memories', {
      query_embedding: searchEmbedding,
      match_threshold: 0.5, // عتبة منخفضة للاختبار
      match_count: 5,
      p_user_id: testUserId,
      p_wing_id: 'ADMIN',
      p_room_id: 'FINANCE'
    });

    if (searchError) throw searchError;

    console.log('🔍 النتيجة:', JSON.stringify(results, null, 2));

    if (results && results.length > 0) {
      console.log(`🚀 الاختبار نـجـح! تم العثور على ${results.length} نتائج.`);
      console.log(`أعلى تشابه: ${results[0].similarity}`);
    } else {
      console.error('❌ الاختبار فشل: لم يتم العثور على نتائج.');
    }
  } catch (err: any) {
    console.error('💥 خطأ كارثي أثناء الاختبار:', err.message || err);
  }
}

runTest();
