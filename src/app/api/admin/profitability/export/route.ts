import { NextRequest, NextResponse } from 'next/server';
import { getProfitabilitySessions } from '@/services/profitabilityService';

/**
 * GET /api/admin/profitability/export
 * تصدير تقرير الربحية إلى Excel (CSV) أو PDF
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or pdf
    const fromDate = searchParams.get('from_date') || undefined;
    const toDate = searchParams.get('to_date') || undefined;

    const filters = {
      from_date: fromDate,
      to_date: toDate,
      page: 1,
      limit: 10000, // جلب جميع البيانات
    };

    const result = await getProfitabilitySessions(filters);

    if (format === 'csv') {
      // تصدير CSV
      const headers = [
        'التاريخ',
        'العميل',
        'الشراء (ج.م)',
        'البيع (ج.م)',
        'الربح (ج.م)',
        'هامش الربح (%)',
        'الحالة'
      ];

      const rows = result.data.map(session => [
        new Date(session.created_at).toLocaleDateString('ar-EG'),
        session.customer_name || 'غير معروف',
        session.buy_total.toFixed(2),
        session.sell_total.toFixed(2),
        session.platform_profit.toFixed(2),
        session.profit_margin.toFixed(2),
        session.is_settled ? 'معتمدة' : 'غير معتمدة'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // إضافة BOM للدعم الصحيح للعربية في Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      return new NextResponse(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="profitability-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // تصدير PDF - يحتاج مكتبة مثل jsPDF
      // للبساطة، سنعيد CSV مع نوع محتوى مختلف
      return NextResponse.json({
        success: false,
        error: 'تصدير PDF غير متاح حالياً. يرجى استخدام CSV.'
      }, { status: 400 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'تنسيق غير مدعوم. استخدم csv أو pdf'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in GET /api/admin/profitability/export:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      },
      { status: 500 }
    );
  }
}
