import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchNews, SafeSearchType, SearchTimeType } from 'duck-duck-scrape';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ====================================================
// 🛰️ SOURCE 1: Google News RSS
// ====================================================
async function fetchGoogleNewsRSS(keywords: string[]): Promise<any[]> {
  const query = keywords.join(' OR ');
  const encodedQuery = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ar&gl=EG&ceid=EG:ar`;

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZoonBot/1.0)' },
      next: { revalidate: 1800 }
    });

    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

    const xmlText = await res.text();
    const items: any[] = [];
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemXml = match[1];

      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';

      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';

      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        || itemXml.match(/<description>(.*?)<\/description>/)?.[1] || '';

      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News';

      // 🖼️ استخراج الصورة من الـ RSS
      const thumbnailMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

      if (title) {
        items.push({
          title: title.replace(/<[^>]+>/g, '').trim(),
          link: link.trim(),
          description: description.replace(/<[^>]+>/g, '').substring(0, 300).trim(),
          pubDate,
          source,
          thumbnail
        });
      }
    }

    return items;
  } catch (error) {
    console.error('❌ Google RSS Error:', error);
    return [];
  }
}

// ====================================================
// 🛰️ SOURCE 2: DuckDuckGo News
// ====================================================
async function fetchDuckDuckGoNews(keywords: string[]): Promise<any[]> {
  try {
    const query = keywords.join(' ');
    const results = await searchNews(query, {
      safeSearch: SafeSearchType.MODERATE,
      time: SearchTimeType.DAY,
      region: 'eg-ar'
    } as any);

    return (results.results || []).map((article: any) => ({
      title: article.title,
      link: article.url,
      description: article.description || article.excerpt || '',
      source: article.source || 'DuckDuckGo',
      thumbnail: article.image || null,
      pubDate: article.date || new Date().toISOString()
    }));
  } catch (error) {
    console.error('❌ DuckDuckGo News Error:', error);
    return [];
  }
}

// ====================================================
// 🧠 STEP 2: Gemini يصفي ويختار الأنسب للهدف
// ====================================================
async function filterNewsByGoal(
  newsItems: any[],
  weeklyGoal: string,
  roomPolicy: string,
  roomName: string
): Promise<any[]> {
  if (newsItems.length === 0) return [];

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const newsListText = newsItems.slice(0, 20).map((n, i) =>
    `${i + 1}. العنوان: ${n.title}\nالوصف: ${n.description || 'لا يوجد'}`
  ).join('\n\n');

  const prompt = `
أنت محلل محتوى لنادي Zoon في محرم بك بالإسكندرية.

الغرفة: ${roomName}
سياسة الغرفة: ${roomPolicy || 'غرفة مجتمعية عامة'}
هدف الأسبوع: ${weeklyGoal || 'تعزيز التفاعل المجتمعي'}

قائمة الأخبار:
${newsListText}

المطلوب: رتب الأخبار من الأنسب للأقل، أعطِ relevance_score من 1 إلى 10، وأضف reason وsuggested_angle.
استبعد الأخبار غير المناسبة أو الحساسة.
بالإضافة لذلك، قم بإنشاء كلمات بحث باللغة الإنجليزية (image_search_keywords) لكل خبر تناسب البحث عن صور في Pixabay/DuckDuckGo، واحرص على إضافة "Alexandria, Egypt" للكلمات إذا كان الخبر محلياً لضمان نتائج دقيقة.

أجب بـ JSON فقط:
{
  "ranked_news": [
    {
      "index": 1,
      "title": "...",
      "relevance_score": 9,
      "reason": "...",
      "suggested_angle": "...",
      "image_search_keywords": "descriptive keywords in English"
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    const ranked = parsed.ranked_news || [];

    return ranked.map((r: any) => {
      const originalNews = newsItems[r.index - 1];
      if (!originalNews) return null;
      return {
        ...originalNews,
        relevance_score: r.relevance_score,
        reason: r.reason,
        suggested_angle: r.suggested_angle,
        image_search_keywords: r.image_search_keywords
      };
    }).filter((n: any) => n && n.relevance_score >= 5);

  } catch (error) {
    console.error('❌ Gemini Filter Error:', error);
    return newsItems.slice(0, 5).map(n => ({
      ...n,
      relevance_score: 5,
      reason: 'تم الاختيار تلقائياً'
    }));
  }
}

// ====================================================
// 🚀 POST Handler
// ====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keywords = ['محرم بك', 'الإسكندرية'],
      weekly_goal = '',
      room_policy = '',
      room_name = 'الغرفة',
      filterByGoal = true,
      source = 'all' // google, duckduckgo, all
    } = body;

    let rawNews: any[] = [];

    if (source === 'google' || source === 'all') {
      const gNews = await fetchGoogleNewsRSS(keywords);
      rawNews.push(...gNews);
    }

    if (source === 'duckduckgo' || source === 'all') {
      const dNews = await fetchDuckDuckGoNews(keywords);
      rawNews.push(...dNews);
    }

    // إزالة الأخبار المكررة بناءً على الرابط
    const uniqueNews = Array.from(new Map(rawNews.map(item => [item.link, item])).values());

    if (uniqueNews.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لم يتم العثور على أخبار. جرب كلمات بحث أخرى.',
        news: []
      });
    }

    let finalNews = uniqueNews;
    if (filterByGoal && weekly_goal) {
      finalNews = await filterNewsByGoal(uniqueNews, weekly_goal, room_policy, room_name);
    }

    return NextResponse.json({
      success: true,
      total_found: uniqueNews.length,
      total_relevant: finalNews.length,
      news: finalNews
    });

  } catch (error: any) {
    console.error('❌ Fetch News API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
