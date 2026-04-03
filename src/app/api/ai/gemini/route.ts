import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { prompt, config } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY غير موجود في .env.local' },
        { status: 500 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'يجب إرسال prompt نصي صحيح' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxOutputTokens ?? 2000,
      }
    });

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // تنظيف الـ JSON لو موجود
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // محاولة تحليل JSON على مستوى الخادم لتسهيل العمل على العميل
      let parsed = null;
      try {
        parsed = JSON.parse(cleanText);
      } catch {
        // ليست JSON صالحة - سنرسل النص كما هو
      }

      return NextResponse.json({ 
        success: true,
        text: cleanText,
        parsed // إن وُجد JSON صالح، يُرسل مباشرة كـ object
      });
    } catch (apiError: any) {
      // التعامل الخاص مع تجاوز حد الطلبات (Rate Limit)
      if (apiError.status === 429 || apiError.message?.includes('429')) {
        return NextResponse.json(
          { error: 'تم تجاوز حد الطلبات المسموح به لـ Gemini. يرجى الانتظار دقيقة والمحاولة مرة أخرى.' },
          { status: 429 }
        );
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error('❌ Gemini API Error:', {
      message: error.message,
      status: error.status
    });
    return NextResponse.json(
      { error: error.message || 'خطأ في Gemini API' },
      { status: error.status || 500 }
    );
  }
}
