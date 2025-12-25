import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// الأدوار الافتراضية للاستخدام في حالة عدم وجود أدوار في قاعدة البيانات
const DEFAULT_ROLES = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    name: 'مدير النظام',
    code: 'super_admin',
    level: 100,
    is_system: true,
    is_active: true
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    name: 'مدير عام',
    code: 'manager',
    level: 90,
    is_system: true,
    is_active: true
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    name: 'مدير مندوبين',
    code: 'agent_manager',
    level: 80,
    is_system: true,
    is_active: true
  }
];

/**
 * نقطة نهاية API للحصول على معلومات دور محدد بواسطة المعرف
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  console.log(`[API roles/:id] Received request for role ID: ${id}`);
  
  // البحث عن الدور في الأدوار الافتراضية أولاً
  const defaultRole = DEFAULT_ROLES.find(role => role.id === id);
  if (defaultRole) {
    console.log(`[API roles/:id] Found role in default roles: ${defaultRole.name} (${defaultRole.id})`);
    return NextResponse.json({
      success: true,
      role: defaultRole
    });
  }
  
  try {
    if (!supabase) {
      console.error('[API roles/:id] Supabase client not initialized');
      return NextResponse.json(
        { success: false, message: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    // استعلام قاعدة البيانات لجلب الدور المحدد
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[API roles/:id] Error fetching role ${id}:`, error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log(`[API roles/:id] Role with ID ${id} not found`);
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    console.log(`[API roles/:id] Successfully fetched role: ${data.name} (${data.id})`);
    
    // إرجاع بيانات الدور
    return NextResponse.json({
      success: true,
      role: data
    });
  } catch (error) {
    console.error('[API roles/:id] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 