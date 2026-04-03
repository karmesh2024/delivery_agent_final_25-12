import { NextRequest, NextResponse } from 'next/server';

/**
 * 🖼️ Article Meta Fetcher
 * يجلب صورة og:image ووصف المقال من رابط الخبر
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL مطلوب' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZoonBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const html = await res.text();

    // استخراج الـ Open Graph Tags
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || '';

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]
      || '';

    const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1]
      || '';

    const siteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || new URL(url).hostname.replace('www.', '');

    return NextResponse.json({
      success: true,
      image: ogImage || null,
      title: ogTitle || null,
      description: ogDescription || null,
      siteName,
      url
    });

  } catch (error: any) {
    // Google News redirects — نرجع خطأ بدون crash
    return NextResponse.json({
      success: false,
      error: error.message,
      image: null
    });
  }
}
