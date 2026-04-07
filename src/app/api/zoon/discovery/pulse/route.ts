import { NextResponse }      from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { webSearchHandler }  from '@/domains/zoon-os/functions/handlers';
import { executeToolSafely } from '@/domains/zoon-os/execution/tool-executor';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface PulseTopic {
  id?:            string;
  category:       string;
  query:          string;
  label_ar:       string;
  icon:           string;
  interval_hours: number;
}

interface SearchResultItem {
  title:   string;
  url:     string;
  snippet: string;
  source?: string;
}

interface PulseResult {
  category: string;
  status:   'updated' | 'skipped' | 'error';
  count?:   number;
  error?:   string;
  ms?:      number;
}

// ═══════════════════════════════════════════
// المواضيع الافتراضية — fallback إذا لم يوجد pulse_topics
// ═══════════════════════════════════════════

const DEFAULT_TOPICS: PulseTopic[] = [
  { category: 'fuel',        query: 'أسعار الوقود البنزين مصر اليوم',      label_ar: '⛽ أسعار الوقود',  icon: '⛽', interval_hours: 6  },
  { category: 'competitors', query: 'أخبار شركات التوصيل والخدمات مصر',    label_ar: '🏢 المنافسون',     icon: '🏢', interval_hours: 8  },
  { category: 'waste',       query: 'أسعار جمع وإعادة تدوير النفايات مصر', label_ar: '♻️ سوق المخلفات', icon: '♻️', interval_hours: 12 },
  { category: 'logistics',   query: 'تحديثات الطرق والمرور القاهرة',        label_ar: '🚛 اللوجستيات',    icon: '🚛', interval_hours: 6  },
];

// ═══════════════════════════════════════════
// التحقق من الأمان
// ═══════════════════════════════════════════

function isAuthorized(req: Request): boolean {
  // Vercel Cron يضيف هذا الـ Header تلقائياً
  if (req.headers.get('x-vercel-cron') === '1') return true;

  // مفتاح سري للاستدعاء الداخلي (pulse-trigger) والاختبار اليدوي
  const auth   = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  return secret.length > 0 && auth === `Bearer ${secret}`;
}

// ═══════════════════════════════════════════
// جلب المواضيع من قاعدة البيانات
// ═══════════════════════════════════════════

async function getTopics(): Promise<PulseTopic[]> {
  try {
    const { data, error } = await supabase
      .from('pulse_topics')
      .select('*')
      .eq('is_active', true)
      .order('interval_hours', { ascending: true });

    if (error || !data?.length) return DEFAULT_TOPICS;
    return data as PulseTopic[];
  } catch {
    return DEFAULT_TOPICS;
  }
}

// ═══════════════════════════════════════════
// فحص هل يحتاج الموضوع تحديثاً
// ═══════════════════════════════════════════

async function shouldUpdate(
  category:      string,
  intervalHours: number
): Promise<boolean> {
  const { data } = await supabase
    .from('discovery_feed')
    .select('created_at')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return true;

  const hoursSince =
    (Date.now() - (new Date(data.created_at as string)).getTime()) / (1000 * 60 * 60);

  return hoursSince >= intervalHours;
}

// ═══════════════════════════════════════════
// كاشف مستوى الأهمية
// ═══════════════════════════════════════════

function detectImportance(text: string): 'normal' | 'high' | 'critical' {
  const critical = ['عاجل', 'طوارئ', 'أزمة', 'انهيار', 'إغلاق', 'حظر'];
  const high     = ['ارتفاع حاد', 'انخفاض كبير', 'قرار جديد', 'تغيير', 'إطلاق'];

  if (critical.some(w => text.includes(w))) return 'critical';
  if (high.some(w => text.includes(w)))     return 'high';
  return 'normal';
}

// ═══════════════════════════════════════════
// معالجة موضوع واحد
// ═══════════════════════════════════════════

async function processTopic(
  topic:    PulseTopic
): Promise<PulseResult> {
  const start = Date.now();

  const needsUpdate = await shouldUpdate(
    topic.category, topic.interval_hours
  );

  if (!needsUpdate) {
    return { category: topic.category, status: 'skipped' };
  }

  try {
    const searchResult = await executeToolSafely(
      'web_search',
      () => webSearchHandler({ query: topic.query, limit: 7 }),
      { timeoutMs: 15_000 }
    );

    // الهاندلر يرجع بياناته في .data والنتائج عادة في .data.results أو .data
    const rawResults = (searchResult?.data as any)?.results ?? (searchResult?.data as any) ?? [];
    const results: SearchResultItem[] = Array.isArray(rawResults) ? rawResults : [];

    if (results.length === 0) {
      return { category: topic.category, status: 'skipped' };
    }

    const fullText   = results.map(r => `${r.title} ${r.snippet}`).join(' ');
    const importance = detectImportance(fullText);

    const { error } = await supabase.from('discovery_feed').insert({
      title:      topic.label_ar,
      category:   topic.category,
      query:      topic.query,
      content:    results.slice(0, 5),
      importance,
      is_read:    false,
      created_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    return {
      category: topic.category,
      status:   'updated',
      count:    results.length,
      ms:       Date.now() - start,
    };

  } catch (err) {
    console.error(`[Pulse] Error processing topic ${topic.category}:`, err);
    return {
      category: topic.category,
      status:   'error',
      error:    String(err),
    };
  }
}

// ═══════════════════════════════════════════
// Handler الرئيسي — POST
// ═══════════════════════════════════════════

export async function POST(req: Request) {

  if (!isAuthorized(req)) {
    console.warn('[Pulse] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log(`[Pulse] Starting at ${new Date().toISOString()}`);

  try {
    const topics = await getTopics();

    // معالجة المواضيع بالتوالي لتفادي استهلاك موارد الـ Web-Search بسرعة كبيرة
    const summary: PulseResult[] = [];
    for (const topic of topics) {
        const result = await processTopic(topic);
        summary.push(result);
    }

    const stats = {
      total:   summary.length,
      updated: summary.filter(r => r.status === 'updated').length,
      skipped: summary.filter(r => r.status === 'skipped').length,
      errors:  summary.filter(r => r.status === 'error').length,
      ms:      Date.now() - startTime,
    };

    console.log(`[Pulse] Done in ${stats.ms}ms:`, stats);

    return NextResponse.json({
      success:   true,
      timestamp: new Date().toISOString(),
      stats,
      results:   summary,
    });

  } catch (err) {
    console.error('[Pulse] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

// منع الـ GET
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
