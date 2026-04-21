# 🛰️ خارطة الطريق التنفيذية: Zoon OS (إصدار السيادة - أبريل 2026)

هذا المستند يمثل الخلاصة النهائية للتحليل التقني والذكاء الاصطناعي لـ Zoon OS، مع دمج مفاهيم "قصر الذاكرة" المتطورة وتكييفها مع بنية Supabase وNext.js الحالية.

---

## 🔍 أولاً: التقرير التحليلي لبيئة العمل (Live Audit Report)

بناءً على فحص قاعدة البيانات النشطة عبر MCP وكود الـ `MemoryManager`:

1.  **الفجوة الدلالية (Semantic Gap):** جدول `agent_memory` الحالي (بأعمدته: id, user_id, memory_type, content, tags) يفتقر لعمود الـ `embedding`. هذا يعني أن البحث يعتمد على النصوص فقط (Keyword Search) وليس المعنى السياقي.
2.  **الفجوة المكانية (Metadata Gap):** لا توجد معرفات للأجنحة (Wings) أو الغرف (Rooms) في قاعدة البيانات الحالية، مما يمنعنا من تطبيق البحث الموجه الذي يرفع الدقة.
3.  **الفجوة المنطقية (Retrieval Logic):** الدالة `retrieveMemories` تجلب أحدث 10 سجلات بناءً على التاريخ فقط، مما قد يؤدي لجلب بيانات غير ذات صلة بالموضوع الجاري نقاشه.

---

## 🎯 ثانياً: استراتيجية الأولويات (The 11 Pillars Plan)

بناءً على أولوياتك الصارمة، سنتبع هذا الجدول الزمني:

### 🔴 المرحلة الأولى — الأساس العصبي (الأهم والأعجل)
1.  **نظام الذاكرة الهرمية L0→L3**: إعداد الطبقات برمجياً لتوفير الـ Tokens.
2.  **ترقية الجدول (Spatial Metadata)**: إضافة `wing_id`, `hall_id`, `room_id` و `embedding` عبر SQL Migration.
3.  **موجه النية (Memory Intent Router)**: تطوير نموذج Flash لتصنيف السؤال وتوجيه البحث للغرفة الصحيحة.

### 🟠 المرحلة الثانية — العقل القرار (Decision Brain)
4.  **Knowledge Graph مبسط**: تتبع الحقائق (فاعل، فعل، مفعول) لحل التعارضات المعرفية.
5.  **سجل سلسلة التفكير (Reasoning Chain)**: توثيق "لماذا" اتخذ الوكيل هذا القرار.
6.  **صلاحية الحقائق (Fact Expiry)**: إضافة حقول `valid_until` و `is_active` لإهمال المعلومات القديمة.

### 🟡 المرحلة الثالثة — القوة التنفيذية (Executive Power)
7.  **بروتوكول HITL**: التوقف والسؤال عند اكتشاف تناقض منطقي.
8.  **ميزانية المهام (Cost-Aware)**: سقف صارم للعمليات لمنع النزيف المالي.
9.  **دروع الحماية (Injection Guardrails)**: معاملة البيانات الخارجية كـ Untrusted.

---

## 🛠️ ثالثاً: الأكواد المقترحة للتنفيذ الفوري

### 1. SQL Migration (للتنفيذ في Supabase)
```sql
-- تفعيل البحث المتجهي
CREATE EXTENSION IF NOT EXISTS vector;

-- ترقية جدول الذاكرة
ALTER TABLE public.agent_memory 
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS wing_id text,
ADD COLUMN IF NOT EXISTS hall_id text,
ADD COLUMN IF NOT EXISTS room_id text,
ADD COLUMN IF NOT EXISTS valid_from timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS valid_to timestamp with time zone,
ADD COLUMN IF NOT EXISTS thought_chain jsonb;
```

### 2. محرك توجيه النية (The Brain Stem)
```typescript
// src/domains/zoon-os/memory/intent-router.ts
export async function determineMemoryAction(query: string) {
  const prompt = `أنت مصنف نية الذاكرة لـ Zoon OS. حلل السؤال: "${query}" 
  وحدد الغرفة والجناح المناسب للبحث. 
  أخرج JSON: { "action": "SEARCH", "wing": "ADMIN", "room": "FINANCE" }`;
  
  const response = await callGeminiFlash(prompt);
  return JSON.parse(response);
}
```

---

## ✅ رابعاً: معايير النجاح (Success Metrics)
- **السرعة**: استجابة الوكيل في أقل من 2 ثانية رغم وجود الذاكرة.
- **التكلفة**: عدم تجاوز 170 Token في طبقة الإيقاظ (L0 + L1).
- **الدقة**: الوصول للمعلومة الصحيحة بنسبة 95%+ بفضل الهيكلة المكانية.

---
**إعداد وتوثيق:** فريق تطوير Zoon OS الاستراتيجي
**تاريخ المراجعة:** 13-04-2026
**الحالة:** بانتظار إشارة البدء في "ترقية قاعدة البيانات". 🥂🚀🦾
