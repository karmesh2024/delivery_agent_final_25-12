import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Zap,
  ArrowRight
} from 'lucide-react';

export default async function TracePage() {
  const { data: traces, error } = await supabase!
    .from('zoon_traces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return <div className="p-10 text-red-500">Error loading traces: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Activity className="text-primary h-8 w-8" />
          Zoon Swarm Trace Monitor
        </h1>
        <p className="text-slate-500">مراقبة حية لخطوات معالجة السرب وتحليل الأداء والقرارات الذكية.</p>
      </div>

      <div className="grid gap-6">
        {traces?.map((trace) => (
          <Card key={trace.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="font-mono text-xs bg-white">
                    Session: {trace.session_id.slice(-8)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(trace.created_at).toLocaleString('ar-EG')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {trace.duration_ms ? `${(trace.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                  </div>
                  {trace.had_errors ? (
                    <Badge variant="destructive" className="flex gap-1 items-center">
                      <AlertCircle className="h-3 w-3" /> خطأ
                    </Badge>
                  ) : trace.was_approved ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 flex gap-1 items-center">
                      <CheckCircle2 className="h-3 w-3" /> معتمد
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 flex gap-1 items-center">
                      <Clock className="h-3 w-3" /> HITL
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 mb-6">
                {trace.agents_invoked?.map((agent: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {agent}
                    </div>
                    {idx < trace.agents_invoked.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 border-r-4 border-primary pr-3">Execution Steps:</h4>
                <div className="grid gap-3">
                  {trace.steps_json?.map((step: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 text-sm flex justify-between items-start border border-slate-100">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                           <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-600 font-mono">#{idx+1}</span>
                           {step.agent.toUpperCase()}
                        </div>
                        <div className="text-slate-600">{step.action}</div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                         {new Date(step.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {traces?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">لا توجد سجلات تتبع حالياً. ابدأ محادثة مع Zoon OS لتظهر الخطوات هنا.</p>
          </div>
        )}
      </div>
    </div>
  );
}
