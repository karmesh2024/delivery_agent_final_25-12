# دليل إعداد Google Gemini API 🤖

هذا الدليل يشرح كيفية الحصول على Gemini API Key مجاناً واستخدامه في المشروع.

---

## ⭐ لماذا Gemini 1.5 Flash؟

### المميزات:
✅ **مجاني تماماً** - 1,500 request/يوم (أنت تحتاج ~45/يوم فقط!)  
✅ **سريع جداً** - استجابة < 2 ثانية  
✅ **عربية ممتازة** - مدرّب على corpus عربي ضخم من Google  
✅ **JSON Mode مدمج** - `responseMimeType: "application/json"`  
✅ **فهم ثقافي** - يفهم السياق المصري/السكندري  
✅ **تحليل نفسي متقدم** - مثالي للمحرك النفسي  

### المقارنة:

| الميزة | Qwen 2.5-7B (HF) | Gemini 1.5 Flash |
|:------|:----------------|:-----------------|
| **السرعة** | 10-30s | <2s ⚡ |
| **العربية** | جيد جداً | ممتاز جداً |
| **JSON** | يدوي | مدمج ✅ |
| **الموثوقية** | متوسط | ممتاز |
| **الحد المجاني** | غير محدود (بطيء) | 1,500/يوم |
| **التحليل النفسي** | 🟡 مقبول | ✅ ممتاز |

---

## 🚀 خطوات الحصول على Gemini API Key

### الخطوة 1: الذهاب إلى Google AI Studio (دقيقة واحدة)

1. افتح المتصفح واذهب إلى: **https://aistudio.google.com/app/apikey**

2. سجل الدخول بحساب Google الخاص بك (Gmail)

---

### الخطوة 2: إنشاء API Key (30 ثانية)

1. ستظهر لك صفحة **"Get API key"**

2. انقر على **"Create API key"**

3. اختر:
   - **Create API key in new project** (إذا كانت أول مرة)
   - أو اختر مشروع موجود

4. انتظر 5 ثوان... سيظهر الـ API Key

5. **انسخ الـ API Key** واحفظه في مكان آمن

**شكل الـ Key:**
```
AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **هام جداً:**
- **لا تشارك الـ API Key مع أحد**
- احفظه في ملف نصي آمن
- ستحتاجه في Pipedream

---

### الخطوة 3: التحقق من الـ API Key (اختياري)

جرّب الـ API Key للتأكد من أنه يعمل:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "مرحباً! اكتب لي منشور قصير عن الإسكندرية"
      }]
    }]
  }'
```

إذا ظهرت استجابة JSON بنص عربي → ✅ الـ Key يعمل!

---

## 📊 الحدود المجانية (Free Tier)

### ما تحصل عليه مجاناً:

| المورد | الحد المجاني |
|:------|:-------------|
| **Requests/Day** | 1,500 request |
| **Requests/Minute** | 15 RPM |
| **Tokens/Minute** | 1 million TPM |
| **Tokens/Day** | 1.5 million TPD |

### هل يكفي للمشروع؟

✅ **نعم بكل تأكيد!**

- أنت تحتاج: ~15 request كل 8 ساعات = **45 request/يوم**
- الحد المجاني: **1,500 request/يوم**
- نسبة الاستخدام: **3% فقط من الحد!**

**يعني:** يمكنك تشغيل النظام **33 مرة يومياً** وما زلت في الحد المجاني! 🎉

---

## 🔐 إضافة الـ API Key في Pipedream

### الخطوات:

1. افتح Pipedream → اذهب إلى **Workflow** الخاص بك

2. انقر على **Settings** (الإعدادات)

3. اختر **Environment Variables**

4. انقر على **Add Environment Variable**

5. املأ:
   - **Key (Name):** `GEMINI_API_KEY`
   - **Value:** الصق الـ API Key الذي نسخته
   - ⚠️ **هام:** الاسم يجب أن يكون بالضبط `GEMINI_API_KEY`

6. انقر على **Save**

---

## 🧪 اختبار Gemini في Pipedream

بعد إضافة الـ API Key، جرّب هذا الكود البسيط:

```javascript
import { axios } from "@pipedream/platform";

export default defineComponent({
  async run({ steps, $ }) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    const response = await axios({
      method: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        contents: [{
          parts: [{
            text: "اكتب منشور قصير (100 حرف) عن محرم بك بالإسكندرية"
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200
        }
      }
    });
    
    const text = response.data.candidates[0].content.parts[0].text;
    console.log("✅ Gemini Response:", text);
    
    return { success: true, text };
  }
});
```

انقر على **Test**

**النتيجة المتوقعة:**
```
✅ Gemini Response: محرم بك... حي عريق في قلب الإسكندرية 🏛️ تاريخ وثقافة وناس أصيلة 💚
```

إذا ظهرت النتيجة → ✅ Gemini جاهز للاستخدام!

---

## 🎯 استخدام JSON Mode (مهم!)

