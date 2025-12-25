import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// import { GeoJSONPolygon, GeoJSONPoint } from '@/domains/settings/types'; // Removed as boundary and center_point are no longer in CountryCityBoundary table

// Helper function to handle errors
const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
  return NextResponse.json({ message, error: errorMessage }, { status: 500 });
};

// Check if supabase client is initialized
const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
  return supabase;
};

// GET /api/countries
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('CountryCityBoundary')
      .select('id, country_name') // Select only id and country_name
      .is('city_name', null); // Only fetch country-level entries (where city_name is NULL)

    if (error) {
      return handleError(error, 'Failed to fetch countries.');
    }

    interface CountryDbItem {
      id: string;
      country_name: string;
      // boundary: any; // Removed
      // center_point: any; // Removed
    }

    const countries = data.map((item: CountryDbItem) => ({
      id: item.id,
      name_ar: item.country_name,
      name_en: item.country_name, // Placeholder, adjust if you have a separate column for English name
      // boundary: item.boundary, // Removed
      // center_point: item.center_point, // Removed
    }));

    return NextResponse.json(countries);
  } catch (error: unknown) {
    return handleError(error, 'An unexpected error occurred while fetching countries.');
  }
}

// POST /api/countries
export async function POST(req: Request) {
  try {
    const client = getSupabaseClient();
    const { name_ar, name_en } = await req.json(); // Removed boundary and center_point

    if (!name_ar) {
      return NextResponse.json({ message: 'Missing required field: name_ar' }, { status: 400 });
    }

    const { data, error } = await client
      .from('CountryCityBoundary')
      .insert({
        country_name: name_ar,
        city_name: null, // Mark as country-level entry
        // boundary: boundary, // Removed
        // center_point: center_point, // Removed
        // is_country_level_boundary: true, // Removed
      })
      .select('id, country_name')
      .single();

    if (error) {
      return handleError(error, 'Failed to add country.');
    }

    return NextResponse.json({ id: data.id, name_ar: data.country_name, message: 'Country added successfully.' }, { status: 201 });
  } catch (error: unknown) {
    return handleError(error, 'An unexpected error occurred while adding country.');
  }
}

// PUT /api/countries
export async function PUT(req: Request) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { name_ar, name_en } = await req.json(); // Removed boundary and center_point

    if (!id) {
      return NextResponse.json({ message: 'Missing country ID' }, { status: 400 });
    }
    if (!name_ar) {
      return NextResponse.json({ message: 'Missing required field: name_ar' }, { status: 400 });
    }

    const { data, error } = await client
      .from('CountryCityBoundary')
      .update({
        country_name: name_ar,
        // boundary: boundary, // Removed
        // center_point: center_point, // Removed
        // city_name and is_country_level_boundary should not change for a country entry update
      })
      .eq('id', id)
      .is('city_name', null); // Ensure only country-level entry is updated
      // .eq('is_country_level_boundary', true) // Removed
      // .select('id, country_name') // No need to select if just updating
      // .single(); // No need for single if just updating

    if (error) {
      return handleError(error, 'Failed to update country.');
    }

    if (!data) { // Check if data is null, indicating no rows were updated
      return NextResponse.json({ message: 'Country not found or not a country-level entry.' }, { status: 404 });
    }

    // If data is an array, we might want to return the first item or a message
    return NextResponse.json({ id: id, name_ar: name_ar, message: 'Country updated successfully.' });
  } catch (error: unknown) {
    return handleError(error, 'An unexpected error occurred while updating country.');
  }
}

// DELETE /api/countries
export async function DELETE(req: Request) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing country ID' }, { status: 400 });
    }

    // Get the country_name for the given ID
    const { data: countryData, error: fetchError } = await client
      .from('CountryCityBoundary')
      .select('country_name')
      .eq('id', id)
      .is('city_name', null)
      .single();

    if (fetchError) {
      return handleError(fetchError, 'Failed to find country for deletion.');
    }

    if (!countryData) {
      return NextResponse.json({ message: 'Country not found.' }, { status: 404 });
    }

    const countryName = countryData.country_name;

    // Check if there are any cities associated with this country_name
    const { count: cityCount, error: cityCountError } = await client
      .from('CountryCityBoundary')
      .select('id', { count: 'exact' })
      .eq('country_name', countryName) 
      .not('city_name', 'is', null); // Check for entries where city_name is NOT NULL

    if (cityCountError) {
      return handleError(cityCountError, 'Failed to check associated cities.');
    }

    if (cityCount && cityCount > 0) {
      return NextResponse.json({ message: `Cannot delete country '${countryName}' with associated cities. Please delete cities first.` }, { status: 409 });
    }

    // Proceed with deletion if no associated cities
    const { error } = await client
      .from('CountryCityBoundary')
      .delete()
      .eq('id', id)
      .is('city_name', null); // Ensure only country-level entry is deleted

    if (error) {
      return handleError(error, 'Failed to delete country.');
    }

    return NextResponse.json({ message: 'Country deleted successfully.' });
  } catch (error: unknown) {
    return handleError(error, 'An unexpected error occurred while deleting country.');
  }
} 