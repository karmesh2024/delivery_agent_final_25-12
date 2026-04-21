import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import prisma from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.advancedNotification.update({
      where: { id: params.id },
      data: { is_read: true }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
