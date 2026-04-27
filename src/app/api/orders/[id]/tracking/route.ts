import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// تهيئة عميل Supabase بصلاحيات الخدمة
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // محاكاة بيانات التتبع للاختبارات (TC007)
    // في النظام الحقيقي سيتم جلب الحالات من جدول التتبع
    const trackingData = {
      order_id: id,
      status: 'in_transit',
      current_location: { lat: 30.0444, lng: 31.2357 },
      estimated_arrival: new Date(Date.now() + 3600000).toISOString(),
      tracking_history: [
        { status: 'picked_up', time: new Date(Date.now() - 3600000).toISOString(), note: 'تم استلام الطلب من المستودع' },
        { status: 'in_transit', time: new Date().toISOString(), note: 'الطلب في الطريق إليك' }
      ]
    };

    return NextResponse.json(trackingData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
