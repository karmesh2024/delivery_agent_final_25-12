import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Assuming your Supabase client is exported from here

// GET /api/agents/[agentId]/zones
// Fetches assigned geographic zones for a specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId;

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
  }

  // Check if the agent exists in new_profiles_delivery
  let deliveryId = agentId;
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }
    
    // First, try to find the agent directly in new_profiles_delivery
    const { data: deliveryProfile, error: profileError } = await supabase
      .from('new_profiles_delivery')
      .select('id')
      .eq('id', agentId)
      .single();
    
    if (profileError || !deliveryProfile) {
      console.log('Agent not found directly in new_profiles_delivery, checking delivery_boys table');
      
      // If not found directly, check the delivery_boys table and get corresponding new_profiles_delivery ID
      const { data: deliveryBoy, error: deliveryBoyError } = await supabase
        .from('delivery_boys')
        .select('id')
        .eq('id', agentId)
        .single();
      
      if (deliveryBoyError || !deliveryBoy) {
        console.error('Agent not found in any table:', deliveryBoyError || 'No matching records');
        return NextResponse.json(
          { error: 'Agent not found in delivery_boys or new_profiles_delivery tables' }, 
          { status: 404 }
        );
      }
      
      deliveryId = deliveryBoy.id;
    }
    
    console.log('Using delivery ID for zone assignment:', deliveryId);
  } catch (error) {
    console.error('Error checking agent profile:', error);
    // Continue with original agentId as fallback
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }
    const { data, error } = await supabase
      .from('delivery_zones')
      .select(`
        id,
        is_primary,
        geographic_zone:geographic_zone_id (
          id,
          name,
          area_polygon,
          center_point
        )
      `)
      .eq('delivery_id', deliveryId);

    if (error) {
      console.error('Error fetching agent zones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Server error fetching agent zones:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT /api/agents/[agentId]/zones
// Updates assigned geographic zones for a specific agent
interface ZoneAssignment {
  zone_id: string;
  is_primary: boolean;
}
export async function PUT(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId;
  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
  }

  // Check if the agent exists in new_profiles_delivery
  let deliveryId = agentId;
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }
    
    // First, try to find the agent directly in new_profiles_delivery
    const { data: deliveryProfile, error: profileError } = await supabase
      .from('new_profiles_delivery')
      .select('id')
      .eq('id', agentId)
      .single();
    
    if (profileError || !deliveryProfile) {
      console.log('Agent not found directly in new_profiles_delivery, checking delivery_boys table');
      
      // If not found directly, check the delivery_boys table and get corresponding new_profiles_delivery ID
      const { data: deliveryBoy, error: deliveryBoyError } = await supabase
        .from('delivery_boys')
        .select('id')
        .eq('id', agentId)
        .single();
      
      if (deliveryBoyError || !deliveryBoy) {
        console.error('Agent not found in any table:', deliveryBoyError || 'No matching records');
        return NextResponse.json(
          { error: 'Agent not found in delivery_boys or new_profiles_delivery tables' }, 
          { status: 404 }
        );
      }
      
      deliveryId = deliveryBoy.id;
    }
    
    console.log('Using delivery ID for zone assignment:', deliveryId);
  } catch (error) {
    console.error('Error checking agent profile:', error);
    // Continue with original agentId as fallback
  }

  let assignments: ZoneAssignment[];
  try {
    assignments = await request.json();
    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Invalid request body, expected an array of zone assignments' }, { status: 400 });
    }
    const primaryAssignments = assignments.filter(a => a.is_primary);
    if (primaryAssignments.length > 1) {
      return NextResponse.json({ error: 'An agent can only have one primary zone' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // Begin transaction
    // For simplicity, Supabase Edge Functions might not support transactions directly in this way.
    // We'll perform operations sequentially. A more robust solution might involve a database function (stored procedure).

    // 1. Delete existing assignments for the agent
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }
    const { error: deleteError } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('delivery_id', deliveryId);

    if (deleteError) {
      console.error('Error deleting old agent zones:', deleteError);
      throw new Error(`Failed to delete old assignments: ${deleteError.message}`);
    }

    // 2. Insert new assignments if any
    if (assignments.length > 0) {
      // 2.1 Get zone names for each geographic zone ID
      const zoneIds = assignments.map(a => a.zone_id);
      const { data: zoneData, error: zoneError } = await supabase
        .from('geographic_zones')
        .select('id, name')
        .in('id', zoneIds);
      
      if (zoneError) {
        console.error('Error fetching zone names:', zoneError);
        throw new Error(`Failed to fetch zone names: ${zoneError.message}`);
      }
      
      // 2.2 Create a map of zone IDs to zone names
      const zoneNames: Record<string, string> = {};
      if (zoneData) {
        zoneData.forEach(zone => {
          zoneNames[zone.id] = zone.name;
        });
      }

      // 2.3 Insert assignments with zone names
      const newAssignmentsData = assignments.map(assignment => ({
        delivery_id: deliveryId,
        geographic_zone_id: assignment.zone_id,
        zone_name: zoneNames[assignment.zone_id] || 'Unknown Zone',
        is_primary: assignment.is_primary,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('delivery_zones')
        .insert(newAssignmentsData);

      if (insertError) {
        console.error('Error inserting new agent zones:', insertError);
        // Attempt to rollback or handle partial update issues might be complex here without transactions
        // For now, we'll report the error.
        // The unique constraint on (delivery_id) WHERE is_primary = TRUE should prevent multiple primary zones.
        throw new Error(`Failed to insert new assignments: ${insertError.message}`);
      }
    }

    return NextResponse.json({ message: 'Agent zones updated successfully' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Server error updating agent zones:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
} 