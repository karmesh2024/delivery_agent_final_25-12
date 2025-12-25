import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('Reset password API called');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase credentials missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey
      });
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { agentId, newPassword } = body;

    console.log('Reset password request:', { agentId, hasPassword: !!newPassword });

    if (!agentId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Agent ID and new password are required' },
        { status: 400 }
      );
    }

    // إنشاء عميل Supabase باستخدام Service Role Key (للدخول كمسؤول)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // تحديث كلمة المرور باستخدام Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      agentId,
      { password: newPassword }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to reset password',
          details: error
        },
        { status: 500 }
      );
    }

    console.log('Password reset successfully for agent:', agentId);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Unexpected error in reset-password API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

