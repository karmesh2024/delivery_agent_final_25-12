# Supabase Database Schema - Psychology Edition 🧠

هذا المستند يشرح كيفية إنشاء جدول Supabase مع الحقول النفسية الإضافية للمحرك النفسي.

---

## 📋 الجدول الكامل مع الحقول النفسية

### اسم الجدول: `posts`

| Column Name | Type | Default | Nullable | Description |
|:-----------|:-----|:--------|:---------|:------------|
| **الحقول الأساسية** |
| `id` | `int8` | Auto-increment | ❌ No | Primary Key |
| `created_at` | `timestamptz` | `now()` | ❌ No | تاريخ الإنشاء |
| `title` | `text` | - | ❌ No | عنوان الخبر |
| `post_text` | `text` | - | ❌ No | نص المنشور |
| `style` | `text` | - | ❌ No | Formal/Casual/Interactive |
| `status` | `text` | `'draft'` | ❌ No | draft/ready/posted |
| `image_url` | `text` | - | ✅ Yes | رابط الصورة (base64 or URL) |
| `source_link` | `text` | - | ✅ Yes | رابط الخبر الأصلي |
| `hashtags` | `text` | - | ✅ Yes | الوسوم |
| **الحقول النفسية (Psychological Metadata)** 🧠 |
| `sentiment` | `text` | - | ✅ Yes | positive/negative/neutral |
| `emotions` | `text` | - | ✅ Yes | المشاعر (فرح، أمل، قلق، إلخ) |
| `psychological_triggers` | `text` | - | ✅ Yes | belonging, pride, hope, safety |
| `emotional_tone` | `text` | - | ✅ Yes | celebratory/empathetic/motivational |
| `target_feeling` | `text` | - | ✅ Yes | الشعور المستهدف في الجمهور |
| `psychological_note` | `text` | - | ✅ Yes | ملاحظة عن الاختيار النفسي |

---

## 🛠️ طريقة الإنشاء

### الطريقة 1: عبر واجهة Supabase (UI)

1. اذهب إلى **Table Editor** في Supabase
2. انقر على **Create a new table**
3. اسم الجدول: `posts`
4. ✅ فعّل **Enable Row Level Security (RLS)**
5. أضف الأعمدة واحداً تلو الآخر من الجدول أعلاه

**ملاحظة:** الحقول النفسية كلها `text` و `nullable = true` (اختيارية)

---

### الطريقة 2: عبر SQL (أسرع) ⚡

افتح **SQL Editor** والصق الكود التالي:

```sql
-- ═══════════════════════════════════════════════════════════════════
-- إنشاء جدول posts مع الحقول النفسية
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.posts (
  -- الحقول الأساسية
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  post_text TEXT NOT NULL,
  style TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  image_url TEXT,
  source_link TEXT,
  hashtags TEXT,
  
  -- الحقول النفسية (Psychological Metadata) 🧠
  sentiment TEXT,
  emotions TEXT,
  psychological_triggers TEXT,
  emotional_tone TEXT,
  target_feeling TEXT,
  psychological_note TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- إضافة تعليقات توضيحية للأعمدة
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON COLUMN public.posts.sentiment IS 'positive, negative, or neutral';
COMMENT ON COLUMN public.posts.emotions IS 'المشاعر المكتشفة: فرح، أمل، فخر، قلق، إلخ';
COMMENT ON COLUMN public.posts.psychological_triggers IS 'belonging, pride, hope, safety, curiosity, etc';
COMMENT ON COLUMN public.posts.emotional_tone IS 'celebratory, empathetic, motivational, informational, urgent';
COMMENT ON COLUMN public.posts.target_feeling IS 'الشعور المستهدف عند الجمهور';
COMMENT ON COLUMN public.posts.psychological_note IS 'سبب اختيار هذا الأسلوب نفسياً';

-- ═══════════════════════════════════════════════════════════════════
-- إنشاء فهرس للبحث السريع حسب sentiment
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON public.posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع
CREATE POLICY "Enable read access for all users" ON public.posts
  FOR SELECT USING (true);

-- السماح بالكتابة للجميع (للتطوير)
CREATE POLICY "Enable insert for all users" ON public.posts
  FOR INSERT WITH CHECK (true);

-- السماح بالتحديث للجميع
CREATE POLICY "Enable update for all users" ON public.posts
  FOR UPDATE USING (true);

-- السماح بالحذف للجميع
CREATE POLICY "Enable delete for all users" ON public.posts
  FOR DELETE USING (true);
```

انقر على **Run** ✅

---

## 📊 مثال على البيانات

بعد تشغيل الـ Workflow، ستحصل على بيانات مثل:

