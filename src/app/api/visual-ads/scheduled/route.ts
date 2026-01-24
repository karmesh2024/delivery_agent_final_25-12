/**
 * API Route: Scheduled Visual Ads
 * الحصول على الإعلانات المرئية المجدولة للوقت الحالي
 */

import { NextRequest, NextResponse } from 'next/server';
import { visualAdsService } from '@/domains/club-zone/services/visualAdsService';

// Types
interface ScheduledVisualAd {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  file_url: string;
  display_duration_seconds: number;
  play_rule: string;
  priority: string;
  description?: string;
  call_to_action?: string;
}

/**
 * GET: الحصول على الإعلانات المرئية المجدولة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTime = searchParams.get('time');

    // تحليل الوقت المطلوب (افتراضياً الوقت الحالي)
    let timeToCheck: Date;
    if (targetTime) {
      timeToCheck = new Date(targetTime);
    } else {
      timeToCheck = new Date();
    }

    // جلب الإعلانات المجدولة
    const scheduledAds = await visualAdsService.getScheduledVisualAds();

    // تنسيق البيانات للاستجابة
    const formattedAds: ScheduledVisualAd[] = scheduledAds.map(ad => ({
      id: ad.id,
      title: ad.title,
      media_type: ad.media_type,
      file_url: ad.file_url,
      display_duration_seconds: ad.media_type === 'video'
        ? (ad.file_duration_seconds || 0)
        : (ad.display_duration_seconds || 10),
      play_rule: ad.play_rule || 'continuous',
      priority: ad.priority,
      description: ad.description,
      call_to_action: ad.metadata?.call_to_action,
    }));

    console.log(`[Visual Ads API] Found ${formattedAds.length} scheduled ads for ${timeToCheck.toISOString()}`);

    return NextResponse.json({
      success: true,
      data: {
        ads: formattedAds,
        requested_time: timeToCheck.toISOString(),
        total_count: formattedAds.length,
      }
    });

  } catch (error) {
    console.error('[Visual Ads API] Error fetching scheduled ads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scheduled visual ads',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST: تسجيل تفاعل مع إعلان مرئي
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visual_ad_id,
      interaction_type,
      interaction_data
    } = body;

    if (!visual_ad_id || !interaction_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: visual_ad_id and interaction_type'
        },
        { status: 400 }
      );
    }

    // التحقق من صحة نوع التفاعل
    const validInteractions = ['view', 'click', 'skip', 'like', 'share'];
    if (!validInteractions.includes(interaction_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid interaction_type. Must be one of: ' + validInteractions.join(', ')
        },
        { status: 400 }
      );
    }

    // تسجيل التفاعل
    await visualAdsService.logUserInteraction(
      visual_ad_id,
      interaction_type,
      interaction_data
    );

    console.log(`[Visual Ads API] Logged ${interaction_type} interaction for ad ${visual_ad_id}`);

    return NextResponse.json({
      success: true,
      message: 'Interaction logged successfully',
      data: {
        visual_ad_id,
        interaction_type,
        logged_at: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[Visual Ads API] Error logging interaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log visual ad interaction',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}