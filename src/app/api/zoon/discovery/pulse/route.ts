import { NextRequest, NextResponse } from 'next/server';
import { runProactiveDiscovery } from '@/lib/proactive-service';

/**
 * API لتشغيل محرك الاكتشاف الاستباقي
 * يمكن استدعاؤه عبر Cron Job يومي (مثلاً الساعة 8 صباحاً)
 */
export async function GET(req: NextRequest) {
  // للتحقق من الأمان بسيط (يمكن تطويره)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔔 [Cron] Starting daily discovery pulse...');
    const result = await runProactiveDiscovery();
    
    return NextResponse.json({
      success: result.success,
      message: 'Proactive discovery completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
