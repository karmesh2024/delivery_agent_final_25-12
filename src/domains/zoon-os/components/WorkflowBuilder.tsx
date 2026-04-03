"use client";

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { FiSave, FiPlay, FiTool, FiBox, FiList } from 'react-icons/fi';

let id = 0;
const getId = () => `node_${id++}`;

export default function WorkflowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [pipelineName, setPipelineName] = useState('new_pipeline');
  const [pipelineLabel, setPipelineLabel] = useState('مسار جديد');
  const [pipelineDesc, setPipelineDesc] = useState('وصف المسار...');

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: 'default', // Using default ReactFlow node for now
        position,
        data: { label: `${label} (${type})`, type, params: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = async () => {
    // Transform ReactFlow nodes/edges into our Pipeline format
    if (nodes.length === 0) {
      toast.error('المسار فارغ! لا توجد عُقد للحفظ.');
      return;
    }

    // Sort nodes basic topological or just linear based on edges
    // For simplicity, just map them directly (assuming linear flow for now)
    const pipelineNodes = nodes.map((n) => ({
      nodeId: n.data.type, // e.g., 'financial-calc-agent-profit'
      params: n.data.params || {},
      label: n.data.label
    }));

    const pipelineData = {
      name: pipelineName,
      label: pipelineLabel,
      description: pipelineDesc,
      steps: pipelineNodes,
      inputParams: [], // can be extended to capture dynamic inputs
      icon: '⚡'
    };

    try {
      const resp = await fetch('/api/zoon/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: pipelineData, createdBy: 'admin' }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      
      const resData = await resp.json();
      toast.success('تم بناء الـ Pipeline وحفظ المهارة بنجاح!');
      console.log('Saved:', resData);
    } catch (err: any) {
      console.error(err);
      toast.error('أثناء الحفظ: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-50 border rounded-3xl overflow-hidden" dir="rtl">
      {/* الأداة العلوية */}
      <div className="p-4 bg-white border-b flex justify-between items-center z-10 shadow-sm">
        <div className="flex gap-4 items-center w-1/2">
          <Input 
            value={pipelineLabel} 
            onChange={e => setPipelineLabel(e.target.value)} 
            className="font-black text-lg h-10 border-indigo-100 focus-visible:ring-indigo-500" 
            placeholder="اسم المسار بالعربي..." 
          />
          <Input 
            value={pipelineName} 
            onChange={e => setPipelineName(e.target.value)} 
            className="font-mono text-sm h-10 border-indigo-100 bg-slate-50" 
            placeholder="الاسم البرمجي (unique_name)" 
            dir="ltr"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 font-bold"><FiPlay /> تجربة</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-black">
            <FiSave /> استخراج (Deploy)
          </Button>
        </div>
      </div>

      <div className="flex flex-1 h-full overflow-hidden">
        {/* شريط الأدوات (Sidebar) */}
        <div className="w-1/4 max-w-[280px] bg-white border-l p-4 overflow-y-auto z-10 shadow-lg">
          <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
             <FiBox className="text-indigo-600" /> العُقد المتاحة (Nodes)
          </h3>
          <p className="text-xs text-slate-400 mb-4">اسحب العقدة وأفلتها في اللوحة</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">التحكم</Label>
              <SidebarNode type="start" label="البداية" color="bg-emerald-100 text-emerald-700 border-emerald-300" />
              <SidebarNode type="end" label="النهاية" color="bg-red-100 text-red-700 border-red-300" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">مهام مالية</Label>
              <SidebarNode type="financial-calc-agent-profit" label="حساب ربح الوكيل" color="bg-blue-100 text-blue-700 border-blue-300" />
              <SidebarNode type="financial-calc-earnings" label="حساب أرباح مندوب" color="bg-indigo-100 text-indigo-700 border-indigo-300" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">مهام إضافية (أمثلة)</Label>
              <SidebarNode type="send-telegram" label="إرسال رسالة تليجرام" color="bg-cyan-100 text-cyan-700 border-cyan-300" />
              <SidebarNode type="export-pdf" label="استخراج PDF" color="bg-purple-100 text-purple-700 border-purple-300" />
            </div>
          </div>
        </div>

        {/* مساحة العمل (Canvas) */}
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              dir="ltr"
            >
              <Background color="#ccc" gap={16} />
              <Controls className="!right-4 !left-auto" />
              <MiniMap className="!right-4 !left-auto !bottom-4 !top-auto !border-2 !border-slate-200 !rounded-xl" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

// مكون العقدة في الشريط الجانبي
function SidebarNode({ type, label, color }: { type: string; label: string; color: string }) {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', nodeLabel);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`p-3 border-2 rounded-xl text-sm font-bold cursor-grab active:cursor-grabbing flex items-center justify-center transition-all hover:shadow-md ${color}`}
      onDragStart={(event) => onDragStart(event, type, label)}
      draggable
    >
      {label}
    </div>
  );
}