| id | title | post_text | sentiment | emotions | psychological_triggers | emotional_tone |
|:---|:------|:----------|:----------|:---------|:---------------------|:--------------|
| 1 | افتتاح مستشفى... | 🏥 أخيراً! مستشفى... | positive | فرح, أمل, فخر | belonging, pride, hope | celebratory |
| 2 | حادثة مرورية... | ⚠️ للأسف حصل حادث... | negative | قلق, تعاطف | safety, empathy | empathetic |
| 3 | قرار حكومي... | 📋 صدر قرار جديد... | neutral | اهتمام | curiosity | informational |

---

## 🔍 استعلامات SQL مفيدة

### 1. عرض المنشورات الإيجابية فقط:
```sql
SELECT * FROM posts 
WHERE sentiment = 'positive'
ORDER BY created_at DESC;
```

### 2. عد المنشورات حسب المشاعر:
```sql
SELECT 
  sentiment,
  COUNT(*) as count
FROM posts
GROUP BY sentiment;
```

### 3. المنشورات التي تستهدف الانتماء والفخر:
```sql
SELECT * FROM posts
WHERE psychological_triggers LIKE '%belonging%'
   OR psychological_triggers LIKE '%pride%'
ORDER BY created_at DESC;
```

### 4. تحليل نفسي شامل (آخر 7 أيام):
```sql
SELECT 
  sentiment,
  COUNT(*) as posts_count,
  STRING_AGG(DISTINCT emotions, ', ') as all_emotions,
  STRING_AGG(DISTINCT psychological_triggers, ', ') as all_triggers
FROM posts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY sentiment;
```

### 5. المنشورات الأكثر تفاعلاً نفسياً (احتفالية):
```sql
SELECT 
  post_text,
  emotions,
  psychological_triggers
FROM posts
WHERE emotional_tone = 'celebratory'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📈 استخدام البيانات النفسية

### في لوحة تحكم (Dashboard):

```javascript
// مثال: عرض توزيع المشاعر
const sentimentData = await supabase
  .from('posts')
  .select('sentiment')
  .then(({ data }) => {
    const counts = {
      positive: data.filter(p => p.sentiment === 'positive').length,
      negative: data.filter(p => p.sentiment === 'negative').length,
      neutral: data.filter(p => p.sentiment === 'neutral').length
    };
    return counts;
  });

// عرض في Chart
Chart.js({ 
  type: 'pie',
  data: sentimentData 
});
```

### في تطبيق موبايل:

```dart
// Flutter example
final response = await supabase
  .from('posts')
  .select()
  .eq('sentiment', 'positive')
  .order('created_at', ascending: false)
  .limit(20);

// عرض المنشورات الإيجابية فقط
```

---

## 🎨 تصدير البيانات

### CSV Export:
1. اذهب إلى **Table Editor**
2. انقر على جدول `posts`
3. انقر على `...` → **Download as CSV**
4. افتح في Excel/Google Sheets

### الأعمدة المفيدة للتحليل:
- `sentiment` → لعمل Pie Chart
- `emotions` → لفهم المشاعر السائدة
- `psychological_triggers` → لمعرفة المحفزات الناجحة
- `emotional_tone` → لتحليل الأساليب الأكثر استخداماً

---

## 🔄 تحديث الجدول القديم (Migration)

إذا كان لديك جدول `posts` قديم بدون الحقول النفسية:

```sql
-- إضافة الحقول النفسية للجدول الموجود
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS emotions TEXT,
  ADD COLUMN IF NOT EXISTS psychological_triggers TEXT,
  ADD COLUMN IF NOT EXISTS emotional_tone TEXT,
  ADD COLUMN IF NOT EXISTS target_feeling TEXT,
  ADD COLUMN IF NOT EXISTS psychological_note TEXT;

-- إضافة فهرس
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON public.posts(sentiment);
```

---

## ✅ التحقق من الإنشاء الصحيح

بعد إنشاء الجدول، جرّب هذا الاستعلام:

```sql
-- إدراج منشور تجريبي مع بيانات نفسية
INSERT INTO posts (
  title, 
  post_text, 
  style, 
  status, 
  hashtags,
  sentiment,
  emotions,
  psychological_triggers,
  emotional_tone,
  target_feeling,
  psychological_note
) VALUES (
  'خبر تجريبي',
  '🎉 هذا منشور تجريبي لاختبار المحرك النفسي!',
  'Casual',
  'draft',
  '#محرم_بك #اختبار',
  'positive',
  'فرح, حماس',
  'belonging, pride',
  'celebratory',
  'الشعور بالانتماء والفخر',
  'أسلوب احتفالي لجذب الانتباه'
);

-- قراءة البيانات للتأكد
SELECT * FROM posts ORDER BY created_at DESC LIMIT 1;
```

إذا ظهرت النتائج بنجاح → ✅ الجدول جاهز!

---

## 🚀 جاهز!

الآن جدول Supabase جاهز لاستقبال المنشورات مع **التحليل النفسي الكامل**! 🧠

**الخطوة التالية:**  
ارجع إلى `GEMINI-SETUP.md` لإكمال الإعداد.
