# DuckDuckGo في Next.js: الصور + الأخبار 🦆📰🖼️
# بدون API Key - مجاني 100% - بديل كامل لـ Google News RSS

---

## 🎯 الإجابة المختصرة

### **نعم، يمكنك جلب الصور + الأخبار من DuckDuckGo في Next.js!**

| السؤال | الصور 🖼️ | الأخبار 📰 |
|---------|---------|----------|
| **هل يحتاج API Key؟** | ❌ **لا** - مجاني 100% | ❌ **لا** - مجاني 100% |
| **هل يعمل في Next.js؟** | ✅ **نعم** | ✅ **نعم** |
| **كم عدد الطلبات؟** | ♾️ **غير محدود** | ♾️ **غير محدود** |
| **سرعة الاستجابة** | ⚡ 1-3 ثوانٍ | ⚡ 1-3 ثوانٍ |
| **الجودة** | ✅ عالية (HD) | ✅ من مصادر موثوقة |
| **التكلفة** | **$0/شهر** | **$0/شهر** |
| **بديل لـ** | Pixabay/Unsplash | **Google News RSS** ✨ |

---

## 📦 الحلول المتاحة

### ✅ الحل الموصى به: `duck-duck-scrape` (يدعم الصور + الأخبار)

#### لماذا `duck-duck-scrape` أفضل؟

| المعيار | `duck-duck-scrape` ⭐⭐⭐⭐⭐ | `duckduckgo-images-api` | `@phukon/duckduckgo-search` |
|---------|--------------------------|------------------------|---------------------------|
| **يدعم الأخبار** | ✅ **نعم** | ❌ لا | ✅ نعم (Python فقط) |
| **يدعم الصور** | ✅ نعم | ✅ نعم | ✅ نعم |
| **JavaScript/Node.js** | ✅ نعم | ✅ نعم | ⚠️ Python wrapper |
| **آخر تحديث** | ✅ 2026 | ⚠️ 2023 | ✅ 2025 |
| **Documentation** | ✅✅ ممتاز | ✅ جيد | ⚠️ محدود |
| **TypeScript** | ✅ نعم | ❌ لا | ⚠️ جزئي |

---

## 📦 الحل الشامل: `duck-duck-scrape`

### الخطوة 1: التنصيب

```bash
npm install duck-duck-scrape
# أو
yarn add duck-duck-scrape
# أو
pnpm add duck-duck-scrape
```

### الخطوة 1: التنصيب

```bash
npm install duckduckgo-images-api
# أو
yarn add duckduckgo-images-api
# أو
pnpm add duckduckgo-images-api
```

### الخطوة 2: الكود الأساسي - جلب الأخبار 📰

```javascript
// ========================================
// FILE: app/api/search-news/route.js
// Next.js 14+ API Route - DuckDuckGo News
// ========================================

import { searchNews } from 'duck-duck-scrape';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'الإسكندرية';
    const limit = parseInt(searchParams.get('limit') || '20');
    const region = searchParams.get('region') || 'eg-ar'; // مصر-عربي

    console.log(`📰 البحث عن أخبار: ${query}`);

    // البحث في DuckDuckGo News
    const newsResults = await searchNews(query, {
      safeSearch: 'moderate',
      time: 'd',      // d=يوم, w=أسبوع, m=شهر
      region: region,  // eg-ar = مصر بالعربي
      locale: 'ar'
    });

    // تنظيف وتنسيق النتائج
    const news = newsResults.results
      .slice(0, limit)
      .map(article => ({
        title: article.title,
        url: article.url,
        description: article.description || article.excerpt || '',
        source: article.source,
        image: article.image,
        date: article.date,
        relativeTime: article.relativeTime  // "منذ 3 ساعات"
      }));

    console.log(`✅ تم جلب ${news.length} خبر`);

    return Response.json({
      success: true,
      query: query,
      count: news.length,
      news: news
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأخبار:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### الخطوة 3: الكود الأساسي - جلب الصور 🖼️

```javascript
// ========================================
// FILE: app/api/search-images/route.js
// Next.js 14+ API Route - DuckDuckGo Images
// ========================================

