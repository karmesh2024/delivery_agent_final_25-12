import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requesterId = searchParams.get('requester_id')
    const status = searchParams.get('status')
    
    const whereClause: any = {}
    if (requesterId) {
      whereClause.requester_id = requesterId
    }
    if (status) {
      whereClause.status = status
    }

    const requests = await prisma.permissionRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: { id: true, full_name: true, email: true }
        },
        permission: {
          select: { id: true, name: true, code: true }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, full_name: true, email: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching permission requests:', error)
    return NextResponse.json({ error: 'Failed to fetch permission requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      requester_id, 
      permission_id, 
      scope_type, 
      scope_id, 
      reason, 
      priority = 'medium',
      expires_at 
    } = body

    if (!requester_id || !permission_id || !scope_type || !reason) {
      return NextResponse.json({ 
        error: 'requester_id, permission_id, scope_type, and reason are required' 
      }, { status: 400 })
    }

    const request = await prisma.permissionRequest.create({
      data: {
        requester_id,
        permission_id,
        scope_type,
        scope_id,
        reason,
        priority,
        expires_at: expires_at ? new Date(expires_at) : undefined
      },
      include: {
        requester: {
          select: { id: true, full_name: true, email: true }
        },
        permission: {
          select: { id: true, name: true, code: true }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, full_name: true, email: true }
            }
          }
        }
      }
    })

    // TODO: Create approval workflow entries and send notifications

    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    console.error('Error creating permission request:', error)
    return NextResponse.json({ error: 'Failed to create permission request' }, { status: 500 })
  }
}
