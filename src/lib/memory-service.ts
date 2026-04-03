import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * حفظ نتيجة بحث في الذاكرة طويلة الأمد
 */
export async function saveSearchToMemory(query: string, summary: string, category: string = 'general') {
  try {
    const embedding = await generateEmbedding(`${query}: ${summary}`);
    
    const { error } = await supabase.from('search_memories').insert({
      query,
      summary,
      category,
      embedding,
      metadata: { timestamp: new Date().toISOString() }
    });

    if (error) throw error;
    console.log(`🧠 [Memory] Saved memory for: ${query}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Memory] Save error:', error);
    return { success: false };
  }
}

/**
 * البحث في الذاكرة عن معلومات مشابهة
 */
export async function searchLongTermMemory(query: string, category: string = 'general', limit: number = 3) {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // ✅ إذا فشل الـ Embedding — تخطَّ البحث في الذاكرة
    if (!queryEmbedding || queryEmbedding.length === 0 || queryEmbedding.every(v => v === 0)) {
      console.warn('⚠️ [Memory] Embedding failed — skipping memory search limit 3');
      return [];
    }

    const { data, error } = await supabase.rpc('match_search_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      p_category: category // التأكد من إرسال المعامل الرابع
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ [Memory] Search error:', error);
    return [];
  }
}
