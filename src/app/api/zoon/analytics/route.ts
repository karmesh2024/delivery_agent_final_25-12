import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const stats = await getAnalytics();
    
    if (!stats) {
      return NextResponse.json({ 
        success: false, 
        error: 'Redis is not connected or analytics is empty' 
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Analytics API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
