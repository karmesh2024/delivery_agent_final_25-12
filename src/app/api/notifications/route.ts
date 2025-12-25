import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipient_id')
    const unreadOnly = searchParams.get('unread_only') === 'true'
    
    if (!recipientId) {
      return NextResponse.json({ error: 'recipient_id is required' }, { status: 400 })
    }

    const whereClause: any = { recipient_id: recipientId }
    if (unreadOnly) {
      whereClause.is_read = false
    }

    const notifications = await prisma.advancedNotification.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      recipient_id, 
      type, 
      title, 
      message, 
      data, 
      priority = 'medium',
      expires_at 
    } = body

    if (!recipient_id || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'recipient_id, type, title, and message are required' 
      }, { status: 400 })
    }

    const notification = await prisma.advancedNotification.create({
      data: {
        recipient_id,
        type,
        title,
        message,
        data,
        priority,
        expires_at: expires_at ? new Date(expires_at) : undefined
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
