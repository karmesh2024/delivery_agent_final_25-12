import { NextRequest, NextResponse } from 'next/server';
import { getRules, createRule, updateRule, deleteRule } from '@/services/storePointsRulesService';

/**
 * GET /api/admin/store-points-rules
 * الحصول على جميع القواعد
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    const rules = await getRules(activeOnly);
    
    return NextResponse.json({
      success: true,
      data: rules
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/store-points-rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/store-points-rules
 * إنشاء قاعدة جديدة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rule = await createRule(body);
    
    return NextResponse.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/store-points-rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/store-points-rules
 * تحديث قاعدة
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف القاعدة مطلوب' },
        { status: 400 }
      );
    }

    const rule = await updateRule(id, updates);
    
    return NextResponse.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/store-points-rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/store-points-rules
 * حذف قاعدة
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف القاعدة مطلوب' },
        { status: 400 }
      );
    }

    await deleteRule(parseInt(id));
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف القاعدة بنجاح'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/store-points-rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
