import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5';

// تعريف الهيدرز للـ CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS' // التأكد من السماح بـ POST و OPTIONS
};

// دالة للتعامل مع طلبات OPTIONS
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  return null;
}

console.log('admin-reject-payout function up and running!');

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
      status: 405,
    });
  }

  try {
    const { payoutRequestId, adminNotes } = await req.json();

    if (!payoutRequestId) {
      return new Response(
        JSON.stringify({ error: 'Missing payoutRequestId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 } // إضافة corsHeaders
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin privileges - This is a placeholder, you'll need a proper auth mechanism
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error('Authentication error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token or user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 401,
      });
    }

    const adminUserId = userData.user.id; // The admin who is rejecting the request

    // Fetch the payout request details
    const { data: payoutRequest, error: fetchError } = await supabaseClient
      .from('payouts')
      .select('*')
      .eq('id', payoutRequestId)
      .single();

    if (fetchError || !payoutRequest) {
      console.error('Error fetching payout request:', fetchError?.message);
      return new Response(JSON.stringify({ error: 'Payout request not found or error fetching' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 404,
      });
    }

    if (payoutRequest.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Payout request is not pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 400,
      });
    }

    // Update payout request status to 'rejected'
    const { error: updateError } = await supabaseClient
      .from('payout_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: adminUserId,
        admin_notes: adminNotes,
      })
      .eq('id', payoutRequestId);

    if (updateError) {
      console.error('Error rejecting payout request:', updateError.message);
      return new Response(JSON.stringify({ error: `Failed to reject payout request: ${updateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: 'Payout request rejected successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // إضافة corsHeaders
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('General error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
      status: 500,
    });
  }
}); 