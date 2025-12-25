import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeRegions = searchParams.get('include_regions') === 'true'
    const includeCities = searchParams.get('include_cities') === 'true'
    
    const province = await prisma.province.findUnique({
      where: { id: params.id },
      include: {
        regions: includeRegions ? {
          where: { is_active: true },
          include: includeCities ? {
            cities: {
              where: { is_active: true }
            }
          } : false
        } : false
      }
    })

    if (!province) {
      return NextResponse.json({ error: 'Province not found' }, { status: 404 })
    }

    return NextResponse.json(province)
  } catch (error) {
    console.error('Error fetching province:', error)
    return NextResponse.json({ error: 'Failed to fetch province' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name_ar, name_en, code, country_code, is_active } = body

    // Check if province exists
    const existingProvince = await prisma.province.findUnique({
      where: { id: params.id }
    })

    if (!existingProvince) {
      return NextResponse.json({ error: 'Province not found' }, { status: 404 })
    }

    // Check if code is being changed and if new code already exists
    if (code && code !== existingProvince.code) {
      const codeExists = await prisma.province.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json({ error: 'Province with this code already exists' }, { status: 409 })
      }
    }

    const province = await prisma.province.update({
      where: { id: params.id },
      data: {
        ...(name_ar && { name_ar }),
        ...(name_en !== undefined && { name_en }),
        ...(code && { code }),
        ...(country_code && { country_code }),
        ...(is_active !== undefined && { is_active })
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

    return NextResponse.json(province)
  } catch (error) {
    console.error('Error updating province:', error)
    return NextResponse.json({ error: 'Failed to update province' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by setting is_active to false
    await prisma.province.update({
      where: { id: params.id },
      data: { is_active: false }
    })

    return NextResponse.json({ message: 'Province deleted successfully' })
  } catch (error) {
    console.error('Error deleting province:', error)
    return NextResponse.json({ error: 'Failed to delete province' }, { status: 500 })
  }
}
