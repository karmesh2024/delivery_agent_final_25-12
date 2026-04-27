import { NextResponse } from 'next/server';

/**
 * API Route وهمي لاختبار أمن الـ Middleware
 * GET /api/protected-resource
 */
export async function GET() {
  return NextResponse.json({ message: 'Success: This is a protected resource' });
}
