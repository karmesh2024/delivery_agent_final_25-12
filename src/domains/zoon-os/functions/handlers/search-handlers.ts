// src/domains/zoon-os/functions/handlers/search-handlers.ts
// معالجات البحث والجلب — يستخدمها Zoon OS للبحث في الويب وتحليل المحتوى

import { search, SafeSearchType } from 'duck-duck-scrape';
import TurndownService from 'turndown';

// ════════════════════════════════════════════
// الأنواع المشتركة
// ════════════════════════════════════════════

interface HandlerResult {
  success: boolean;
  data?: unknown;
  summary: string;
  error?: string;
}

interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

// ════════════════════════════════════════════
// 1. webSearchHandler — بحث سريع في الويب
// ════════════════════════════════════════════

export async function webSearchHandler(params: {
  query: string;
  maxResults?: number;
  limit?: number;
  category?: string;
  userId?: string;
}): Promise<HandlerResult> {
  try {
    const { query, maxResults = 5, limit, category = 'general' } = params;
    const effectiveLimit = limit ?? maxResults;

    if (!query || query.trim().length === 0) {
      return { success: false, summary: 'يجب توفير نص البحث', error: 'Missing query' };
    }

    let results: SearchResultItem[] = [];
    let isSearXNG = false;
    
    // 1. محاولة استخدام محرك SearXNG الداخلي إذا كان مأهولاً في ملفات البيئة
    const searxngUrl = process.env.SEARXNG_URL;
    if (searxngUrl) {
      try {
        const baseUrl = searxngUrl.endsWith('/') ? searxngUrl.slice(0, -1) : searxngUrl;
        const searxngCategory = category === 'images' ? 'images' : 'general';
        
        const searchUrl = new URL(`${baseUrl}/search`);
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('categories', searxngCategory);
        searchUrl.searchParams.set('language', 'ar-EG');
        
        const res = await fetch(searchUrl.toString(), {
          signal: AbortSignal.timeout(10000), // مهلة 10 ثوانٍ للسماح باستجابة محركات متعددة
        });
        
        if (res.ok) {
          const data = await res.json();
          results = (data.results || [])
            .slice(0, effectiveLimit)
            .map((r: any) => {
              const itemUrl = r.url || r.img_src || 'https://unknown.com';
              return {
                title: r.title || '',
                url: itemUrl !== 'https://unknown.com' ? itemUrl : '',
                snippet: r.content || r.snippet || '',
                source: new URL(itemUrl).hostname,
                ...(category === 'images' && { imageUrl: r.img_src || r.thumbnail_src || itemUrl }),
              };
            });
          
          if (results.length > 0) isSearXNG = true;
        }
      } catch (err: any) {
        console.warn(`[webSearchHandler] SearXNG unavailable, falling back to DDG: ${err.message}`);
      }
    }

    // 2. استخدام مكتبة duck-duck-scrape كخيار طوارئ (Fallback) إذا فشل SearXNG أو غير متوفر
    if (!isSearXNG) {
      const searchResults = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      results = (searchResults.results || [])
        .slice(0, effectiveLimit)
        .map((r: any) => {
          const itemUrl = r.url || r.href || 'https://unknown.com';
          return {
            title: r.title || '',
            url: itemUrl !== 'https://unknown.com' ? itemUrl : '',
            snippet: r.description || r.body || '',
            source: new URL(itemUrl).hostname,
            ...(category === 'images' && { imageUrl: r.image || r.thumbnail || r.url }),
          };
        });
    }

    return {
      success: true,
      data: { type: 'search_results', results, count: results.length, query, category, engine: isSearXNG ? 'SearXNG' : 'DuckDuckGo' },
      summary: `🔍 تم العثور على ${results.length} نتيجة لـ "${query}"`,
    };
  } catch (error: any) {
    console.error('[webSearchHandler] Error:', error.message);
    const aiNotice = 'الرجاء الرد حالاً واعتذر للمستخدم لأن محرك البحث محظور مؤقتا بسبب الضغط الزائد، قدم معلومات تقريبية من ذاكرتك واسأله إذا كان يريد الاستمرار بإجراء آخر.';
    return {
      success: false,
      data: { 
        type: 'search_results',
        results: [], 
        count: 0, 
        query: params.query, 
        category: params.category || 'general',
        error_alert_for_ai: aiNotice
      },
      summary: `تعذر إتمام البحث لأن محرك البحث حظر الطلب مؤقتاً.`,
      error: aiNotice,
    };
  }
}

// ════════════════════════════════════════════
// 2. deepResearchHandler — بحث عميق ومفصّل
// ════════════════════════════════════════════

export async function deepResearchHandler(params: {
  query: string;
  maxPages?: number;
  usePlaywright?: boolean;
  category?: string;
  userId?: string;
}): Promise<HandlerResult> {
  try {
    const { query, maxPages = 3, category } = params;

    if (!query) {
      return { success: false, summary: 'يجب توفير موضوع البحث', error: 'Missing query' };
    }

    // الخطوة 1: البحث أولاً للحصول على روابط
    const searchResult = await webSearchHandler({ query, maxResults: maxPages + 2 });
    if (!searchResult.success) return searchResult;

    const searchData = searchResult.data as any;
    const urls: string[] = (searchData.results || [])
      .slice(0, maxPages)
      .map((r: SearchResultItem) => r.url)
      .filter(Boolean);

    // الخطوة 2: جلب محتوى كل صفحة
    const pages: { url: string; title: string; markdown: string }[] = [];
    for (const url of urls) {
      try {
        const fetchResult = await webFetchHandler({ url, usePlaywright: false });
        if (fetchResult.success && fetchResult.data) {
          const fd = fetchResult.data as any;
          pages.push({
            url,
            title: fd.title || url,
            markdown: (fd.markdown || '').substring(0, 3000),
          });
        }
      } catch {
        // تجاهل الصفحات التي تفشل
      }
    }

    // الخطوة 3: دمج المحتوى
    const mergedContent = pages
      .map((p, i) => `## [${i + 1}] ${p.title}\nالمصدر: ${p.url}\n\n${p.markdown}`)
      .join('\n\n---\n\n');

    const sources = pages.map(p => ({ title: p.title, url: p.url }));

    return {
      success: true,
      data: {
        content: mergedContent || 'لم يتم العثور على محتوى كافٍ.',
        summary: `تم تحليل ${pages.length} صفحة حول "${query}"`,
        pagesCount: pages.length,
        sources,
        category,
      },
      summary: `🔬 بحث عميق: تم تحليل ${pages.length} مصادر حول "${query}"`,
    };
  } catch (error: any) {
    console.error('[deepResearchHandler] Error:', error.message);
    return {
      success: false,
      summary: `فشل البحث العميق: ${error.message}`,
      error: error.message,
    };
  }
}

