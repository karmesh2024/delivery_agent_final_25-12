import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/base';
import { logger } from '@/lib/logger-safe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent_id');

    // التحقق من صحة حالة الطلب إذا تم توفيرها (متطلب TC007)
    if (status) {
      const validStatuses = [
        'pending', 'confirmed', 'assigned', 'picked_up', 
        'in_transit', 'delivered', 'cancelled', 'completed'
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'حالة الطلب غير صالحة' }, 
          { status: 400 }
        );
      }
    }
    
    if (!supabaseServiceRole) {
      throw new Error('Supabase Service Role client not initialized');
    }

    let query = supabaseServiceRole
      .from('delivery_orders')
      .select('id, delivery_boy_id, customer_order_id, order_number, pickup_address, customer_name, customer_phone, estimated_distance, estimated_time, expected_total_amount, actual_total_amount, actual_pickup_time, actual_delivery_time, status, category_name, subcategory_name, priority, customer_id')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (agentId) {
      query = query.eq('delivery_boy_id', agentId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('API Error: GET /api/orders', { error });
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}