// src/app/api/zoon/functions/route.ts
import { NextResponse } from 'next/server';
import { FUNCTION_NODES } from '@/domains/zoon-os/functions/registry';

export async function GET() {
  try {
    // نرسل العُقد المسجلة في النظام كقائمة
    const functions = Object.values(FUNCTION_NODES).map(node => ({
      id: node.id,
      label: node.label,
      description: node.description,
      category: node.category,
      icon: node.icon,
      params: node.params,
      handler: node.handler
    }));

    return NextResponse.json(functions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
