import { supabaseServiceRole as supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// الأدوار الافتراضية للاستخدام في حالة عدم وجود أدوار في قاعدة البيانات
const DEFAULT_ROLES = [
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'مدير مساعد',
    code: 'manager',
    level: 60,
    is_system: true,
    is_active: true
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'مشرف',
    code: 'supervisor',
    level: 40,
    is_system: true,
    is_active: true
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'دعم فني وخدمة عملاء',
    code: 'support',
    level: 30,
    is_system: true,
    is_active: true
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'مراقب - صلاحيات عرض فقط',
    code: 'viewer',
    level: 10,
    is_system: true,
    is_active: true
  },
  {
    id: '6786b241-8c2f-49b5-9947-6377fb5348fe',
    name: 'رئيس مجلس الادارة',
    code: 'admin',
    level: 100,
    is_system: true,
    is_active: true
  },
  {
    id: 'b98dc2ff-d97d-4f5a-a7bb-c9b864268c4c',
    name: 'مدير النظام',
    code: 'super_admin',
    level: 100,
    is_system: true,
    is_active: true
  },
  {
    id: 'c03d006e-f7fd-4def-89cd-c610c744255f',
    name: 'مدير المبيعات',
    code: 'sales_manager',
    level: 60,
    is_system: true,
    is_active: true
  }
];

/**
 * نقطة نهاية API للحصول على قائمة الأدوار
 */
export async function GET() {
  try {
    console.log('[API roles] Received request for roles');
    console.log('[API roles] Checking Supabase client (service role):', supabase ? 'Initialized' : 'Not Initialized');

    if (!supabase) {
      console.error('[API roles] Supabase service role client not initialized. Returning default roles.');
      // إرجاع الأدوار الافتراضية في حالة عدم تهيئة Supabase
      return NextResponse.json({ success: true, roles: DEFAULT_ROLES });
    }

    // استعلام قاعدة البيانات لجلب الأدوار
    console.log('[API roles] Fetching roles from database using service role client...');
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: false });

    if (error) {
      console.error('[API roles] Error fetching roles from Supabase:', JSON.stringify(error, null, 2));
      // إرجاع الأدوار الافتراضية في حالة حدوث خطأ
      return NextResponse.json({ success: true, roles: DEFAULT_ROLES });
    }

    console.log('[API roles] Supabase query data:', JSON.stringify(data, null, 2));

    // التحقق من وجود بيانات
    if (!data || data.length === 0) {
      console.log('[API roles] No roles found in database (data is null or empty), returning default roles');
      return NextResponse.json({ success: true, roles: DEFAULT_ROLES });
    }

    console.log(`[API roles] Successfully fetched ${data.length} roles from database`);
    // سجل تشخيصي للتحقق من البيانات
    console.log('[API roles] First few roles from DB:', data.slice(0, 3).map(role => ({ id: role.id, name: role.name, code: role.code })));
    
    // إرجاع البيانات
    return NextResponse.json({ success: true, roles: data });
  } catch (error) {
    console.error('[API roles] Unexpected error in GET function:', JSON.stringify(error, null, 2));
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // إرجاع الأدوار الافتراضية في حالة حدوث خطأ غير متوقع
    return NextResponse.json({ success: true, roles: DEFAULT_ROLES });
  }
} 