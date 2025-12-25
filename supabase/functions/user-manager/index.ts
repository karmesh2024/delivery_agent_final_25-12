// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// تعريف ترويسات CORS للسماح بالطلبات من أي مصدر
// في بيئة الإنتاج، قد ترغب في تقييد هذا إلى نطاقات محددة.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // أو نطاق محدد مثل 'https://yourdomain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS', // تحديد الـ Methods المسموح بها
}

// دالة مساعدة لإنشاء عميل Supabase مع صلاحيات الخدمة
// انتبه: يجب التعامل مع SUPABASE_SERVICE_ROLE_KEY بأمان شديد!
const getSupabaseServiceRoleClient = (): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// دالة مساعدة لإنشاء عميل Supabase بناءً على JWT الخاص بالمستخدم
const getSupabaseUserClient = (req: Request): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') // استخدام anonKey للتحقق من JWT

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.')
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  })
}

Deno.serve(async (req: Request) => {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabaseClient = getSupabaseServiceRoleClient()
    const url = new URL(req.url)
    const pathname = url.pathname
    console.log(`Incoming request: ${req.method} ${pathname}`) // Log incoming path

    let resource: string | undefined
    let id: string | undefined
    const pathParts = pathname.split('/').filter(part => part !== ''); // Remove empty parts

    // Check if running in Supabase environment (path likely starts /functions/v1/function-name)
    // Or if running locally (path likely starts directly with resource)
    if (pathParts.length > 0 && pathParts[0] === 'functions' && pathParts[1] === 'v1') {
      // Likely Supabase environment: /functions/v1/user-manager/users/id
      // pathParts would be: ['functions', 'v1', 'user-manager', 'users', 'id']
      resource = pathParts[3] 
      id = pathParts[4]
      console.log(`Supabase environment detected. Resource: ${resource}, ID: ${id}`)
    } else if (pathParts.length > 0) {
      // Likely local Deno environment: /users/id
      // pathParts would be: ['users', 'id']
      resource = pathParts[0]
      id = pathParts[1]
      console.log(`Local Deno environment detected. Resource: ${resource}, ID: ${id}`)
    } else {
      // Root path or unhandled
      resource = undefined
      id = undefined
      console.log("Root path or unhandled path.")
    }

    let responseData: Record<string, unknown> | Record<string, unknown>[] | { message: string } | null = null
    let status = 200

    if (resource === 'users') {
      const method = req.method
      console.log(`Processing /users endpoint. Method: ${method}, ID: ${id}`)

      if (method === 'GET' && !id) {
        // GET /users - List all users
        // TODO: Implement fetching all users from Supabase
        responseData = { message: `GET request to /users received. ID: ${id}. Implement fetching all users.` }
        console.log("Handler: GET /users (all)")
      } else if (method === 'GET' && id) {
        // GET /users/:id - Get a specific user
        // TODO: Implement fetching a specific user by ID from Supabase
        responseData = { message: `GET request to /users received. ID: ${id}. Implement fetching user by ID.` }
        console.log(`Handler: GET /users/${id}`)
      } else if (method === 'POST' && !id) {
        // POST /users - Create a new user
        // TODO: Implement creating a new user in Supabase
        // const body = await req.json() // Example: get request body
        responseData = { message: 'POST request to /users received. Implement creating user.' }
        console.log("Handler: POST /users")
      } else if (method === 'PUT' && id) {
        // PUT /users/:id - Update a specific user
        // TODO: Implement updating a user in Supabase
        // const body = await req.json()
        responseData = { message: `PUT request to /users/${id} received. Implement updating user.` }
        console.log(`Handler: PUT /users/${id}`)
      } else if (method === 'DELETE' && id) {
        // DELETE /users/:id - Delete a specific user
        // TODO: Implement deleting a user in Supabase
        responseData = { message: `DELETE request to /users/${id} received. Implement deleting user.` }
        console.log(`Handler: DELETE /users/${id}`)
      } else {
        status = 405 // Method Not Allowed
        responseData = { error: `Method ${method} not allowed for the specified /users path or ID combination.` }
        console.log(`Handler: Method ${method} not allowed for /users with ID: ${id}`)
      }
    } else {
      status = 404
      responseData = { error: 'Resource not found. Only /users is supported.' }
      console.log(`Handler: Resource not found (not /users). Detected resource: ${resource}`)
    }
    
    console.log(`Final Response: Status ${status}, Data: ${JSON.stringify(responseData)}`);

    return new Response(JSON.stringify(responseData), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in Edge Function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, // Internal Server Error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/user-manager' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
