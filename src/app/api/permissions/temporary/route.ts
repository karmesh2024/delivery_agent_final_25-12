import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('admin_id')
    const activeOnly = searchParams.get('active_only') === 'true'
    
    const whereClause: any = {}
    if (adminId) {
      whereClause.admin_id = adminId
    }
    if (activeOnly) {
      whereClause.is_active = true
      whereClause.expires_at = { gt: new Date() }
    }

    const permissions = await prisma.temporaryPermission.findMany({
      where: whereClause,
      include: {
        admin: {
          select: { id: true, full_name: true, email: true }
        },
        permission: {
          select: { id: true, name: true, code: true }
        },
        granted_by_admin: {
          select: { id: true, full_name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error fetching temporary permissions:', error)
    return NextResponse.json({ error: 'Failed to fetch temporary permissions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      admin_id, 
      permission_id, 
      scope_type, 
      scope_id, 
      granted_by, 
      expires_at, 
      reason 
    } = body

    if (!admin_id || !permission_id || !scope_type || !expires_at) {
      return NextResponse.json({ 
        error: 'admin_id, permission_id, scope_type, and expires_at are required' 
      }, { status: 400 })
    }

    const permission = await prisma.temporaryPermission.create({
      data: {
        admin_id,
        permission_id,
        scope_type,
        scope_id,
        granted_by,
        expires_at: new Date(expires_at),
        reason
      },
      include: {
        admin: {
          select: { id: true, full_name: true, email: true }
        },
        permission: {
          select: { id: true, name: true, code: true }
        },
        granted_by_admin: {
          select: { id: true, full_name: true, email: true }
        }
      }
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error('Error creating temporary permission:', error)
    return NextResponse.json({ error: 'Failed to create temporary permission' }, { status: 500 })
  }
}
