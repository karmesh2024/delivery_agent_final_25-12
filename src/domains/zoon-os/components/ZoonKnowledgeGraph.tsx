'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/shared/ui/button';
import { FiRefreshCcw, FiCpu, FiInfo, FiBox, FiActivity } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const supabase = createClient();

interface Triple {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export default function ZoonKnowledgeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('zoon_knowledge_graph')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const rawTriples: Triple[] = data || [];
      
      const nodeSet = new Set<string>();
      const generatedNodes: any[] = [];
      const generatedEdges: any[] = [];

      // معالجة العقد والروابط
      rawTriples.forEach((triple, idx) => {
        // إضافة العقد (Subject & Object)
        [triple.subject, triple.object].forEach((label) => {
          if (!nodeSet.has(label)) {
            nodeSet.add(label);
            generatedNodes.push({
              id: label,
              data: { label: label },
              position: { 
                x: Math.random() * 800 - 400, 
                y: Math.random() * 800 - 400 
              },
              style: { 
                background: label === triple.subject ? '#6366f1' : '#f8fafc',
                color: label === triple.subject ? '#fff' : '#1e293b',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: 'bold',
                border: '2px solid #e2e8f0',
                fontSize: '12px',
                minWidth: '100px',
                textAlign: 'center'
              }
            });
          }
        });

        // إضافة الروابط
        generatedEdges.push({
          id: `e-${triple.id}-${idx}`,
          source: triple.subject,
          target: triple.object,
          label: triple.predicate,
          labelStyle: { fill: '#6366f1', fontWeight: 700, fontSize: 10 },
          animated: triple.confidence > 0.8,
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#cbd5e1',
          },
        });
      });

      setNodes(generatedNodes);
      setEdges(generatedEdges);
    } catch (error: any) {
      toast.error('فشل جلب الشبكة المعرفية: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="w-full h-[700px] relative bg-slate-50/50 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(n) => n.style?.background as string || '#eee'} 
          maskColor="rgba(255, 255, 255, 0.7)"
          style={{ borderRadius: '12px', overflow: 'hidden' }}
        />
        
        <Panel position="top-right" className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border shadow-lg m-4 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <FiCpu className={loading ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">قصر ذاكرة Zoon</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">مركز الوعي العلائقي</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
             <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                <FiBox className="text-indigo-600" /> {nodes.length} كيانات
             </div>
             <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                <FiActivity className="text-indigo-600" /> {edges.length} روابط
             </div>
          </div>

          <Button 
            onClick={fetchGraph} 
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-black text-white py-2 rounded-xl flex items-center justify-center gap-2 font-black transition-all"
          >
            <FiRefreshCcw className={loading ? 'animate-spin' : ''} />
            تحديث الشبكة
          </Button>

          <p className="text-[9px] text-slate-400 font-medium leading-tight max-w-[200px]">
            <FiInfo className="inline ml-1" />
            هذه الخريطة تعرض العلاقات التي اكتشفها الوكيل يدوياً أو آلياً من محادثاتك. يمكنك تحريك العقد لتغيير ترتيب القصر.
          </p>
        </Panel>

        <Panel position="bottom-left" className="m-4">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 text-xs font-black flex items-center gap-2 shadow-sm"
           >
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             سيادة الذاكرة مفعلة: v4.0 Active
           </motion.div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