import { searchImages } from 'duck-duck-scrape';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'alexandria egypt';
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log(`🖼️ البحث عن صور: ${query}`);

    // البحث في DuckDuckGo Images
    const imageResults = await searchImages(query, {
      safeSearch: 'moderate',
      size: 'large',        // small, medium, large, wallpaper
      color: null,          // red, orange, yellow, green, blue, etc.
      type: 'photo',        // photo, clipart, gif, transparent, line
      layout: 'wide',       // square, tall, wide
      license: null         // any, public, share, modify, commercial
    });

    // تنظيف النتائج
    const images = imageResults.results
      .slice(0, limit)
      .filter(img => img.image && img.thumbnail)
      .map(img => ({
        title: img.title || 'Untitled',
        image: img.image,
        thumbnail: img.thumbnail,
        url: img.url,
        height: img.height,
        width: img.width,
        source: img.source
      }));

    console.log(`✅ تم جلب ${images.length} صورة`);

    return Response.json({
      success: true,
      query: query,
      count: images.length,
      images: images
    });

  } catch (error) {
    console.error('❌ خطأ في البحث:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### الخطوة 4: API موحد - الصور + الأخبار معاً 🎯

```javascript
// ========================================
// FILE: app/api/search/route.js
// API موحد للصور والأخبار
// ========================================

import { searchNews, searchImages } from 'duck-duck-scrape';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'both'; // news, images, both
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return Response.json({
        success: false,
        error: 'Query parameter "q" is required'
      }, { status: 400 });
    }

    const results = {};

    // جلب الأخبار
    if (type === 'news' || type === 'both') {
      const newsResults = await searchNews(query, {
        safeSearch: 'moderate',
        time: 'd',
        region: 'eg-ar'
      });
      
      results.news = newsResults.results
        .slice(0, limit)
        .map(article => ({
          title: article.title,
          url: article.url,
          description: article.description || '',
          source: article.source,
          image: article.image,
          date: article.date
        }));
    }

    // جلب الصور
    if (type === 'images' || type === 'both') {
      const imageResults = await searchImages(query, {
        safeSearch: 'moderate'
      });
      
      results.images = imageResults.results
        .slice(0, limit)
        .filter(img => img.image)
        .map(img => ({
          image: img.image,
          thumbnail: img.thumbnail,
          title: img.title
        }));
    }

    return Response.json({
      success: true,
      query: query,
      ...results
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## 🎨 التطبيق الكامل في Next.js

### البنية (Structure)

```
my-app/
├── app/
│   ├── api/
│   │   └── search-images/
│   │       └── route.js          ← API Route للبحث
│   ├── components/
│   │   └── ImageSearch.jsx       ← مكون البحث
│   └── page.jsx                  ← الصفحة الرئيسية
├── package.json
└── next.config.js
```

---

### 1️⃣ **API Route** (Backend)

```javascript
// ========================================
// FILE: app/api/search-images/route.js
// ========================================

import { search } from 'duckduckgo-images-api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');
  const safeSearch = searchParams.get('safe') !== 'false';

  if (!query) {
    return Response.json({
      success: false,
      error: 'Query parameter "q" is required'
    }, { status: 400 });
  }

  try {
    console.log(`🔍 البحث عن: ${query}`);

    const results = await search({
      query: query,
      moderate: safeSearch,
      iterations: Math.ceil(limit / 100), // كل iteration يعطي ~100 صورة
      retries: 3
    });

    // تصفية وتنظيف النتائج
    const cleanImages = results
      .slice(0, limit)
      .filter(img => img.image && img.thumbnail) // فقط الصور الكاملة
      .map(img => ({
        title: img.title || 'Untitled',
        image: img.image,
        thumbnail: img.thumbnail,
        url: img.url,
        height: img.height,
        width: img.width,
        source: img.source
      }));

    console.log(`✅ تم جلب ${cleanImages.length} صورة`);

    return Response.json({
      success: true,
      query: query,
      count: cleanImages.length,
      images: cleanImages
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

### 2️⃣ **React Component** (Frontend)

```jsx
// ========================================
// FILE: app/components/ImageSearch.jsx
// ========================================

'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchImages = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('الرجاء إدخال كلمة بحث');
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const response = await fetch(
        `/api/search-images?q=${encodeURIComponent(query)}&limit=20`
      );
      
      const data = await response.json();

      if (data.success) {
        setImages(data.images);
      } else {
        setError(data.error || 'حدث خطأ في البحث');
      }

    } catch (err) {
      setError('فشل الاتصال بالخادم');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* شريط البحث */}
      <form onSubmit={searchImages} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صور... (مثل: الإسكندرية، محرم بك)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '⏳ جاري البحث...' : '🔍 بحث'}
          </button>
        </div>
      </form>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* النتائج */}
      {images.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            النتائج: {images.length} صورة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group cursor-pointer">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={img.thumbnail}
                    alt={img.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {img.title}
                </p>
                <a
                  href={img.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  عرض بالحجم الكامل
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* حالة فارغة */}
      {!loading && images.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">
          <p className="text-xl">ابحث عن صور باستخدام DuckDuckGo 🦆</p>
          <p className="mt-2">مجاني 100% - بدون حدود</p>
        </div>
      )}
    </div>
  );
}
```

---

### 3️⃣ **الصفحة الرئيسية**

```jsx
// ========================================
// FILE: app/page.jsx
// ========================================

import ImageSearch from './components/ImageSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          🦆 DuckDuckGo Image Search
        </h1>
        <p className="text-gray-600 mt-2">
          ابحث عن ملايين الصور مجاناً - بدون API Key
        </p>
      </div>
      
      <ImageSearch />
    </main>
  );
}
```

---

## 🚀 التطبيق المتقدم: دمج مع Zoon Club

### سيناريو: اختيار صورة تلقائياً للمحتوى

```javascript
// ========================================
// FILE: lib/zoonImageSelector.js
// ========================================

import { search } from 'duckduckgo-images-api';

export class ZoonImageSelector {
  /**
   * اختيار صورة مناسبة للمحتوى
   */
  async selectImageForContent(arabicContent, psychology) {
    // استخراج الكلمات المفتاحية
    const keywords = this.extractKeywords(arabicContent);
    
    // إضافة سياق محلي
    const query = `${keywords} alexandria egypt`;
    
    console.log(`🔍 البحث عن صورة: ${query}`);

    try {
      const results = await search({
        query: query,
        moderate: true,
        iterations: 1
      });

      if (results.length === 0) {
        console.log('⚠️ لا توجد نتائج، استخدام Fallback');
        return this.getFallbackImage();
      }

      // اختيار الصورة الأفضل (أول نتيجة عادة الأفضل)
      const bestImage = results[0];

      return {
        url: bestImage.image,
        thumbnail: bestImage.thumbnail,
        title: bestImage.title,
        source: 'DuckDuckGo',
        width: bestImage.width,
        height: bestImage.height
      };

    } catch (error) {
      console.error('❌ خطأ في جلب الصورة:', error);
      return this.getFallbackImage();
    }
  }

  /**
   * استخراج كلمات مفتاحية من النص العربي
   */
  extractKeywords(arabicText) {
    const translationMap = {
      'محرم بك': 'moharram bek',
      'الإسكندرية': 'alexandria',
      'البحر': 'sea beach',
      'الكوبري': 'bridge',
      'الترام': 'tram',
      'النظافة': 'clean street',
      'التطوير': 'development',
      'الميدان': 'square plaza',
      'المباني': 'buildings',
      'الناس': 'people community'
    };

    for (const [arabic, english] of Object.entries(translationMap)) {
      if (arabicText.includes(arabic)) {
        return english;
      }
    }

    return 'alexandria egypt city';
  }

  /**
   * صورة احتياطية (Fallback)
   */
  getFallbackImage() {
    return {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
      title: 'Alexandria, Egypt',
      source: 'Fallback',
      width: 1200,
      height: 800
    };
  }
}
```

### استخدام في Zoon Agent System

```javascript
// في zoon-agent-system-gemini-2.5.js

import { ZoonImageSelector } from './lib/zoonImageSelector';

class ZoonAgentSystemWithImages {
  constructor(config) {
    super(config);
    this.imageSelector = new ZoonImageSelector();
  }

  async execute() {
    // ... الخطوات السابقة (جلب الأخبار، التحليل النفسي، توليد المحتوى)

    // اختيار الصورة تلقائياً
    const selectedImage = await this.imageSelector.selectImageForContent(
      this.selectedNews,
      this.psychology
    );

    console.log('✅ تم اختيار الصورة:', selectedImage.title);

    // حفظ في Supabase
    await this.saveToSupabase({
      news: this.selectedNews,
      posts: this.generatedPosts,
      image_url: selectedImage.url,
      image_thumbnail: selectedImage.thumbnail,
      image_source: selectedImage.source,
      psychology: this.psychology
    });
  }
}
```

---

## ⚡ الأداء والتحسينات

### 1️⃣ **Caching (التخزين المؤقت)**

```javascript
// استخدام Next.js Cache
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Cache لمدة ساعة واحدة
  const cacheKey = `duckduckgo-images:${query}`;
  
  // تحقق من الـ cache (مثلاً: Redis, Vercel KV)
  const cached = await getCachedImages(cacheKey);
  if (cached) {
    console.log('📦 نتيجة من الـ Cache');
    return Response.json(cached);
  }

  // إذا لم يوجد، جلب من DuckDuckGo
  const results = await search({ query });
  
  // حفظ في الـ cache
  await cacheImages(cacheKey, results, 3600); // 1 hour

  return Response.json(results);
}
```

### 2️⃣ **Rate Limiting (تحديد المعدل)**

```javascript
// منع الاستخدام المفرط
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 طلبات/10 ثوانٍ
});

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({
      error: 'Too many requests'
    }, { status: 429 });
  }

  // ... بقية الكود
}
```

### 3️⃣ **Image Optimization (تحسين الصور)**

```javascript
// استخدام Next.js Image Optimization
<Image
  src={img.thumbnail}
  alt={img.title}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // صورة ضبابية صغيرة
  loading="lazy" // Lazy loading
/>
```

---

## 📊 المقارنة: DuckDuckGo vs Pixabay vs Unsplash

| المعيار | DuckDuckGo ⭐⭐⭐⭐ | Pixabay ⭐⭐⭐⭐⭐ | Unsplash ⭐⭐⭐ |
|---------|------------------|------------------|---------------|
| **API Key** | ❌ غير مطلوب | ✅ مطلوب (مجاني) | ✅ مطلوب (مجاني) |
| **عدد الطلبات** | ♾️ غير محدود | 6,000/ساعة | 50/ساعة |
| **عدد الصور** | ♾️ ملايين | 5.6+ مليون | 4+ مليون |
| **جودة الصور** | ✅ جيدة-عالية | ✅✅ عالية جداً | ✅✅✅ احترافية |
| **صور محلية (مصر)** | ✅✅ جيدة | ✅✅ جيدة | ⚠️ محدودة |
| **Attribution** | ⚠️ يفضل | ⚠️ مستحب | ✅ إجباري |
| **سرعة** | ⚡⚡ 1-3 ثوانٍ | ⚡⚡⚡ <1 ثانية | ⚡⚡ 2-4 ثوانٍ |
| **Filters** | ⚠️ محدودة | ✅✅ متقدمة | ✅ جيدة |
| **التوصية** | **للبساطة** | **للإنتاج** | للفن |

---

## 🎯 التوصية النهائية

### **متى تستخدم DuckDuckGo Images؟**

✅ **استخدمه إذا:**
- تريد **بدون API Key** (zero setup)
- تريد **unlimited requests** (عملياً)
- تريد **بساطة شديدة**
- تريد **تنوع كبير** في النتائج

⚠️ **لا تستخدمه إذا:**
- تريد **فلاتر متقدمة** (لون، اتجاه، نوع)
- تريد **صور عالية الجودة فقط**
- تريد **API رسمي** بـ SLA

### **التوصية لـ Zoon Club:**

استخدم **Pixabay API** للإنتاج + **DuckDuckGo** كـ Fallback:

```javascript
async selectImage(query) {
  try {
    // 1. حاول Pixabay أولاً (جودة أعلى)
    return await this.pixabay.search(query);
  } catch (error) {
    console.log('⚠️ Pixabay فشل، استخدام DuckDuckGo');
    // 2. استخدم DuckDuckGo كـ Fallback
    return await this.duckduckgo.search(query);
  }
}
```

---

## 📦 الكود الكامل الجاهز

### ملف `package.json`

```json
{
  "name": "zoon-image-search",
  "version": "1.0.0",
  "dependencies": {
    "duckduckgo-images-api": "^2.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### التشغيل

```bash
# 1. التنصيب
npm install

# 2. التشغيل
npm run dev

# 3. الوصول
# http://localhost:3000
```

---

## 🔗 الروابط المهمة

- **NPM Package**: https://www.npmjs.com/package/duckduckgo-images-api
- **GitHub**: https://github.com/noffily/duckduckgo-images-api
- **Next.js Docs**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ الخلاصة

| السؤال | الإجابة |
|---------|---------|
| **هل يمكن جلب صور من DuckDuckGo؟** | ✅ نعم |
| **هل يحتاج API Key؟** | ❌ لا - مجاني 100% |
| **هل يعمل في Next.js؟** | ✅ نعم - سهل جداً |
| **ما هو الحد المجاني؟** | ♾️ غير محدود (عملياً) |
| **هل الكود جاهز؟** | ✅ نعم - في الملف أعلاه |

---

**هل تريد أن أقوم بإنشاء مشروع Next.js كامل مع الكود الجاهز للتشغيل؟** 🚀🦆

---

## 🎨 React Component - عرض الأخبار والصور معاً

### مكون شامل للبحث في الأخبار والصور

```jsx
// ========================================
// FILE: app/components/DuckDuckGoSearch.jsx
// مكون شامل للأخبار والصور
// ========================================

'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DuckDuckGoSearch() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('both'); // news, images, both
  const [news, setNews] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('الرجاء إدخال كلمة بحث');
      return;
    }

    setLoading(true);
    setError(null);
    setNews([]);
    setImages([]);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=20`
      );
      
      const data = await response.json();

      if (data.success) {
        if (data.news) setNews(data.news);
        if (data.images) setImages(data.images);
      } else {
        setError(data.error || 'حدث خطأ في البحث');
      }

    } catch (err) {
      setError('فشل الاتصال بالخادم');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* شريط البحث */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أخبار أو صور... (مثل: محرم بك، الإسكندرية)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '⏳ جاري البحث...' : '🔍 بحث'}
            </button>
          </div>

          {/* نوع البحث */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="searchType"
                value="both"
                checked={searchType === 'both'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <span>الكل (أخبار + صور)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="searchType"
                value="news"
                checked={searchType === 'news'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <span>📰 أخبار فقط</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="searchType"
                value="images"
                checked={searchType === 'images'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <span>🖼️ صور فقط</span>
            </label>
          </div>
        </div>
      </form>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* النتائج - الأخبار */}
      {news.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📰 الأخبار ({news.length})
          </h2>
          <div className="space-y-4">
            {news.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  {/* صورة الخبر */}
                  {article.image && (
                    <div className="flex-shrink-0 w-32 h-32 relative">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover rounded"
                        sizes="128px"
                      />
                    </div>
                  )}

                  {/* محتوى الخبر */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-medium">{article.source}</span>
                      {article.date && (
                        <span>• {new Date(article.date).toLocaleDateString('ar-EG')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* النتائج - الصور */}
      {images.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🖼️ الصور ({images.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group cursor-pointer">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={img.thumbnail}
                    alt={img.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {img.title}
                </p>
                <a
                  href={img.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  عرض بالحجم الكامل
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* حالة فارغة */}
      {!loading && news.length === 0 && images.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">
          <p className="text-xl">ابحث عن أخبار وصور باستخدام DuckDuckGo 🦆</p>
          <p className="mt-2">مجاني 100% - بدون API Key - بدون حدود</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 دمج مع Zoon Club Agent System

### كلاس شامل للأخبار والصور

```javascript
// ========================================
// FILE: lib/zoonDuckDuckGoService.js
// خدمة شاملة للأخبار والصور من DuckDuckGo
// ========================================

import { searchNews, searchImages } from 'duck-duck-scrape';

export class ZoonDuckDuckGoService {
  /**
   * جلب أخبار محرم بك من DuckDuckGo
   */
  async fetchMoharramBekNews(options = {}) {
    const keywords = [
      'محرم بك الإسكندرية',
      'moharram bek alexandria'
    ];

    const allNews = [];

    for (const keyword of keywords) {
      try {
        const results = await searchNews(keyword, {
          safeSearch: 'moderate',
          time: options.timeRange || 'd',  // d, w, m
          region: 'eg-ar',
          locale: 'ar'
        });

        const news = results.results.map(article => ({
          title: article.title,
          url: article.url,
          description: article.description || '',
          source: article.source,
          image: article.image,
          date: article.date,
          pubDate: new Date(article.date),
          relativeTime: article.relativeTime
        }));

        allNews.push(...news);

      } catch (error) {
        console.error(`❌ خطأ في البحث عن: ${keyword}`, error);
      }
    }

    // إزالة التكرار
    const uniqueNews = this.removeDuplicates(allNews);
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    return uniqueNews.sort((a, b) => b.pubDate - a.pubDate);
  }

  /**
   * اختيار صورة مناسبة للمحتوى
   */
  async selectImageForContent(arabicContent, psychology) {
    const keywords = this.extractKeywords(arabicContent);
    const query = `${keywords} alexandria egypt`;

    console.log(`🖼️ البحث عن صورة: ${query}`);

    try {
      const results = await searchImages(query, {
        safeSearch: 'moderate',
        size: 'large',
        type: 'photo',
        layout: 'wide'
      });

      if (results.results.length === 0) {
        console.log('⚠️ لا توجد صور، استخدام Fallback');
        return this.getFallbackImage();
      }

      const bestImage = results.results[0];

      return {
        url: bestImage.image,
        thumbnail: bestImage.thumbnail,
        title: bestImage.title,
        source: 'DuckDuckGo',
        width: bestImage.width,
        height: bestImage.height
      };

    } catch (error) {
      console.error('❌ خطأ في جلب الصورة:', error);
      return this.getFallbackImage();
    }
  }

  /**
   * البحث الذكي عن محتوى متكامل (خبر + صورة)
   */
  async searchSmartContent(query, options = {}) {
    console.log(`🔍 بحث ذكي عن: ${query}`);

    try {
      // البحث المتزامن عن الأخبار والصور
      const [newsResults, imageResults] = await Promise.all([
        searchNews(query, {
          safeSearch: 'moderate',
          time: options.timeRange || 'd',
          region: 'eg-ar'
        }),
        searchImages(query, {
          safeSearch: 'moderate',
          size: 'large'
        })
      ]);

      // اختيار أفضل خبر
      const topNews = newsResults.results[0];
      
      // اختيار أفضل صورة
      const topImage = imageResults.results.find(img => img.image) || null;

      return {
        news: {
          title: topNews.title,
          url: topNews.url,
          description: topNews.description || '',
          source: topNews.source,
          date: topNews.date
        },
        image: topImage ? {
          url: topImage.image,
          thumbnail: topImage.thumbnail,
          title: topImage.title
        } : this.getFallbackImage()
      };

    } catch (error) {
      console.error('❌ خطأ في البحث الذكي:', error);
      return null;
    }
  }

  /**
   * استخراج كلمات مفتاحية من النص العربي
   */
  extractKeywords(arabicText) {
    const translationMap = {
      'محرم بك': 'moharram bek',
      'الإسكندرية': 'alexandria',
      'البحر': 'sea beach',
      'الكوبري': 'bridge',
      'الترام': 'tram',
      'النظافة': 'clean street',
      'التطوير': 'development',
      'الميدان': 'square plaza',
      'المباني': 'buildings',
      'الناس': 'people community'
    };

    for (const [arabic, english] of Object.entries(translationMap)) {
      if (arabicText.includes(arabic)) {
        return english;
      }
    }

    return 'alexandria egypt city';
  }

  /**
   * إزالة الأخبار المكررة
   */
  removeDuplicates(news) {
    const seen = new Set();
    return news.filter(item => {
      const key = item.title + item.source;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * صورة احتياطية (Fallback)
   */
  getFallbackImage() {
    return {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
      title: 'Alexandria, Egypt',
      source: 'Fallback'
    };
  }
}
```

---

## 🔄 تحديث Zoon Agent System ليستخدم DuckDuckGo

```javascript
// ========================================
// FILE: zoon-agent-system-duckduckgo.js
// نظام Zoon المحدّث باستخدام DuckDuckGo
// ========================================

import { ZoonDuckDuckGoService } from './lib/zoonDuckDuckGoService';
import { ZoonGeminiAgent } from './lib/zoonGeminiAgent';

class ZoonAgentSystemDuckDuckGo {
  constructor(config) {
    this.config = config;
    this.duckduckgo = new ZoonDuckDuckGoService();
    this.gemini = new ZoonGeminiAgent();
  }

  async execute() {
    console.log('🚀 بدء تنفيذ Zoon Agent System - DuckDuckGo Edition');

    // ====== STEP 1: جلب الأخبار من DuckDuckGo ======
    console.log('📰 جلب أخبار محرم بك...');
    const allNews = await this.duckduckgo.fetchMoharramBekNews({
      timeRange: 'd'  // آخر 24 ساعة
    });

    if (allNews.length === 0) {
      console.log('⚠️ لا توجد أخبار جديدة');
      return;
    }

    console.log(`✅ تم جلب ${allNews.length} خبر`);

    // ====== STEP 2: اختيار الخبر الأنسب (Context Filter) ======
    const selectedNews = await this.gemini.selectBestNews(
      allNews,
      this.config.weekly_goal
    );

    console.log(`✅ تم اختيار الخبر: ${selectedNews.title}`);

    // ====== STEP 3: التحليل النفسي ======
    const psychology = await this.gemini.analyzePsychology(selectedNews.title);

    console.log('✅ التحليل النفسي:', psychology);

    // ====== STEP 4: توليد المحتوى (3 أساليب) ======
    const posts = await Promise.all([
      this.gemini.generatePost(selectedNews.title, 'informational', psychology),
      this.gemini.generatePost(selectedNews.title, 'narrative', psychology),
      this.gemini.generatePost(selectedNews.title, 'motivational', psychology)
    ]);

    console.log('✅ تم توليد 3 أساليب للمنشور');

    // ====== STEP 5: اختيار الصورة من DuckDuckGo ======
    const selectedImage = await this.duckduckgo.selectImageForContent(
      selectedNews.title,
      psychology
    );

    console.log('✅ تم اختيار الصورة:', selectedImage.title);

    // ====== STEP 6: مراجعة الجودة ======
    const quality = await this.gemini.qualityCheck({
      informational: posts[0].post_text,
      narrative: posts[1].post_text,
      motivational: posts[2].post_text
    });

    console.log('✅ نتيجة المراجعة:', quality.status);

    // ====== STEP 7: الحفظ في Supabase ======
    await this.saveToSupabase({
      news: selectedNews,
      posts: posts,
      image: selectedImage,
      psychology: psychology,
      quality: quality
    });

    console.log('✅ تم الحفظ في Supabase');

    return {
      news: selectedNews,
      posts: posts,
      image: selectedImage,
      psychology: psychology
    };
  }

  async saveToSupabase(data) {
    // حفظ البيانات في Supabase
    // ... كود الحفظ
  }
}

// ====== USAGE ======
const zoonSystem = new ZoonAgentSystemDuckDuckGo({
  weekly_goal: 'تشجيع النظافة والمشاركة المجتمعية'
});

// تشغيل كل ساعة
setInterval(() => {
  zoonSystem.execute();
}, 3600000);
```

---

## 📊 مقارنة شاملة: DuckDuckGo vs Google News RSS

| المعيار | DuckDuckGo News ⭐⭐⭐⭐ | Google News RSS ⭐⭐⭐⭐⭐ |
|---------|---------------------|----------------------|
| **API Key** | ❌ غير مطلوب | ❌ غير مطلوب |
| **عدد الطلبات** | ♾️ غير محدود | ♾️ غير محدود |
| **سهولة الاستخدام** | ✅ سهل (npm package) | ✅✅ أسهل (RSS parsing) |
| **أخبار محلية (مصر)** | ✅ جيدة | ✅✅ ممتازة |
| **الصور مدمجة** | ✅✅ نعم (في نفس API) | ⚠️ محدودة |
| **البحث بالعربي** | ✅ جيد | ✅✅ ممتاز |
| **جودة المصادر** | ✅ موثوقة | ✅✅ موثوقة جداً |
| **الفلاتر** | ✅ زمن، منطقة | ✅✅ زمن، منطقة، موضوع |
| **السرعة** | ⚡⚡ 2-4 ثوانٍ | ⚡⚡⚡ 1-2 ثانية |
| **الاستقرار** | ✅ جيد | ✅✅ ممتاز |
| **يدعم الصور أيضاً** | ✅✅✅ نعم | ❌ لا |
| **التوصية** | **بديل ممتاز** | **الأفضل للأخبار** |

---

## 🎯 التوصية النهائية

### **الحل الأمثل: استخدم كلاهما معاً!**

```javascript
class HybridNewsService {
  async fetchNews(query) {
    try {
      // 1. جرب Google News RSS أولاً (أسرع وأدق)
      const googleNews = await this.googleNewsRSS.fetch(query);
      
      if (googleNews.length > 0) {
        console.log('✅ استخدام Google News RSS');
        return googleNews;
      }

    } catch (error) {
      console.log('⚠️ Google News فشل، استخدام DuckDuckGo');
    }

    // 2. استخدم DuckDuckGo كـ Fallback
    const duckNews = await this.duckduckgo.fetchNews(query);
    return duckNews;
  }

  async fetchImage(query) {
    // استخدم DuckDuckGo للصور (يدعم الصور بشكل أفضل)
    return await this.duckduckgo.fetchImages(query);
  }
}
```

**الفوائد:**
- ✅ **Google News RSS** للأخبار (أسرع وأدق)
- ✅ **DuckDuckGo** للصور (أفضل وأسهل)
- ✅ **DuckDuckGo** كـ Fallback للأخبار (إذا فشل Google)
- ✅ **ضمان** الحصول على محتوى دائماً

---

## 📦 ملف `package.json` الكامل

```json
{
  "name": "zoon-club-duckduckgo",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "duck-duck-scrape": "^2.2.5",
    "rss-parser": "^3.13.0",
    "@google/generative-ai": "^0.21.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 🔗 الروابط المهمة

- **duck-duck-scrape**: https://github.com/Snazzah/duck-duck-scrape
- **Documentation**: https://duck-duck-scrape.js.org/
- **NPM Package**: https://www.npmjs.com/package/duck-duck-scrape

---

## ✅ الخلاصة النهائية

| السؤال | الإجابة |
|---------|---------|
| **هل يمكن جلب الأخبار من DuckDuckGo؟** | ✅ **نعم** - مثل Google News تماماً |
| **هل يمكن جلب الصور؟** | ✅ **نعم** - من نفس API |
| **هل يحتاج API Key؟** | ❌ **لا** - مجاني 100% |
| **هل يعمل في Next.js؟** | ✅ **نعم** - كود جاهز |
| **هل هو بديل كامل لـ Google News RSS؟** | ✅ **نعم** - مع ميزة إضافية (الصور) |
| **ما هو الحل الأمثل؟** | ✅ **كلاهما معاً** (Google للأخبار + DuckDuckGo للصور) |

---

**🎉 الآن لديك نظام متكامل للأخبار والصور بدون API Keys وبدون تكلفة!**

