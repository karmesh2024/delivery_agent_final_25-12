/**
 * API Route: POST /api/admin/sync-catalog
 * تشغيل المزامنة الأولية بين waste_data_admin و catalog_waste_materials
 * يُنشئ سجلات كتالوج للمنتجات التي ليس لها catalog_waste_id ويربطها
 */

import { NextResponse } from 'next/server';
import { wasteCatalogSyncService } from '@/services/wasteCatalogSyncService';

export async function POST() {
  try {
    const result = await wasteCatalogSyncService.syncAllProducts();

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
      message: `مُزامَن: ${result.synced}، فشل: ${result.failed}، مُتخطّى: ${result.skipped}`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/sync-catalog:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    );
  }
}
