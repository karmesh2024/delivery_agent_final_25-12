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

console.log('admin-approve-payout function up and running!');

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
    const { payoutRequestId, amountApproved, adminNotes } = await req.json();

    if (!payoutRequestId || amountApproved === undefined || amountApproved === null) {
      return new Response(
        JSON.stringify({ error: 'Missing payoutRequestId or amountApproved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 } // إضافة corsHeaders
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin privileges - This is a placeholder, you'll need a proper auth mechanism
    // For example, you might check a JWT token or query your 'admins' table
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

    const adminUserId = userData.user.id; // The admin who is approving the request

    // Fetch the payout request details
    const { data: payoutRequest, error: fetchError } = await supabaseClient
      .from('payouts')
      .select('*') // Select all payout request fields without wallet details expansion
      .eq('id', payoutRequestId)
      .single();

    if (fetchError || !payoutRequest) {
      console.error('Error fetching payout request:', fetchError?.message);
      return new Response(JSON.stringify({ error: 'Payout request not found or error fetching' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 404,
      });
    }

    if (payoutRequest.status !== 'PENDING_APPROVAL') {
      return new Response(JSON.stringify({ error: 'Payout request is not pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 400,
      });
    }

    const wallet = payoutRequest.wallet_id; // Wallet details
    if (!wallet) {
      return new Response(JSON.stringify({ error: 'Associated wallet not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 404,
      });
    }

    // Start a transaction for atomicity
    const { error: updateError } = await supabaseClient.rpc('approve_payout_request_transaction', {
      p_request_id: payoutRequestId,
      p_admin_id: adminUserId,
      p_amount_approved: amountApproved,
      p_admin_notes: adminNotes,
      p_wallet_id: wallet.id,
      p_wallet_balance_change: amountApproved * -1, // Deduct the approved amount from wallet balance
      p_transaction_type: 'PAYOUT_APPROVED', // Define this type in your transactions table
      p_transaction_currency: payoutRequest.currency,
      p_transaction_details: JSON.stringify({ payout_request_id: payoutRequestId, admin_notes: adminNotes }),
    });

    if (updateError) {
      console.error('Error during transaction:', updateError.message);
      return new Response(JSON.stringify({ error: `Transaction failed: ${updateError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // إضافة corsHeaders
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: 'Payout request approved and wallet updated successfully' }),
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