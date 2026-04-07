import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { savePipelineAsSkill } from '@/domains/zoon-os/functions/pipeline/pipeline-to-skill';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('function_pipelines')
      .select('id, name, description, nodes')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
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
