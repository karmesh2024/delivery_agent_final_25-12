/**
 * API Route: Visual Ads Statistics
 * إحصائيات الإعلانات المرئية وتفاعلات المستخدمين
 */

import { NextRequest, NextResponse } from 'next/server';
import { visualAdsService } from '@/domains/club-zone/services/visualAdsService';

/**
 * GET: جلب إحصائيات الإعلانات المرئية
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // تحليل التواريخ
    const startDate = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 يوم افتراضياً

    const endDate = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : new Date();

    // جلب الإحصائيات
    const stats = await visualAdsService.getVisualAdsStats(startDate, endDate);

    // إحصائيات إجمالية
    const totalStats = stats.reduce((acc, stat) => ({
      total_views: acc.total_views + (stat.total_views || 0),
      total_clicks: acc.total_clicks + (stat.total_clicks || 0),
      total_unique_users: acc.total_unique_users + (stat.unique_users || 0),
      avg_display_duration: acc.avg_display_duration + (stat.avg_display_duration || 0),
    }), {
      total_views: 0,
      total_clicks: 0,
      total_unique_users: 0,
      avg_display_duration: 0,
    });

    // حساب متوسط مدة العرض
    totalStats.avg_display_duration = stats.length > 0
      ? totalStats.avg_display_duration / stats.length
      : 0;

    // حساب نسبة النقر (CTR)
    totalStats.click_through_rate = totalStats.total_views > 0
      ? (totalStats.total_clicks / totalStats.total_views) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        summary: totalStats,
        ads: stats,
        meta: {
          ads_count: stats.length,
          period_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        }
      }
    });

  } catch (error) {
    console.error('[Visual Ads Stats API] Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visual ads statistics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}