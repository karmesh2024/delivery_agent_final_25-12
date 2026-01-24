/**
 * API Route: Visual Ad Management by ID
 * إدارة إعلان مرئي محدد (جلب، تحديث، حذف)
 */

import { NextRequest, NextResponse } from 'next/server';
import { visualAdsService } from '@/domains/club-zone/services/visualAdsService';
import { VisualAdFormData } from '@/domains/club-zone/services/radioContentService';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET: جلب إعلان مرئي محدد
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Visual ad ID is required' },
        { status: 400 }
      );
    }

    const visualAd = await visualAdsService.getVisualAdById(id);

    if (!visualAd) {
      return NextResponse.json(
        { success: false, error: 'Visual ad not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: visualAd
    });

  } catch (error) {
    console.error('[Visual Ads API] Error fetching visual ad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch visual ad',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: تحديث إعلان مرئي
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Visual ad ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الإعلان
    const existingAd = await visualAdsService.getVisualAdById(id);
    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: 'Visual ad not found' },
        { status: 404 }
      );
    }

    // التحقق من صحة البيانات الاختيارية
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

    // إعداد بيانات التحديث
    const updateData: Partial<VisualAdFormData> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.file_url !== undefined) updateData.file_url = body.file_url;
    if (body.file_duration_seconds !== undefined) updateData.file_duration_seconds = body.file_duration_seconds;
    if (body.display_duration_seconds !== undefined) updateData.display_duration_seconds = body.display_duration_seconds;
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
    if (body.play_rule !== undefined) updateData.play_rule = body.play_rule;
    if (body.scheduled_time !== undefined) updateData.scheduled_time = body.scheduled_time;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const updatedAd = await visualAdsService.updateVisualAd(id, updateData);

    console.log(`[Visual Ads API] Updated visual ad: ${id} - ${updatedAd.title}`);

    return NextResponse.json({
      success: true,
      message: 'Visual ad updated successfully',
      data: updatedAd
    });

  } catch (error) {
    console.error('[Visual Ads API] Error updating visual ad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update visual ad',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: حذف إعلان مرئي
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Visual ad ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الإعلان
    const existingAd = await visualAdsService.getVisualAdById(id);
    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: 'Visual ad not found' },
        { status: 404 }
      );
    }

    // حذف الإعلان (soft delete)
    await visualAdsService.deleteVisualAd(id);

    console.log(`[Visual Ads API] Soft deleted visual ad: ${id} - ${existingAd.title}`);

    return NextResponse.json({
      success: true,
      message: 'Visual ad deleted successfully'
    });

  } catch (error) {
    console.error('[Visual Ads API] Error deleting visual ad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete visual ad',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}