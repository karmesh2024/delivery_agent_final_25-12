# 🏛️ دليل التنفيذ النهائي (v4.0): قصر ذاكرة زوون السيادي

هذا الدليل هو "النسخة المعتمدة" للإنتاج، بعد معالجة ثغرات الأداء والأمان والمنطق.

---

## 🔴 اليوم 1: التأسيس العميق (Production SQL)

يتم تنفيذ الاستعلام التالي في Supabase SQL Editor لتهيئة البنية التحتية:

```sql
-- 1. تفعيل محرك المتجهات
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. إنشاء/تحديث الأعمدة (إصدار الأمان)
ALTER TABLE public.agent_memory 
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS wing_id text,
ADD COLUMN IF NOT EXISTS hall_id text,
ADD COLUMN IF NOT EXISTS room_id text,
ADD COLUMN IF NOT EXISTS valid_from timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_to timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS confidence float DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS thought_chain jsonb;

-- 3. إنشاء الفهرس (Index) لسرعة بحث خارقة
CREATE INDEX IF NOT EXISTS msg_memory_embedding_idx ON public.agent_memory 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. دالة البحث الاحترافية (RPC)
CREATE OR REPLACE FUNCTION match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id text,
  p_wing_id text DEFAULT NULL,
  p_room_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM agent_memory m
  WHERE m.is_active = true
    AND m.user_id = p_user_id
    AND (p_wing_id IS NULL OR m.wing_id = p_wing_id)
    AND (p_room_id IS NULL OR m.room_id = p_room_id)
    AND (m.valid_to IS NULL OR m.valid_to > now())
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🟠 اليوم 2: محرك النية والإيقاظ (Wake-up & Router)

### 1. الإيقاظ الهجين (Hybrid Router)
```typescript
const KEYWORD_MAP: Record<string, { wing: string; room: string }> = {
  'أرباح': { wing: 'ADMIN', room: 'FINANCE' },
  'مخزن': { wing: 'WAREHOUSE', room: 'INVENTORY' },
  'قرار': { wing: 'ADMIN', room: 'STRATEGY' }
};

export async function getTargetContext(query: string) {
  // الكلمات المفتاحية أولاً لتوفير الوقت
  for (const [key, mapping] of Object.entries(KEYWORD_MAP)) {
    if (query.includes(key)) return mapping;
  }
  // إذا لم نجد، نستدعي Gemini Flash كـ Fallback
  return await callGeminiRouter(query);
}
```

### 2. خدمة الإيقاظ (Wake-up Context)
```typescript
import { supabase } from '@/lib/supabase';

export async function constructWakeUpContext(userId: string) {
  const { data: facts } = await supabase
    .from('agent_memory')
    .select('content')
    .eq('user_id', userId)
    .eq('hall_id', 'FACT')
    .eq('is_active', true)
    .limit(5);

  return facts ? facts.map(f => f.content).join(' | ') : "";
}
```

---

## 🟡 اليوم 3: البحث الموجه (Directed Search)

```typescript
export async function spatialSearch(userId: string, vector: number[], wing?: string, room?: string) {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: vector,
    match_threshold: 0.7,
    match_count: 5,
    p_user_id: userId,
    p_wing_id: wing || null,
    p_room_id: room || null
  });

  if (error) throw error;
  return data;
}
```

---

## 🟢 اليوم 4: الحفظ التلقائي (The Heartbeat - AutoSave)

يتم استدعاء هذه الوظيفة في نهاية كل معالجة محادثة لضمان التعلم المستمر.

```typescript
export async function autoSaveInsights(userId: string, summary: string, intent: any) {
  const embedding = await generateEmbedding(summary); // استدعاء Text Embedding API
  
  await supabase.from('agent_memory').insert({
    user_id: userId,
    content: summary,
    embedding,
    wing_id: intent.wing,
    room_id: intent.room,
    hall_id: 'FACT',
    is_active: true,
    confidence: 1.0
  });
}
```

---
**التدقيق الهندسي متم:** جاهز للتنفيذ الفوري.
