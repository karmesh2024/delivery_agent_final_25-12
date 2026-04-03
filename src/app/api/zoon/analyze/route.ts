import { NextRequest, NextResponse } from 'next/server';
import { imageOCRHandler } from '@/domains/zoon-os/functions/handlers/search-handlers';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Missing imageUrl' }, { status: 400 });
    }

    console.log(`🔍 [Analyze API] Starting OCR for: ${imageUrl}`);
    
    const result = await imageOCRHandler({ imageUrl, prompt });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Analyze API] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