// ════════════════════════════════════════════
// 3. webFetchHandler — جلب محتوى صفحة ويب
// ════════════════════════════════════════════

export async function webFetchHandler(params: {
  url: string;
  usePlaywright?: boolean;
  userId?: string;
}): Promise<HandlerResult> {
  try {
    const { url, usePlaywright = false } = params;

    if (!url) {
      return { success: false, summary: 'يجب توفير رابط الصفحة', error: 'Missing url' };
    }

    // جلب عادي بـ fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.5',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const html = await response.text();

    // تحويل HTML إلى Markdown
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    turndown.remove(['script', 'style', 'nav', 'footer', 'iframe', 'noscript']);

    const markdown = turndown.turndown(html).substring(0, 8000);

    // استخراج العنوان
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return {
      success: true,
      data: { markdown, title, url, length: markdown.length },
      summary: `🌐 تم جلب "${title}" (${markdown.length} حرف)`,
    };
  } catch (error: any) {
    console.error('[webFetchHandler] Error:', error.message);
    return {
      success: false,
      summary: `فشل جلب الصفحة: ${error.message}`,
      error: error.message,
    };
  }
}

// ════════════════════════════════════════════
// 4. imageOCRHandler — تحليل الصور واستخراج النصوص
// ════════════════════════════════════════════

export async function imageOCRHandler(params: {
  imageUrl: string;
  prompt?: string;
  userId?: string;
}): Promise<HandlerResult> {
  try {
    const { imageUrl, prompt = 'استخرج كل النصوص والأرقام من هذه الصورة' } = params;

    if (!imageUrl) {
      return { success: false, summary: 'يجب توفير رابط الصورة', error: 'Missing imageUrl' };
    }

    // استخدام Gemini Vision API لتحليل الصورة
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return { success: false, summary: 'لم يتم تكوين مفتاح Gemini API', error: 'Missing API key' };
    }

    // جلب الصورة وتحويلها إلى Base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error('فشل جلب الصورة من الرابط المصدر');
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    let mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // بعض الخوادم ترد بنوع بيانات عام فنضمن تعريفه كصورة
    if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg';

    const tryOCR = async (modelName: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mimeType, data: base64Data } },
              ]
            }],
          }),
        }
      );
    };

    let response = await tryOCR('gemini-2.0-flash');

    // إذا نفدت الحصة (429) أو الموديل غير موجود (404)، جرب الموديل البديل 1.5-flash
    if (response.status === 429 || response.status === 404) {
      console.warn(`[imageOCRHandler] Model fallback triggered due to ${response.status}`);
      response = await tryOCR('gemini-1.5-flash');
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[imageOCRHandler] Gemini API Final Rejection:', errText);
      return {
        success: true,
        data: { extractedText: `[عذرًا، حدود الاستخدام المجانية نفدت حالياً. جرب بعد دقيقة.] \n تفاصيل: ${response.status}`, imageUrl },
        summary: `🖼️ تعذر التحليل بسبب حدود الاستخدام (Rate Limit).`,
      };
    }

    const result = await response.json();
    const extractedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم استخراج نص';

    return {
      success: true,
      data: { extractedText, imageUrl },
      summary: `🖼️ تم استخراج النص من الصورة بنجاح`,
    };
  } catch (error: any) {
    console.error('[imageOCRHandler] Error:', error.message);
    return {
      success: false,
      summary: `فشل تحليل الصورة: ${error.message}`,
      error: error.message,
    };
  }
}

// ════════════════════════════════════════════
// 5. smartRerank — إعادة ترتيب النتائج حسب الأهمية
// ════════════════════════════════════════════

export async function smartRerank(params: {
  results: SearchResultItem[];
  query: string;
  topK?: number;
}): Promise<HandlerResult> {
  try {
    const { results, query, topK = 5 } = params;

    if (!results || results.length === 0) {
      return { success: true, data: [], summary: 'لا توجد نتائج لإعادة ترتيبها' };
    }

    // ترتيب بسيط بناءً على تطابق الكلمات المفتاحية
    const queryWords = query.toLowerCase().split(/\s+/);

    const scored = results.map(r => {
      const text = `${r.title} ${r.snippet}`.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (text.includes(word)) score += 1;
      }
      // مكافأة للعناوين القصيرة والواضحة
      if (r.title.length < 80) score += 0.5;
      return { ...r, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    const top = scored.slice(0, topK).map(({ _score, ...rest }) => rest);

    return {
      success: true,
      data: top,
      summary: `📊 تم إعادة ترتيب ${top.length} نتيجة`,
    };
  } catch (error: any) {
    return {
      success: false,
      summary: `فشل إعادة الترتيب: ${error.message}`,
      error: error.message,
    };
  }
}