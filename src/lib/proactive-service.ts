import { createClient } from '@supabase/supabase-js';
import { webSearchHandler, deepResearchHandler } from '../domains/zoon-os/functions/handlers/search-handlers';
import { searchLongTermMemory } from './memory-service';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/**
 * المحرك الاستباقي: يقوم بتحليل الاهتمامات وتوليد أخبار ذكية
 */
export async function runProactiveDiscovery() {
  try {
    console.log('🚀 [Discovery] Starting proactive pulse...');

    // 1. تحديد المواضيع المهمة (يمكن تطوير هذا ليكون ديناميكياً من اهتمامات المستخدم)
    const topics = [
      { q: 'أسعار وقود التوصيل اليوم في مصر', cat: 'financial' },
      { q: 'أخبار منافسي شركات الشحن والتوصيل', cat: 'business' },
      { q: 'تحديثات المرور والطرق الكبرى في القاهرة', cat: 'logistics' }
    ];

    for (const topic of topics) {
      // 2. البحث عن تشابه في الذاكرة لنعرف "ماذا نعرف مسبقاً"
      const pastMemories = await searchLongTermMemory(topic.q, topic.cat, 1);
      
      // 3. إجراء بحث سريع لمعرفة "الجديد"
      const currentSearch = await webSearchHandler({ query: topic.q, category: topic.cat, maxResults: 3 });
      
      if (!currentSearch.success) continue;

      // 4. توليد خلاصة "ذكية" تقارن بين الماضي والحاضر (عبر Deep Research)
      // ملاحظة: هنا نستخدم deepResearch ليقوم بالتحليل نيابة عنا
      const analysis = await deepResearchHandler({ 
        query: `قارن بين الحالة الحالية لـ ${topic.q} وما قد نعرفه سابقاً. استخرج فقط التغييرات الجوهرية التي تهم وكيل التوصيل.`,
        category: topic.cat
      });

      if (analysis.success && analysis.data) {
        // 5. حفظ النتيجة في الـ Discovery Feed
        const analysisData = analysis.data as any;
        await supabase.from('discovery_feed').insert({
          title: `تحديث ذكي: ${topic.q}`,
          content: analysisData.summary || 'لم يتم استخراج خلاصة واضحة.',
          category: topic.cat,
          metadata: { source: 'proactive_engine', original_query: topic.q }
        });
        console.log(`✅ [Discovery] Generated insight for: ${topic.q}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [Discovery] Pulse Error:', error);
    return { success: false };
  }
}
