import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { savePipelineAsSkill } from '@/domains/zoon-os/functions/pipeline/pipeline-to-skill';

export async function GET() {
  try {
    const pipelines = await (prisma as any).function_pipelines.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        nodes: true
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(pipelines);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { pipeline, createdBy } = data;

    if (!pipeline || !pipeline.name) {
      return NextResponse.json({ error: 'Missing pipeline data' }, { status: 400 });
    }

    const res = await savePipelineAsSkill(pipeline, createdBy || 'system');
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('Error saving pipeline:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
