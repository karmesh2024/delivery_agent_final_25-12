import { tool } from 'ai';
import { z } from 'zod';

const searchNewsSchema = z.object({
  query: z.string().describe('مصطلح البحث، مثال: أخبار الاقتصاد في مصر'),
});

/**
 * يقوم بجلب الأخبار من Google News RSS Feed
 * هذا المصدر مستقر ولا يتم حظره لأنه مصمم للقراءة الآلية
 */
async function fetchGoogleNewsRSS(query: string): Promise<Array<{ title: string; link: string; source: string; date: string }>> {
  const encodedQuery = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ar&gl=EG&ceid=EG:ar`;

  console.log(`[SearchNode] � Fetching Google News RSS: ${rssUrl}`);

  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS returned status: ${response.status}`);
  }

  const xmlText = await response.text();

  // استخراج العناصر من XML بطريقة بسيطة وموثوقة
  const items: Array<{ title: string; link: string; source: string; date: string }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null && items.length < 8) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>|<link>(.*?)$/m);
    const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>|<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/);
    const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);

    const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
    const link = (linkMatch?.[1] || linkMatch?.[2] || '').trim();
    const source = (sourceMatch?.[1] || sourceMatch?.[2] || 'مصدر خارجي').trim();
    const date = (dateMatch?.[1] || '').trim();

    if (title && link) {
      items.push({ title, link, source, date });
    }
  }

  return items;
}

import { executeToolSafely } from '../execution/tool-executor';
import { RETRY_PRESETS } from '../execution/retry-logic';

export const searchNewsTool = tool({
  description: 'يبحث في الأخبار الحديثة عبر Google News لجلب أحدث المستجدات حول أي موضوع أو منطقة.',
  inputSchema: searchNewsSchema as any,
  execute: async (input: any) => {
    const { query } = input;

    const result = await executeToolSafely(
      'searchNewsTool',
      async () => {
        console.log(`[SearchNode] 🔍 بدء البحث عن: "${query}"`);
        const newsItems = await fetchGoogleNewsRSS(query);

        if (newsItems.length > 0) {
          console.log(`[SearchNode] ✅ تم جلب ${newsItems.length} خبر بنجاح!`);
          return {
            status: 'success',
            type: 'news_cards',
            query,
            count: newsItems.length,
            items: newsItems.map((item) => ({
              title: item.title,
              source: item.source,
              link: item.link,
              date: item.date,
            })),
            results: newsItems.map((item, i) => `${i + 1}. ${item.title} - ${item.source}`)
          };
        }

        console.log(`[SearchNode] ⚠️ لا توجد نتائج لـ "${query}"`);
        return {
          status: 'success',
          type: 'empty',
          query,
          count: 0,
          items: [],
          results: [`لم أجد أخباراً حديثة بخصوص "${query}". جرب البحث بكلمات مختلفة.`]
        };
      },
      { retryConfig: RETRY_PRESETS.STANDARD, timeoutMs: 12000 }
    );

    // التحقق من نجاح المحرك الوسيط
    if (!result.success) {
      return {
        status: 'error',
        query,
        error: result.agentMessage,
        results: [result.agentMessage || "حدث خطأ أثناء جلب الأخبار. يرجى المحاولة مرة أخرى."]
      };
    }

    return result.data;
  },
});
