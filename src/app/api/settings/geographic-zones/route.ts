import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase'; // استبدال العميل العام
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // استخدام عميل الخادم الخاص

/**
 * GET - Retrieve all geographic zones or a specific zone by ID
 */
export async function GET(request: Request) {
  try {
    // استخدام supabaseAdmin لعمليات القراءة لتجاوز RLS إذا لزم الأمر
    // أو إذا كان هناك شك في سياق العميل العام
    if (!supabaseAdmin) { // Check supabaseAdmin directly
      return new NextResponse(
        JSON.stringify({ error: 'Supabase admin client not initialized for GET' }),
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const city = url.searchParams.get('city'); // New: Get city from query params
    const country = url.searchParams.get('country'); // New: Get country from query params

    if (id) {
      const { data, error } = await supabaseAdmin // Use supabaseAdmin
        .from('geographic_zones')
        .select('*, city, country, description') // Ensure description is selected
        .eq('id', id)
        .single();
      // ... باقي كود GET للمعرّف
      if (error) {
        console.error('Error fetching geographic zone:', error);
        return new NextResponse(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        );
      }

      if (!data) {
        return new NextResponse(
          JSON.stringify({ error: 'Zone not found' }),
          { status: 404 }
        );
      }

      const processedData = {
        ...data,
        area_polygon: typeof data.area_polygon === 'string'
          ? JSON.parse(data.area_polygon)
          : data.area_polygon,
        center_point: typeof data.center_point === 'string'
          ? JSON.parse(data.center_point)
          : data.center_point
      };
      return NextResponse.json(processedData);
    } else {
      let query = supabaseAdmin
        .from('geographic_zones')
        .select('id, name, is_active, city, country, description') // Include description
        .eq('is_active', true);

      if (city) {
        query = query.ilike('city', `%${city}%`); // Case-insensitive like search for city
      }
      if (country) {
        query = query.ilike('country', `%${country}%`); // Case-insensitive like search for country
      }
      
      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching geographic zones:', error);
        return new NextResponse(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        );
      }

      // No need to process polygon/point if not selected or if frontend handles WKB/GeoJSON directly
      // If they were selected and needed parsing, ensure correct parsing method for WKB (not JSON.parse)
      return NextResponse.json(data || []); // Return data directly, or an empty array if null
    }
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new geographic zone
 */
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) { // استخدام supabaseAdmin هنا
      return new NextResponse(
        JSON.stringify({ error: 'Supabase admin client not initialized' }),
        { status: 500 }
      );
    }

    const zoneData = await request.json();
    if (!zoneData.name || !zoneData.area_polygon || !zoneData.center_point) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required fields: name, area_polygon, and center_point are required' 
        }),
        { status: 400 }
      );
    }

    const preparedData: Record<string, unknown> = {
      name: zoneData.name,
      area_polygon: zoneData.area_polygon,
      center_point: zoneData.center_point,
      active_status: zoneData.is_active !== undefined ? zoneData.is_active : true,
      population_density: zoneData.population_density,
      waste_generation_rate: zoneData.waste_generation_rate,
      agent_coverage: zoneData.agent_coverage
    };

    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        delete preparedData[key];
      }
    });

    console.log("Prepared data for Supabase insertion (using admin client):", preparedData);

    const { data, error } = await supabaseAdmin // استخدام supabaseAdmin هنا
      .from('geographic_zones')
      .insert([preparedData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating geographic zone (using admin client): ', error);
      // توفير المزيد من التفاصيل في الاستجابة إذا كان الخطأ من Supabase
      const statusCode = error.code && !isNaN(parseInt(error.code)) ? parseInt(error.code) : 500;
      return new NextResponse(
        JSON.stringify({ 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }),
        { status: statusCode > 400 && statusCode < 600 ? statusCode : 500 } // التأكد من أن الكود صالح
      );
    }
    
    const processedData = {
      ...data,
      area_polygon: typeof data.area_polygon === 'string' 
        ? JSON.parse(data.area_polygon) 
        : data.area_polygon,
      center_point: typeof data.center_point === 'string' 
        ? JSON.parse(data.center_point) 
        : data.center_point
    };
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Unexpected error in POST (admin client):', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing geographic zone
 */
export async function PUT(request: Request) {
  try {
    if (!supabaseAdmin) { // استخدام supabaseAdmin هنا
      return new NextResponse(
        JSON.stringify({ error: 'Supabase admin client not initialized' }),
        { status: 500 }
      );
    }

    const { id, ...updateData } = await request.json();
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Zone ID is required' }),
        { status: 400 }
      );
    }

    // لا حاجة لإضافة updated_at يدويًا إذا كان عمود updated_at في قاعدة البيانات
    // مهيأ ليتم تحديثه تلقائيًا بواسطة trigger (DEFAULT now() or ON UPDATE now())
    // إذا لم يكن كذلك، يمكنك إلغاء تعليق السطر التالي أو إدارته في قاعدة البيانات
    // updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin // استخدام supabaseAdmin هنا
      .from('geographic_zones')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating geographic zone (admin client):', error);
      const statusCode = error.code && !isNaN(parseInt(error.code)) ? parseInt(error.code) : 500;
      return new NextResponse(
        JSON.stringify({ 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
         }),
        { status: statusCode > 400 && statusCode < 600 ? statusCode : 500 }
      );
    }

    const processedData = data ? {
      ...data,
      area_polygon: typeof data.area_polygon === 'string' 
        ? JSON.parse(data.area_polygon) 
        : data.area_polygon,
      center_point: typeof data.center_point === 'string' 
        ? JSON.parse(data.center_point) 
        : data.center_point
    } : null;
    return NextResponse.json(processedData || { success: true });
  } catch (error) {
    console.error('Unexpected error in PUT (admin client):', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a geographic zone
 */
export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) { // استخدام supabaseAdmin هنا
      return new NextResponse(
        JSON.stringify({ error: 'Supabase admin client not initialized' }),
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Zone ID is required' }),
        { status: 400 }
      );
    }

    // لا حاجة لحذف المراجع يدويًا هنا إذا كانت هناك قيود ON DELETE CASCADE
    // أو إذا كنت تريد التعامل معها بشكل منفصل. الكود الأصلي كان يحاول ذلك.
    // await supabaseAdmin
    //   .from('delivery_zones')
    //   .update({ geographic_zone_id: null })
    //   .eq('geographic_zone_id', id);

    const { error } = await supabaseAdmin // استخدام supabaseAdmin هنا
      .from('geographic_zones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting geographic zone (admin client):', error);
      const statusCode = error.code && !isNaN(parseInt(error.code)) ? parseInt(error.code) : 500;
      return new NextResponse(
        JSON.stringify({ 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
         }),
        { status: statusCode > 400 && statusCode < 600 ? statusCode : 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE (admin client):', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
} 