Gemini يدعم JSON Mode رسمياً - هذا يضمن أن الرد دائماً JSON صحيح:

```javascript
const response = await axios({
  method: "POST",
  url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  data: {
    contents: [{
      parts: [{
        text: `اكتب JSON:
        {
          "post": "منشور عن محرم بك",
          "hashtags": ["#محرم_بك", "#الإسكندرية"]
        }`
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json" // ✅ JSON Mode
    }
  }
});

const json = JSON.parse(response.data.candidates[0].content.parts[0].text);
console.log(json.post); // منشور عن محرم بك
```

**الميزة:** لن تحتاج try-catch معقد لـ parsing - Gemini يضمن JSON صحيح!

---

## 🧠 استخدام المحرك النفسي

الكود الرئيسي (`pipedream-workflow-gemini-psychology.js`) يحتوي على Prompts نفسية متقدمة:

```javascript
const psychologicalPrompt = `أنت خبير في علم النفس التسويقي...

تحليل نفسي للجمهور:
- الموقع: محرم بك، الإسكندرية
- الخصائص: طبقة متوسطة، فخورون بحيهم
- المحفزات: الانتماء، الفخر، الأمل

الخبر: ${newsTitle}

المطلوب (JSON):
{
  "psychological_analysis": {
    "sentiment": "positive/negative/neutral",
    "emotions": ["فرح", "أمل"],
    "triggers": ["belonging", "pride"],
    "tone": "celebratory"
  },
  "posts": [...]
}`;
```

Gemini يفهم هذا المستوى من التعقيد ويعطي نتائج دقيقة!

---

## 📈 مراقبة الاستخدام

### طريقة مراقبة عدد الـ Requests:

1. اذهب إلى: https://aistudio.google.com/app/apikey

2. انقر على الـ API Key الخاص بك

3. ستجد **Usage** (الاستخدام):
   - Requests today: X / 1,500
   - Tokens today: X / 1,500,000

### نصائح للحفاظ على الحد المجاني:

✅ **الاستخدام الحالي:** 45 request/يوم (3% فقط)  
✅ **آمن جداً** - بعيد عن الحد بكثير  
⚠️ إذا أردت تشغيل النظام أكثر من 3 مرات/يوم، راقب الاستخدام  

---

## 🔧 استكشاف الأخطاء

### ❌ خطأ: "API key not valid"
**الحل:**
- تأكد من نسخ الـ Key كاملاً (يبدأ بـ `AIzaSy...`)
- تحقق من عدم وجود مسافات في البداية/النهاية
- جرّب إنشاء API Key جديد

### ❌ خطأ: "Quota exceeded"
**الحل:**
- انتظر حتى اليوم التالي (الحد يُعاد يومياً)
- أو قلل عدد مرات التشغيل

### ❌ خطأ: "Invalid JSON response"
**الحل:**
- تأكد من استخدام `responseMimeType: "application/json"`
- راجع الـ Prompt - تأكد من طلب JSON واضح

### ❌ الرد بطيء
**الحل:**
- Gemini Flash عادة سريع (<2s)
- تحقق من سرعة الإنترنت
- قلل `maxOutputTokens` إذا كان الرد طويل جداً

---

## 🆚 مقارنة الأسعار (Free vs Paid)

### Free Tier (ما نستخدمه):
- ✅ 1,500 request/يوم
- ✅ كافي 100% للمشروع
- ✅ بدون بطاقة ائتمان

### Paid Tier (إذا احتجت مستقبلاً):
- 💰 $0.00125 / 1K characters input
- 💰 $0.00375 / 1K characters output
- لكن **لن تحتاجه أبداً** في هذا المشروع!

---

## 🎓 موارد إضافية

### الوثائق الرسمية:
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **Pricing:** https://ai.google.dev/pricing
- **Quickstart:** https://ai.google.dev/gemini-api/docs/quickstart

### دروس مفيدة:
- JSON Mode: https://ai.google.dev/gemini-api/docs/json-mode
- System Instructions: https://ai.google.dev/gemini-api/docs/system-instructions

---

## ✅ جاهز!

الآن لديك Gemini API Key جاهز للاستخدام!

**الخطوات التالية:**
1. ✅ أضف `GEMINI_API_KEY` في Pipedream Environment Variables
2. ✅ تأكد من إنشاء جدول Supabase بالحقول النفسية (راجع `SUPABASE-SCHEMA-PSYCHOLOGY.md`)
3. ✅ انسخ كود `pipedream-workflow-gemini-psychology.js`
4. ✅ اختبر الـ Workflow
5. ✅ Deploy واستمتع بالمحرك النفسي! 🧠

---

**💡 نصيحة أخيرة:**

Gemini 1.5 Flash هو **الخيار الأمثل** للمشروع:
- ✅ مجاني 100%
- ✅ سريع جداً
- ✅ عربية ممتازة
- ✅ تحليل نفسي متقدم
- ✅ موثوق (Google infrastructure)

**لا تتردد في استخدامه!** 🚀
