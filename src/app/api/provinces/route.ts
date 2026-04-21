import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching provinces...')
    const { searchParams } = new URL(request.url)
    const includeRegions = searchParams.get('include_regions') === 'true'
    const includeCities = searchParams.get('include_cities') === 'true'
    
    console.log('API: includeRegions:', includeRegions, 'includeCities:', includeCities)
    
    const provinces = await prisma.province.findMany({
      where: { is_active: true },
      include: {
        regions: includeRegions ? {
          where: { is_active: true },
          include: includeCities ? {
            cities: {
              where: { is_active: true }
            }
          } : false
        } : false
      },
      orderBy: { name_ar: 'asc' }
    })

    console.log('API: Found provinces:', provinces.length)
    console.log('API: First province:', provinces[0])
    
    return NextResponse.json(provinces)
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name_ar, name_en, code, country_code = 'EG' } = body

    if (!name_ar || !code) {
      return NextResponse.json({ error: 'name_ar and code are required' }, { status: 400 })
    }

    // Check if province with same code already exists
    const existingProvince = await prisma.province.findUnique({
      where: { code }
    })

    if (existingProvince) {
      return NextResponse.json({ error: 'Province with this code already exists' }, { status: 409 })
    }

    const province = await prisma.province.create({
      data: {
        name_ar,
        name_en,
        code,
        country_code
      },
      include: {
        regions: {
          where: { is_active: true },
          include: {
            cities: {
              where: { is_active: true }
            }
          }
        }
      }
    })

    return NextResponse.json(province, { status: 201 })
  } catch (error) {
    console.error('Error creating province:', error)
    return NextResponse.json({ error: 'Failed to create province' }, { status: 500 })
  }
}
