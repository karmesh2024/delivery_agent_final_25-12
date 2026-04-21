import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provinceId = searchParams.get('province_id')
    const includeCities = searchParams.get('include_cities') === 'true'
    
    const whereClause: any = { is_active: true }
    if (provinceId) {
      whereClause.province_id = provinceId
    }

    const regions = await prisma.region.findMany({
      where: whereClause,
      include: {
        province: {
          select: { id: true, name_ar: true, code: true }
        },
        cities: includeCities ? {
          where: { is_active: true }
        } : false
      },
      orderBy: { name_ar: 'asc' }
    })

    return NextResponse.json(regions)
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, name_ar, name_en, code, province_id, parent_region_id } = body

    if (!name || !province_id) {
      return NextResponse.json({ error: 'name and province_id are required' }, { status: 400 })
    }

    // Check if region with same code already exists in the same province
    if (code) {
      const existingRegion = await prisma.region.findFirst({
        where: { 
          code,
          province_id,
          is_active: true
        }
      })

      if (existingRegion) {
        return NextResponse.json({ error: 'Region with this code already exists in this province' }, { status: 409 })
      }
    }

    const region = await prisma.region.create({
      data: {
        name,
        name_ar,
        name_en,
        code,
        province_id,
        parent_region_id: parent_region_id ? parseInt(parent_region_id) : undefined
      },
      include: {
        province: {
          select: { id: true, name_ar: true, code: true }
        },
        cities: {
          where: { is_active: true }
        }
      }
    })

    return NextResponse.json(region, { status: 201 })
  } catch (error) {
    console.error('Error creating region:', error)
    return NextResponse.json({ error: 'Failed to create region' }, { status: 500 })
  }
}
