import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { supabase } from '@/lib/supabase'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('region_id')
    const countryId = searchParams.get('country_id')
    
    if (!regionId && !countryId) {
      return NextResponse.json({ error: 'region_id or country_id is required' }, { status: 400 })
    }

    let cities
    if (regionId) {
      // Region-based city lookup is not supported in this endpoint currently
      return NextResponse.json({ error: 'region_id lookup is not supported' }, { status: 400 })
    } else {
      // countryId provided: use Supabase CountryCityBoundary for country/city mapping
      if (!supabase) {
        console.error('Supabase client not initialized')
        return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 })
      }

      // Resolve the country_name by the given country_id (country rows have city_name IS NULL)
      const { data: countryRow, error: countryError } = await supabase
        .from('CountryCityBoundary')
        .select('country_name')
        .eq('id', countryId)
        .is('city_name', null)
        .single()

      if (countryError || !countryRow) {
        return NextResponse.json({ error: 'Country not found' }, { status: 404 })
      }

      const countryName = countryRow.country_name

      // Fetch all city rows for that country (where city_name is NOT NULL)
      const { data: cityRows, error: citiesError } = await supabase
        .from('CountryCityBoundary')
        .select('id, city_name')
        .eq('country_name', countryName)
        .not('city_name', 'is', null)
        .order('city_name', { ascending: true })

      if (citiesError) {
        console.error('Error fetching cities from Supabase:', citiesError)
        return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
      }

      cities = (cityRows || []).map((row) => ({
        id: row.id,
        name_ar: row.city_name,
        name_en: row.city_name,
        country_id: countryId
      }))
    }

    return NextResponse.json(cities)
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name_ar, name_en, code, region_id } = body

    if (!name_ar || !code || !region_id) {
      return NextResponse.json({ error: 'name_ar, code, and region_id are required' }, { status: 400 })
    }

    // Check if city with same code already exists in the same region
    // Note: Region-based city creation is not supported in this endpoint currently
    const existingCity = null

    if (existingCity) {
      return NextResponse.json({ error: 'City with this code already exists in this region' }, { status: 409 })
    }

    const city = { name_ar, name_en, code, region_id }

    return NextResponse.json(city, { status: 201 })
  } catch (error) {
    console.error('Error creating city:', error)
    return NextResponse.json({ error: 'Failed to create city' }, { status: 500 })
  }
}