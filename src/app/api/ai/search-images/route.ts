import { NextResponse } from 'next/server';
import { searchImages, SafeSearchType } from 'duck-duck-scrape';

/**
 * 🖼️ Image Search API (Pixabay + DuckDuckGo)
 * جلب مقترحات صور من مصادر متعددة لضمان أفضل تغطية للخبر
 */

export async function POST(req: Request) {
  try {
    const { query, source = 'all' } = await req.json();
    
    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const allImages: any[] = [];
    const errors: string[] = [];

    // --- 1. جلب من Pixabay (إذا كان مفعلاً) ---
    if (source === 'all' || source === 'pixabay') {
      try {
        const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
        if (PIXABAY_KEY) {
          const isEnglish = /[a-zA-Z]/.test(query);
          const langParam = isEnglish ? 'en' : 'ar';
          const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&lang=${langParam}&image_type=photo&orientation=horizontal&safesearch=true&per_page=12`;
          
          const response = await fetch(pixabayUrl);
          if (response.ok) {
            const data = await response.json();
            const pixabayHits = (data.hits || []).map((hit: any) => ({
              url: hit.largeImageURL,
              thumb: hit.webformatURL,
              description: hit.tags,
              source: 'Pixabay'
            }));
            allImages.push(...pixabayHits);
          }
        }
      } catch (e: any) {
        console.error('Pixabay Error:', e.message);
        errors.push(`Pixabay error: ${e.message}`);
      }
    }

    // --- 2. جلب من DuckDuckGo (مجاني وبدون مفتاح) ---
    if (source === 'all' || source === 'duckduckgo') {
      try {
        const ddgResults = await searchImages(query, {
          safeSearch: SafeSearchType.MODERATE
        });

        if (ddgResults && ddgResults.results) {
          const ddgImages = ddgResults.results.slice(0, 15).map((img: any) => ({
            url: img.image,
            thumb: img.thumbnail,
            description: img.title,
            source: 'DuckDuckGo'
          }));
          allImages.push(...ddgImages);
        }
      } catch (e: any) {
        console.error('DuckDuckGo Error:', e.message);
        errors.push(`DuckDuckGo error: ${e.message}`);
      }
    }

    if (allImages.length === 0 && errors.length > 0) {
      return NextResponse.json({ success: false, error: 'فشل البحث في جميع المصادر' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      images: allImages,
      query: query,
      total: allImages.length
    });

  } catch (error: any) {
    console.error('❌ Global Image Search Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
