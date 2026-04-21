import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/db';

// جلب المقترحات المنتظرة للمراجعة
export async function GET(request: NextRequest) {
  try {
    const proposals = await prisma.notification_proposals.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(proposals);
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// إنشاء مقترح إشعار جديد من الإدارات المختلفة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      type, 
      target_user_id, 
      target_role, 
      priority, 
      source_department 
    } = body;

    if (!title || !message || !source_department) {
      return NextResponse.json({ error: 'Title, message and department are required' }, { status: 400 });
    }

    const proposal = await prisma.notification_proposals.create({
      data: {
        title,
        message,
        type: type || 'info',
        target_user_id: target_user_id || null,
        target_role: target_role || null,
        priority: priority || 'medium',
        source_department,
        status: 'pending',
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal', details: error.message }, { status: 500 });
  }
}

// تحديث حالة المقترح (موافقة أو رفض)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updatedProposal = await prisma.notification_proposals.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });

    return NextResponse.json(updatedProposal);
  } catch (error: any) {
    console.error('Error updating proposal status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
