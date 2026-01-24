/**
 * API Route: Visual Ads Management
 * إدارة الإعلانات المرئية (إنشاء، جلب، تحديث، حذف)
 */

import { NextRequest, NextResponse } from 'next/server';
import { visualAdsService } from '@/domains/club-zone/services/visualAdsService';
import { VisualAdFormData } from '@/domains/club-zone/services/radioContentService';

/**
 * GET: جلب جميع الإعلانات المرئية مع فلترة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: any = {
      is_active: searchParams.get('active') !== 'false', // افتراضياً نشطة فقط
    };

    // فلترة حسب نوع الوسيطة
    if (searchParams.has('media_type')) {
      filters.media_type = searchParams.get('media_type');
    }

    // فلترة حسب قاعدة التشغيل
    if (searchParams.has('play_rule')) {
      filters.play_rule = searchParams.get('play_rule');
    }

    // البحث في العنوان
    if (searchParams.has('search')) {
      filters.search = searchParams.get('search');
    }

    // الحد الأقصى للنتائج
    if (searchParams.has('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    const visualAds = await visualAdsService.getAllVisualAds(filters);

    return NextResponse.json({
      success: true,
      data: visualAds,
      meta: {
        count: visualAds.length,
        filters: filters,
      }
    });

  } catch (error) {
    console.error('[Visual Ads API] Error fetching visual ads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visual ads',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST: إنشاء إعلان مرئي جديد
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    const requiredFields = ['title', 'media_type', 'file_url'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`
          },
          { status: 400 }
        );
      }
    }

    // التحقق من صحة نوع الوسيطة
    if (!['image', 'video'].includes(body.media_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid media_type. Must be "image" or "video"'
        },
        { status: 400 }
      );
    }

    // التحقق من صحة الأولوية
    const validPriorities = ['low', 'medium', 'high'];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid priority. Must be "low", "medium", or "high"'
        },
        { status: 400 }
      );
    }

    // إنشاء الإعلان
    const formData: VisualAdFormData = {
      title: body.title,
      description: body.description,
      media_type: body.media_type,
      file_url: body.file_url,
      file_duration_seconds: body.file_duration_seconds,
      display_duration_seconds: body.display_duration_seconds || 10,
      thumbnail_url: body.thumbnail_url,
      play_rule: body.play_rule,
      scheduled_time: body.scheduled_time,
      priority: body.priority || 'medium',
      metadata: body.metadata,
    };

    const visualAd = await visualAdsService.createVisualAd(formData);

    console.log(`[Visual Ads API] Created new visual ad: ${visualAd.title} (${visualAd.media_type})`);

    return NextResponse.json({
      success: true,
      message: 'Visual ad created successfully',
      data: visualAd
    }, { status: 201 });

  } catch (error) {
    console.error('[Visual Ads API] Error creating visual ad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create visual ad',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}