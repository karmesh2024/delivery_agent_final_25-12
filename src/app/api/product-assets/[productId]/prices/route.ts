export async function POST(req: Request) {
  // For now, just return a success response to test the route
  return new Response(JSON.stringify({ message: 'Product prices update endpoint hit successfully', data: {} }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 