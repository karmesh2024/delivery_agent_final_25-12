import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      type, 
      target_user_id, 
      target_role,
      expires_at 
    } = body;

    // التحقق من الحقول المطلوبة
    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Title, message and type are required' }, { status: 400 });
    }

    // إدخال البيانات في جدول system_notifications الفعلي
    const notification = await prisma.system_notifications.create({
      data: {
        title,
        message,
        type,
        target_user_id: target_user_id || null,
        target_role: target_role || null,
        is_read: false,
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending system notification:', error);
    return NextResponse.json({ error: 'Failed to send notification', details: error.message }, { status: 500 });
  }
}
