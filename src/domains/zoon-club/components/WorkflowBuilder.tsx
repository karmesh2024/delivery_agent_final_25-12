'use client';

import React, { useState, useCallback, useRef, DragEvent, useEffect, useMemo } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  Edge, 
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Handle,
  Position,
  ReactFlowInstance,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  FiPlay, FiSave, FiPlus, FiCpu, FiMessageCircle, FiImage, 
  FiSettings, FiExternalLink, FiRefreshCcw, FiCheckCircle, FiX, 
  FiList, FiEdit3, FiSearch, FiCheck, FiActivity, FiZap,
  FiSend, FiFilter, FiGitMerge, FiRepeat, FiDatabase, FiStar,
  FiTrash2, FiChevronDown, FiChevronLeft
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// ==================================================
// 📦 مكتبة أنواع العُقد (Node Catalog)
// ==================================================
const nodeCategories = [
  {
    name: 'مصادر الدخل',
    icon: '📥',
    color: 'emerald',
    nodes: [
      { type: 'googleNews', label: 'Google News', icon: '📰', description: 'جلب أخبار من Google News RSS', color: 'emerald' },
      { type: 'duckduckgoNews', label: 'DuckDuckGo', icon: '🦆', description: 'جلب أخبار من DuckDuckGo', color: 'emerald' },
      { type: 'telegramSearch', label: 'Telegram Search', icon: '✈️', description: 'البحث في قنوات تليجرام', color: 'sky' },
      { type: 'facebookPages', label: 'Facebook Pages', icon: '📘', description: 'جلب منشورات صفحات فيسبوك', color: 'blue' },
    ]
  },
  {
    name: 'معالجة AI',
    icon: '🤖',
    color: 'indigo',
    nodes: [
      { type: 'geminiGenerator', label: 'Gemini Generator', icon: '✨', description: 'توليد محتوى بالذكاء الاصطناعي', color: 'indigo' },
      { type: 'contentEnhancer', label: 'Content Enhancer', icon: '⚡', description: 'تحسين جودة المحتوى', color: 'purple' },
      { type: 'psychologyAnalyzer', label: 'Psychology Analyzer', icon: '🧠', description: 'تحليل نفسي للمحتوى', color: 'pink' },
      { type: 'translator', label: 'Translator', icon: '🌐', description: 'ترجمة النصوص', color: 'violet' },
    ]
  },
  {
    name: 'الوسائط',
    icon: '🖼️',
    color: 'amber',
    nodes: [
      { type: 'imageSelector', label: 'Image Selector', icon: '🎨', description: 'اختيار صورة مناسبة', color: 'amber' },
    ]
  },
  {
    name: 'المنطق',
    icon: '🔄',
    color: 'slate',
    nodes: [
      { type: 'ifElse', label: 'If/Else', icon: '🔀', description: 'شرط منطقي', color: 'slate' },
      { type: 'filter', label: 'Filter', icon: '🔍', description: 'تصفية البيانات', color: 'slate' },
      { type: 'merge', label: 'Merge', icon: '🔗', description: 'دمج مصادر متعددة', color: 'slate' },
    ]
  },
  {
    name: 'المخرجات',
    icon: '📤',
    color: 'orange',
    nodes: [
      { type: 'supabaseStorage', label: 'طابور المراجعة', icon: '💾', description: 'حفظ في طابور Content Studio', color: 'amber' },
      { type: 'telegramPublisher', label: 'Telegram Publisher', icon: '📣', description: 'نشر في قناة تليجرام', color: 'sky' },
      { type: 'facebookPublisher', label: 'Facebook Publisher', icon: '📘', description: 'نشر في صفحة فيسبوك', color: 'blue' },
    ]
  }
];

// ==================================================
// 🎨 مكونات العُقد المخصصة (Custom Node Components)
// ==================================================

// عُقدة عامة قابلة للتخصيص
const GenericNode = ({ data, id }: any) => {
  const colorMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    emerald: { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-900', icon: 'text-emerald-600' },
    sky: { border: 'border-sky-400', bg: 'bg-sky-50', text: 'text-sky-900', icon: 'text-sky-600' },
    blue: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
    indigo: { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'text-indigo-600' },
    purple: { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-900', icon: 'text-purple-600' },
    pink: { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-900', icon: 'text-pink-600' },
    violet: { border: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-900', icon: 'text-violet-600' },
    amber: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-900', icon: 'text-amber-600' },
    orange: { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600' },
    slate: { border: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-900', icon: 'text-slate-600' },
  };

  const c = colorMap[data.color || 'slate'] || colorMap.slate;
  const isLoading = data.status === 'loading';
  const isSuccess = data.status === 'success';

  return (
    <div className={`bg-white border-2 ${isLoading ? c.border + ' animate-pulse' : isSuccess ? c.border : 'border-slate-200'} rounded-xl p-0 shadow-lg min-w-[180px] max-w-[220px] cursor-pointer transition-all hover:shadow-xl`}>
      <Handle type="target" position={Position.Top} className={`w-3 h-3 ${isSuccess ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      <div className={`flex items-center gap-2 ${c.bg} p-2.5 rounded-t-[10px] border-b`}>
        <span className="text-lg">{data.icon || '⚙️'}</span>
        <span className={`text-[11px] font-black ${c.text} flex-1 truncate`}>{data.label}</span>
        {isSuccess && <FiCheckCircle className="text-emerald-500 shrink-0" size={14} />}
        {isLoading && <FiRefreshCcw className="text-indigo-500 animate-spin shrink-0" size={14} />}
      </div>
      <div className="p-2.5">
        <p className="text-[9px] text-slate-500 leading-relaxed">{data.description || ''}</p>
        {data.resultCount !== undefined && (
          <div className="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-center">
            {data.resultCount} نتيجة
          </div>
        )}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(data.config).slice(0, 2).map(([key, val]: any) => (
              <span key={key} className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border">
                {key}: {typeof val === 'object' ? JSON.stringify(val).slice(0, 15) : String(val).slice(0, 15)}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 ${isSuccess ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    </div>
  );
};

// ملاحظة: يتم تعريف nodeTypes داخل المكون باستخدام useMemo لمنع تحذيرات React Flow
const edgeTypes = {}; // كائن فارغ ومستقر لوصلات العُقد

// عُقد افتراضية للبداية
const defaultNodes: Node[] = [
  { 
    id: 'node-1', type: 'googleNews', 
    data: { label: 'جلب أخبار', icon: '📰', description: 'Google News + DuckDuckGo', color: 'emerald', config: { keywords: ['الإسكندرية', 'محرم بك'], sourceType: 'all' } }, 
    position: { x: 250, y: 0 } 
  },
  { 
    id: 'node-2', type: 'geminiGenerator', 
    data: { label: 'توليد (Gemini)', icon: '✨', description: 'توليد منشور بأسلوب سكندري', color: 'indigo', config: { style: 'سكندري تفاعلي' } }, 
    position: { x: 250, y: 150 } 
  },
  { 
    id: 'node-3', type: 'supabaseStorage', 
    data: { label: 'طابور المراجعة', icon: '💾', description: 'حفظ في Content Studio Queue', color: 'amber', config: {} }, 
    position: { x: 250, y: 300 } 
  },
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1' } },
  { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#6366f1' } },
];

// ==================================================
// 🏗️ المكون الرئيسي
// ==================================================
function WorkflowBuilderInner({ onPostSaved }: { onPostSaved?: () => void }) {
  const supabase = createClientComponentClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  
  // حالات عامة
  const [executing, setExecuting] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('مصادر الدخل');

  // حالات الأخبار
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [showNewsPanel, setShowNewsPanel] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  // --- آلية المحاولة مرة أخرى لـ Gemini مع تراجع أسي (Exponential Backoff) ---
  const fetchGeminiWithRetry = async (payload: any, retries = 4, initialDelay = 6000): Promise<any> => {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch('/api/ai/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // نجاح العملية
            if (res.ok) {
              const data = await res.json();
              if (data.success) return data;
              throw new Error(data.error || 'خطأ غير معروف في Gemini');
            }
            
            // تجاوز حد الطلبات 429
            if (res.status === 429 && i < retries) {
                const currentDelay = initialDelay * Math.pow(1.6, i); // تزايد: 4s, 6.4s, 10s, 16s...
                toast.error(`⚠️ زحمة طلبات! سأنتظر ${Math.round(currentDelay/1000)} ثوانٍ وسأحاول مجدداً... (${i+1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                continue;
            }

            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `خطأ سيرفر: ${res.status}`);
        } catch (err: any) {
            if (i === retries) throw err;
            console.warn(`🔄 محاولة فاشلة رقم ${i+1}:`, err.message);
            await new Promise(resolve => setTimeout(resolve, initialDelay));
        }
    }
  };


  // تعريف أنواع العُقد بشكل مستقر
  const nodeTypes = useMemo(() => {
    const types: Record<string, React.ComponentType<any>> = {};
    nodeCategories.forEach(cat => {
      cat.nodes.forEach(node => {
        types[node.type] = GenericNode;
      });
    });
    return types;
  }, []);

  const [postEditorModal, setPostEditorModal] = useState<{
    open: boolean;
    content: string;
    imageUrl: string;
    sourceLink: string;
    sourceTitle: string;
    roomId?: string;
  } | null>(null);

  // جلب الغرف المتاحة عند التحميل
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('zoon_rooms').select('id, name_ar, icon').order('display_order', { ascending: true });
      if (data) setAvailableRooms(data);
    };
    fetchRooms();
  }, []);
  const [generatingPost, setGeneratingPost] = useState(false);

  // حالات البحث عن صور
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageSource, setImageSource] = useState('all');

  // سجل التنفيذ
  const [executionLog, setExecutionLog] = useState<Array<{id: string; nodeLabel: string; nodeIcon: string; status: 'running'|'success'|'error'|'info'|'skipped'; message: string; time: string}>>([]);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [showExecutionLog, setShowExecutionLog] = useState(false);
  // بيانات تُمرَّر بين العُقد أثناء التنفيذ
  const pipelineDataRef = useRef<Record<string, any>>({});
  const [savedWorkflows, setSavedWorkflows] = useState<Record<string, {nodes: Node[], edges: Edge[]}>>({});

  useEffect(() => {
    const saved = localStorage.getItem('zoon_workflows');
    if (saved) {
      setSavedWorkflows(JSON.parse(saved));
    }
  }, []);

  const saveCurrentWorkflow = () => {
    const name = prompt('أدخل اسماً لهذا المسار:', `مسار ${new Date().toLocaleDateString('ar-EG')}`);
    if (!name) return;
    
    const newWorkflows = { ...savedWorkflows, [name]: { nodes, edges } };
    setSavedWorkflows(newWorkflows);
    localStorage.setItem('zoon_workflows', JSON.stringify(newWorkflows));
    toast.success('تم حفظ المسار بنجاح 💾');
  };

  const loadWorkflow = (name: string) => {
    const wf = savedWorkflows[name];
    if (wf) {
      setNodes(wf.nodes);
      setEdges(wf.edges);
      toast.success('تم تحميل المسار ✅');
    }
  };

  const clearCanvas = () => {
    if (confirm('هل أنت متأكد من مسح اللوحة بالكامل؟')) {
      setNodes([]);
      setEdges([]);
      toast.success('تم مسح اللوحة');
    }
  };

  // عداد فريد للعُقد
  const nodeIdCounter = useRef(10);
  const newsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showNewsPanel && newsPanelRef.current) {
      newsPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showNewsPanel]);

  // --- ReactFlow Handlers ---
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#6366f1' } }, eds)),
    []
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNode(node);
  }, []);

  // --- Drag & Drop من المكتبة ---
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const nodeDataStr = event.dataTransfer.getData('application/reactflow');
    if (!nodeDataStr || !reactFlowInstance || !reactFlowWrapper.current) return;

    const nodeInfo = JSON.parse(nodeDataStr);
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    nodeIdCounter.current += 1;
    const newNode: Node = {
      id: `node-${nodeIdCounter.current}`,
      type: nodeInfo.type,
      position,
      data: {
        label: nodeInfo.label,
        icon: nodeInfo.icon,
        description: nodeInfo.description,
        color: nodeInfo.color,
        config: {},
      },
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success(`تمت إضافة عُقدة "${nodeInfo.label}" ✅`);
  }, [reactFlowInstance]);

  // --- حذف عُقدة ---
  const deleteNode = (nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setEditingNode(null);
    toast.success('تم حذف العُقدة');
  };

  // --- تحديث إعدادات عُقدة ---
  const updateNodeConfig = (nodeId: string, configUpdate: any) => {
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, config: { ...n.data.config, ...configUpdate } } };
      }
      return n;
    }));
    if (editingNode?.id === nodeId) {
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, ...configUpdate } } } : null);
    }
  };

  // === العمليات الفعلية ===

  // --- 1. جلب الأخبار ---
  const fetchNews = async () => {
    setExecuting(true);
    setSelectedNewsItem(null);
    
    // إيجاد أول عُقدة مصدر
    const sourceNode = nodes.find(n => ['googleNews', 'duckduckgoNews'].includes(n.type || ''));
    if (!sourceNode) {
      toast.error('لا توجد عُقدة مصدر أخبار في المسار');
      setExecuting(false);
      return;
    }

    setNodes(nds => nds.map(n => n.id === sourceNode.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));
    
    const keywords = sourceNode.data.config?.keywords || ['الإسكندرية'];
    const source = sourceNode.data.config?.sourceType || 'all';

    try {
      const newsRes = await fetch('/api/ai/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, source })
      });
      
      const newsData = await newsRes.json();
      const fetchedNews = newsData.news || [];
      
      setNewsList(fetchedNews);
      setShowNewsPanel(true);
      setNodes(nds => nds.map(n => n.id === sourceNode.id ? { ...n, data: { ...n.data, status: 'success', resultCount: fetchedNews.length } } : n));
      toast.success(`تم جلب ${fetchedNews.length} خبر ✅`);

      // جلب صور OG
      fetchedNews.slice(0, 6).forEach(async (news: any, idx: number) => {
        if (!news.thumbnail && news.link) {
          try {
            const metaRes = await fetch('/api/ai/article-meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: news.link })
            });
            const metaData = await metaRes.json();
            if (metaData.success && metaData.image) {
              setNewsList(prev => prev.map((n, i) => i === idx ? { ...n, thumbnail: metaData.image } : n));
            }
          } catch { /* ignore */ }
        }
      });
    } catch (error: any) {
      toast.error('فشل في جلب الأخبار: ' + error.message);
      setNodes(nds => nds.map(n => n.id === sourceNode.id ? { ...n, data: { ...n.data, status: undefined } } : n));
    } finally {
      setExecuting(false);
    }
  };

  // --- 2. توليد منشور ---
  const generateFromSelectedNews = async () => {
    if (!selectedNewsItem) {
      toast.error('اختر خبراً أولاً من القائمة');
      return;
    }
    
    setGeneratingPost(true);
    const aiNode = nodes.find(n => ['geminiGenerator', 'contentEnhancer'].includes(n.type || ''));
    if (aiNode) {
      setNodes(nds => nds.map(n => n.id === aiNode.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));
    }
    
    const styleGoal = aiNode?.data.config?.style || 'أسلوب سكندري تفاعلي';

    try {
      const data = await fetchGeminiWithRetry({
        prompt: `
          أنت مايسترو محتوى لنادي "زوون" في محرم بك - الإسكندرية.
          التوجيه: ${styleGoal}
          اكتب منشوراً فيسبوكياً جذاباً بناءً على الخبر التالي: 
          العنوان: ${selectedNewsItem.title}
          التفاصيل: ${selectedNewsItem.description}
          
          الشروط: أسلوب سكندري دافئ، استخدم 2 Emojis، انهِ بسؤال تفاعلي.
          أهم نقطة: اقترح كلمة بحث بالإنجليزية مناسبة للخبر لجلب صور من Pixabay.

          أعطِ الرد بصيغة JSON فقط:
          { 
            "content": "...",
            "image_search_query": "English keywords here"
          }
        `
      });

      let content = '';
      let aiImageQuery = '';
      
      if (data.parsed && data.parsed.content) {
        content = data.parsed.content;
        aiImageQuery = data.parsed.image_search_query || '';
      } else {
        const rawText = (data.text || '').trim();
        const contentMatch = rawText.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
        const queryMatch = rawText.match(/"image_search_query"\s*:\s*"([^"]+)"/);
        if (contentMatch) {
          content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          aiImageQuery = queryMatch ? queryMatch[1] : '';
        } else {
          content = rawText.replace(/^\s*\{?\s*"content"\s*:\s*"?/i, '').replace(/"?\s*,?\s*"image_search_query"\s*:\s*"[^"]*"\s*\}?\s*$/i, '').replace(/^["'{}\s]+|["'{}\s]+$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        }
      }

      if (aiNode) {
        setNodes(nds => nds.map(n => n.id === aiNode.id ? { ...n, data: { ...n.data, status: 'success' } } : n));
      }

      setPostEditorModal({
        open: true,
        content,
        imageUrl: selectedNewsItem.thumbnail || '',
        sourceLink: selectedNewsItem.link,
        sourceTitle: selectedNewsItem.title,
        roomId: availableRooms[0]?.id
      });

      const sQuery = aiImageQuery || selectedNewsItem.title;
      setImageSearchQuery(sQuery);
      fetchSuggestedImages(sQuery);

    } catch (error: any) {
      toast.error('فشل التوليد: ' + error.message);
      if (aiNode) {
        setNodes(nds => nds.map(n => n.id === aiNode.id ? { ...n, data: { ...n.data, status: undefined } } : n));
      }
    } finally {
      setGeneratingPost(false);
    }
  };

  // --- 3. البحث عن صور ---
  const fetchSuggestedImages = async (query: string) => {
    if (!query) return;
    setSearchingImages(true);
    try {
      const res = await fetch('/api/ai/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source: imageSource })
      });

      if (res.status === 503) {
        console.warn('⚠️ محرك بحث الصور غير متاح حالياً.');
        return;
      }
      
      const data = await res.json();
      if (data.success) setImageSearchResults(data.images);
      else throw new Error(data.error);
    } catch { /* ignore */ } finally {
      setSearchingImages(false);
    }
  };

  // --- 4. حفظ في الطابور ---
  const saveToQueue = async () => {
    if (!postEditorModal) return;
    setGeneratingPost(true);
    try {
      // جلب معرف أول دائرة/غرفة متاحة إذا لم يكن محدداً
      // استخدام الغرفة المختارة من النافذة
      const targetRoomId = postEditorModal.roomId;

      if (!targetRoomId) {
        throw new Error('يرجى اختيار "غرفة" (Room) للحفظ فيها.');
      }

      // 1. البحث عما إذا كان هذا الخبر موجوداً مسبقاً في الطابور
      const { data: existingPost } = await supabase
        .from('zoon_posts_queue')
        .select('id')
        .eq('news_source_url', postEditorModal.sourceLink)
        .maybeSingle();

      const postData = {
        circle_id: targetRoomId,
        content: postEditorModal.content || '',
        post_type: 'news_update',
        image_url: postEditorModal.imageUrl || '',
        news_source_url: postEditorModal.sourceLink || '',
        psychological_analysis: { sentiment: 'positive', source: 'workflow_builder' },
        status: 'draft',
      };

      console.log('🚀 Attempting Clean Save (Delete-then-Insert):', postData.news_source_url);

      // تنظيف النسخ القديمة يدوياً لتجنب التعارض (409) دون الحاجة لـ upsert
      if (postData.news_source_url) {
        await supabase
          .from('zoon_posts_queue')
          .delete()
          .eq('news_source_url', postData.news_source_url);
      }

      const { error } = await supabase
        .from('zoon_posts_queue')
        .insert(postData);
      
      if (error) {
        console.error('❌ Supabase Final Error:', error);
        throw error;
      }
      
      const outputNode = nodes.find(n => ['supabaseStorage'].includes(n.type || ''));
      if (outputNode) {
        setNodes(nds => nds.map(n => n.id === outputNode.id ? { ...n, data: { ...n.data, status: 'success' } } : n));
      }
      toast.success('تم حفظ المنشور في طابور المراجعة بنجاح ✅');
      setPostEditorModal(null);
      
      // 🔄 إخطار الأب لتحديث البيانات (طابور المراجعة)
      if (onPostSaved) onPostSaved();
    } catch (error: any) {
      console.error('📋 Full Error Context:', error);
      const detail = error.details || error.hint || '';
      toast.error(`فشل في الحفظ: ${error.message} ${detail}`);
    } finally {
      setGeneratingPost(false);
    }
  };

  // ==================================================
  // 🚀 محرك تشغيل المسار الكامل (Workflow Engine)
  // ==================================================
  const logCounter = useRef(0);
  const addLog = (nodeLabel: string, nodeIcon: string, status: 'running'|'success'|'error'|'info'|'skipped', message: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logCounter.current += 1;
    // استخدام مزيج من الوقت والعداد لضمان التفرد التام
    const uniqueId = `${Date.now()}-${logCounter.current}`;
    setExecutionLog(prev => [...prev, { id: uniqueId, nodeLabel, nodeIcon, status, message, time }]);
  };

  // ترتيب العُقد طوبولوجياً (Topological Sort)
  const getExecutionOrder = (): Node[] => {
    const nodeMap = new Map<string, Node>();
    nodes.forEach(n => nodeMap.set(n.id, n));
    
    // حساب الـ in-degree لكل عُقدة
    const inDegree = new Map<string, number>();
    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // BFS (Kahn's Algorithm)
    const queue: string[] = [];
    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });
    
    const sorted: Node[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const node = nodeMap.get(curr);
      if (node) sorted.push(node);
      edges.filter(e => e.source === curr).forEach(e => {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) - 1);
        if (inDegree.get(e.target) === 0) queue.push(e.target);
      });
    }
    return sorted;
  };

  // تنفيذ عُقدة واحدة
  const executeNodeLogic = async (node: Node): Promise<any> => {
    const config = node.data.config || {};
    const nodeType = node.type || '';

    // --- مصادر الأخبار ---
    if (['googleNews', 'duckduckgoNews'].includes(nodeType)) {
      const keywords = config.keywords || ['الإسكندرية'];
      const source = config.sourceType || 'all';
      const newsRes = await fetch('/api/ai/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, source })
      });
      const newsData = await newsRes.json();
      const fetchedNews = (newsData.news || []).map((n: any) => ({
        ...n,
        description: n.description || n.title || '',
        relevance_score: n.relevance_score || 8
      }));
      setNewsList(fetchedNews);
      setShowNewsPanel(true);
      // جلب صور OG للأخبار الأولى
      fetchedNews.slice(0, 6).forEach(async (news: any, idx: number) => {
        if (!news.thumbnail && news.link) {
          try {
            const metaRes = await fetch('/api/ai/article-meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: news.link }) });
            const metaData = await metaRes.json();
            if (metaData.success && metaData.image) setNewsList(prev => prev.map((n, i) => i === idx ? { ...n, thumbnail: metaData.image } : n));
          } catch { /* ignore */ }
        }
      });
      return { type: 'news', news: fetchedNews, count: fetchedNews.length };
    }

    // --- Telegram Search ---
    if (nodeType === 'telegramSearch') {
      return { type: 'telegram_search_pending', message: 'يتطلب إعداد TELEGRAM_BOT_TOKEN و TELEGRAM_API_ID في .env.local', channels: config.channels || [], keywords: config.keywords || [] };
    }

    // --- Facebook Pages ---
    if (nodeType === 'facebookPages') {
      const userToken = config.accessToken;
      const pageId = config.pages?.[0] || config.pageId;

      if (!userToken) return { type: 'info', message: 'الصق Facebook Access Token في إعدادات العُقدة أولاً' };
      
      // محاولة العثور على توكن الصفحة (Page Token) إذا كان متاحاً من الاختبار
      let activeToken = userToken;
      if (pageId && config.connectedPages) {
        const pageInfo = config.connectedPages.find((p: any) => p.id === pageId);
        if (pageInfo?.access_token) {
          activeToken = pageInfo.access_token;
        }
      }

      try {
        const endpoint = pageId ? `${pageId}/posts?fields=message,created_time,id,full_picture,permalink_url` : 'me/accounts';
        
        const res = await fetch('/api/integrations/facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, accessToken: activeToken })
        });
        const data = await res.json();
        if (data.error) return { type: 'error', message: 'خطأ في جلب البيانات: ' + data.error.message };

        if (pageId) {
          const posts = data.data || [];
          // تحويل المنشورات لتنسيق يشبه الأخبار لسهولة العرض
          const formattedPosts = posts.map((p: any) => ({
            id: p.id,
            title: p.message ? (p.message.substring(0, 100) + '...') : 'منشور بدون نص',
            description: p.message || '',
            link: p.permalink_url || `https://facebook.com/${p.id}`,
            thumbnail: p.full_picture,
            source: 'Facebook',
            publishedAt: p.created_time,
            relevance_score: 9 // دائمًا نعطي منشوراتنا الفعلية أولوية
          }));
          setNewsList(formattedPosts);
          setShowNewsPanel(true);
          return { type: 'news', news: formattedPosts, count: formattedPosts.length };
        } else {
          const pages = data.data || [];
          return { type: 'facebook_pages_list', count: pages.length, message: `تم جلب ${pages.length} صفحة: ${pages.map((p: any) => p.name).join(', ')}`, pages };
        }
      } catch (err: any) { return { type: 'error', message: 'فشل الاتصال بفيسبوك: ' + err.message }; }
    }

    // --- Gemini Generator ---
    if (['geminiGenerator', 'contentEnhancer'].includes(nodeType)) {
      // تحتاج خبر مختار أو أخبار سابقة
      const prevData = pipelineDataRef.current;
      let newsToUse = selectedNewsItem;
      
      // إذا لم يكن هناك خبر مختار، نأخذ أول خبر من المصدر السابق
      if (!newsToUse) {
        const newsResult = Object.values(prevData).find((d: any) => d?.type === 'news');
        if (newsResult && (newsResult as any).news?.length > 0) {
          newsToUse = (newsResult as any).news[0];
          setSelectedNewsItem(newsToUse);
        }
      }

      if (!newsToUse) {
        setShowNewsPanel(true);
        return { 
          type: 'info', 
          status: 'info',
          message: '📰 تم جلب البيانات! يرجى اختيار أحد الأخبار أو المنشورات من اللوحة بالأسفل أولاً لكي يستطيع Gemini معالجته.' 
        };
      }

      const styleGoal = config.style || 'أسلوب سكندري تفاعلي';
      const data = await fetchGeminiWithRetry({
        prompt: `أنت مايسترو محتوى لنادي "زوون" في محرم بك - الإسكندرية.
التوجيه: ${styleGoal}
المنشور/الخبر الأصلي:
${newsToUse.source === 'Facebook' ? 'هذا منشور من فيسبوك:' : 'هذا خبر من مصدر إخباري:'}
العنوان/البداية: ${newsToUse.title}
المحتوى: ${newsToUse.description}

المطلوب: إعادة صياغة هذا المحتوى ليكون منشوراً فيسبوكياً بأسلوب "زوون" (سكندري دافئ، جذاب، وتفاعلي).
الشروط: استخدم 2 Emojis، انهِ بسؤال تفاعلي للمتابعين.
أهم نقطة: اقترح كلمة بحث بالإنجليزية مناسبة للمحتوى لجلب صور من Pixabay.
أعطِ الرد بصيغة JSON فقط:
{ "content": "...", "image_search_query": "English keywords here" }`
      });

      let content = '';
      let aiImageQuery = '';
      if (data.parsed && data.parsed.content) {
        content = data.parsed.content;
        aiImageQuery = data.parsed.image_search_query || '';
      } else {
        const rawText = (data.text || '').trim();
        const contentMatch = rawText.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
        const queryMatch = rawText.match(/"image_search_query"\s*:\s*"([^"]+)"/);
        if (contentMatch) {
          content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          aiImageQuery = queryMatch ? queryMatch[1] : '';
        } else {
          content = rawText.replace(/^\s*\{?\s*"content"\s*:\s*"?/i, '').replace(/"?\s*,?\s*"image_search_query"\s*:\s*"[^"]*"\s*\}?\s*$/i, '').replace(/^["'{}\s]+|["'{}\s]+$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        }
      }

      // فتح نافذة المراجعة
      setPostEditorModal({
        open: true,
        content,
        imageUrl: newsToUse.thumbnail || '',
        sourceLink: newsToUse.link,
        sourceTitle: newsToUse.title,
        roomId: availableRooms[0]?.id
      });
      if (aiImageQuery) {
        setImageSearchQuery(aiImageQuery);
        fetchSuggestedImages(aiImageQuery);
      }

      return { type: 'generated_post', content, imageQuery: aiImageQuery };
    }

    // --- Psychology Analyzer ---
    if (nodeType === 'psychologyAnalyzer') {
      const prevGenerated = Object.values(pipelineDataRef.current).find((d: any) => d?.type === 'generated_post');
      if (prevGenerated) {
        return { type: 'psychology_result', message: 'تم تحليل المحتوى نفسياً', sentiment: 'positive', engagement_prediction: 'high' };
      }
      return { type: 'info', message: 'لا يوجد محتوى للتحليل النفسي' };
    }

    // --- Image Selector ---
    if (nodeType === 'imageSelector') {
      const prevGenerated = Object.values(pipelineDataRef.current).find((d: any) => d?.type === 'generated_post');
      const query = (prevGenerated as any)?.imageQuery || 'news';
      try {
        const res = await fetch('/api/ai/search-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, source: 'all' }) });
        const data = await res.json();
        if (data.success) {
          setImageSearchResults(data.images);
          return { type: 'images', count: data.images.length, query };
        }
      } catch { /* ignore */ }
      return { type: 'images', count: 0 };
    }

    // --- Translator ---
    if (nodeType === 'translator') {
      return { type: 'info', message: 'عُقدة الترجمة — قريباً: ترجمة تلقائية بين اللغات' };
    }

    // --- Logic Nodes ---
    if (['ifElse', 'filter', 'merge'].includes(nodeType)) {
      return { type: 'logic_pass', message: 'تم تمرير البيانات' };
    }

    // --- Supabase Storage ---
    if (nodeType === 'supabaseStorage') {
      const prevGenerated = Object.values(pipelineDataRef.current).find((d: any) => d?.type === 'generated_post');
      if (prevGenerated) {
        return { type: 'queue_ready', message: 'المنشور جاهز في نافذة المراجعة — اضغط "حفظ في الطابور" لحفظه' };
      }
      return { type: 'info', message: 'لا يوجد منشور مولّد للحفظ' };
    }

    // --- Telegram Publisher ---
    if (nodeType === 'telegramPublisher') {
      const token = config.botToken;
      const chatId = config.channel; // should be @channel or chat_id
      
      if (!token || !chatId) return { type: 'info', message: 'أدخل Bot Token ومعرف القناة في إعدادات العُقدة' };

      // جلب المحتوى المولّد
      const prevGenerated = Object.values(pipelineDataRef.current).find((d: any) => d?.type === 'generated_post');
      if (!prevGenerated) return { type: 'info', message: 'لا يوجد منشور مولّد للنشر' };

      try {
        const content = (prevGenerated as any).content;
        const res = await fetch('/api/integrations/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'sendMessage', token, body: { chat_id: chatId, text: content } })
        });
        const data = await res.json();
        if (!data.ok) return { type: 'error', message: 'فشل النشر في تليجرام: ' + data.description };
        return { type: 'telegram_published', message: `✅ تم النشر بنجاح في ${chatId}!`, messageId: data.result.message_id };
      } catch (err: any) { return { type: 'error', message: 'فشل الاتصال بـ Telegram: ' + err.message }; }
    }

    // --- Facebook Publisher ---
    if (nodeType === 'facebookPublisher') {
      const pageToken = config.pageAccessToken;
      const pageId = config.pageId;
      if (!pageToken || !pageId) return { type: 'info', message: 'أدخل Page ID و Page Access Token في إعدادات العُقدة' };
      
      // جلب المحتوى المولّد
      const prevGenerated = Object.values(pipelineDataRef.current).find((d: any) => d?.type === 'generated_post');
      if (!prevGenerated) return { type: 'info', message: 'لا يوجد منشور مولّد للنشر — أضف عُقدة Gemini قبلها' };

      try {
        const content = (prevGenerated as any).content;
        const res = await fetch('/api/integrations/facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: `${pageId}/feed`, method: 'POST', body: { message: content }, accessToken: pageToken })
        });
        const data = await res.json();
        if (data.error) return { type: 'error', message: 'فشل النشر في فيسبوك: ' + data.error.message };
        return { type: 'facebook_published', message: `✅ تم النشر بنجاح! Post ID: ${data.id}`, postId: data.id };
      } catch (err: any) { return { type: 'error', message: 'فشل النشر بفيسبوك: ' + err.message }; }
    }

    return { type: 'unknown', message: 'نوع عُقدة غير معروف' };
  };

  // تشغيل المسار الكامل
  const runFullPipeline = async () => {
    if (nodes.length === 0) { toast.error('لا توجد عُقد في المسار'); return; }

    setRunningPipeline(true);
    setShowExecutionLog(true);
    setExecutionLog([]);
    pipelineDataRef.current = {};

    // إعادة ضبط كل العُقد
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: undefined, resultCount: undefined } })));

    addLog('النظام', '🚀', 'info', `بدء تنفيذ المسار — ${nodes.length} عُقدة، ${edges.length} وصلة`);

    const executionOrder = getExecutionOrder();
    addLog('النظام', '📋', 'info', `ترتيب التنفيذ: ${executionOrder.map(n => n.data.icon + ' ' + n.data.label).join(' → ')}`);

    let hasError = false;

    for (const node of executionOrder) {
      if (hasError) {
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: undefined } } : n));
        addLog(node.data.label, node.data.icon, 'skipped', 'تم تخطي العُقدة بسبب خطأ سابق');
        continue;
      }

      // حالة loading
      setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));
      addLog(node.data.label, node.data.icon, 'running', 'جارٍ التنفيذ...');

      try {
        const result = await executeNodeLogic(node);
        
        // تأخير بسيط للسماح للـ UI بالتحديث (خاصة لوحة الأخبار)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        pipelineDataRef.current[node.id] = result;

        if (result?.status === 'info') {
          addLog(node.data.label, node.data.icon, 'info', result.message);
          setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'info' } } : n));
          break; // توقف مؤقت لطلب تدخل المستخدم
        }

        if (result?.type === 'error') {
          setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: undefined } } : n));
          addLog(node.data.label, node.data.icon, 'error', result.message);
          // لا نتوقف — بعض الأخطاء غير حرجة
        } else {
          const resultCount = result?.count || result?.news?.length;
          setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'success', ...(resultCount !== undefined ? { resultCount } : {}) } } : n));
          
          const msg = result?.message || (result?.count !== undefined ? `${result.count} نتيجة` : 'تم بنجاح');
          const logStatus = result?.type?.includes('pending') ? 'info' : 'success';
          addLog(node.data.label, node.data.icon, logStatus as any, msg);
        }

        // تأخير بسيط بين العُقد لتأثير بصري
        await new Promise(r => setTimeout(r, 500));

      } catch (error: any) {
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: undefined } } : n));
        addLog(node.data.label, node.data.icon, 'error', error.message || 'خطأ غير متوقع');
        hasError = true;
      }
    }

    addLog('النظام', hasError ? '⚠️' : '🎉', hasError ? 'error' : 'success', hasError ? 'اكتمل المسار مع أخطاء' : 'اكتمل تنفيذ المسار بنجاح!');
    toast[hasError ? 'error' : 'success'](hasError ? 'اكتمل المسار مع بعض الأخطاء' : 'اكتمل تنفيذ المسار بنجاح! 🎉');
    setRunningPipeline(false);
  };

  // ==================================================
  // 🖼️ واجهة المستخدم
  // ==================================================
  return (
    <div className="flex bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner relative" style={{ minHeight: showNewsPanel ? '950px' : '700px' }}>
      
      {/* === الشريط الجانبي: مكتبة العُقد === */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-l bg-white overflow-hidden shrink-0 flex flex-col`}>
        <div className="p-3 bg-slate-50 border-b flex items-center justify-between shrink-0">
          <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
            📦 مكتبة العُقد
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-6 w-6 p-0 text-slate-400">
            <FiChevronLeft size={14} />
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {nodeCategories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-[10px] font-black text-slate-600 flex items-center gap-1.5">
                  {category.icon} {category.name}
                </span>
                <FiChevronDown className={`text-slate-400 transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`} size={12} />
              </button>
              
              {expandedCategory === category.name && (
                <div className="space-y-1 pb-2 pl-1">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg cursor-grab hover:shadow-md hover:border-slate-300 transition-all active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm">{node.icon}</span>
                        <span className="text-[10px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{node.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">{node.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-2 border-t bg-slate-50">
          <p className="text-[8px] text-slate-400 text-center italic">اسحب العُقد إلى اللوحة</p>
        </div>
      </div>

      {/* === المنطقة الرئيسية === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* شريط العنوان */}
        <div className="p-3 bg-white border-b flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="h-8 w-8 p-0 text-slate-500 border">
                <FiPlus size={14} />
              </Button>
            )}
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <FiSettings size={16} />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900">Zoon Workflow Builder</h2>
              <p className="text-[9px] text-slate-400 italic">اسحب العُقد من المكتبة ← اربطها ← شغّل المسار</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={runFullPipeline}
              disabled={runningPipeline || executing || generatingPost}
              size="sm" 
              className="text-[10px] h-8 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              {runningPipeline ? <FiRefreshCcw className="ml-1 animate-spin" size={12} /> : <FiPlay className="ml-1" size={12} />}
              ▶ تشغيل المسار
            </Button>
            <div className="w-px h-5 bg-slate-200" />
            <Button 
              onClick={fetchNews}
              disabled={executing || runningPipeline}
              variant="outline" size="sm" 
              className="text-[10px] h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {executing ? <FiRefreshCcw className="ml-1 animate-spin" size={12} /> : <FiSearch className="ml-1" size={12} />}
              بحث عن أخبار
            </Button>
            <Button 
              onClick={generateFromSelectedNews}
              disabled={!selectedNewsItem || generatingPost || runningPipeline}
              size="sm" 
              className={`text-[10px] h-8 font-black ${selectedNewsItem ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {generatingPost ? <FiRefreshCcw className="ml-1 animate-spin" size={12} /> : <FiZap className="ml-1" size={12} />}
              توليد من الخبر المختار
            </Button>
            <div className="w-px h-5 bg-slate-200" />
            
            {/* أزرار الحفظ والتحميل */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border">
              <Button onClick={saveCurrentWorkflow} size="sm" variant="ghost" className="h-7 text-[9px] font-bold text-slate-600 hover:text-indigo-600">
                <FiSave className="ml-1" /> حفظ
              </Button>
              <div className="w-px h-3 bg-slate-200" />
              {Object.keys(savedWorkflows).length > 0 && (
                <Select onValueChange={loadWorkflow}>
                  <SelectTrigger className="h-7 text-[9px] w-24 border-none bg-transparent shadow-none font-bold text-slate-600">
                    <SelectValue placeholder="تحميل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(savedWorkflows).map(name => (
                      <SelectItem key={name} value={name} className="text-[10px]">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={clearCanvas} size="sm" variant="ghost" className="h-7 text-[9px] font-bold text-red-500 hover:bg-red-50">
                <FiTrash2 className="ml-1" /> مسح
              </Button>
            </div>
          </div>
        </div>

        {/* سجل التنفيذ */}
        {showExecutionLog && executionLog.length > 0 && (
          <div className="border-t bg-slate-900 text-white max-h-[180px] overflow-y-auto">
            <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
              <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5">📋 سجل التنفيذ — {executionLog.length} خطوة</span>
              <Button variant="ghost" size="sm" onClick={() => setShowExecutionLog(false)} className="h-5 w-5 p-0 text-slate-500 hover:text-white">
                <FiX size={12} />
              </Button>
            </div>
            <div className="p-2 space-y-0.5">
              {executionLog.map((log) => (
                <div key={log.id} className={`flex items-start gap-2 p-1.5 rounded text-[10px] ${
                  log.status === 'success' ? 'bg-emerald-900/30' : 
                  log.status === 'error' ? 'bg-red-900/30' : 
                  log.status === 'running' ? 'bg-blue-900/30' : 
                  log.status === 'skipped' ? 'bg-slate-800/50' : 
                  'bg-slate-800/30'
                }`}>
                  <span className="text-xs shrink-0">{log.nodeIcon}</span>
                  <span className="shrink-0">{{
                    running: '⏳', success: '✅', error: '❌', info: 'ℹ️', skipped: '⏭️'
                  }[log.status]}</span>
                  <span className="font-bold text-slate-300 shrink-0">{log.nodeLabel}</span>
                  <span className={`flex-1 ${
                    log.status === 'success' ? 'text-emerald-300' : 
                    log.status === 'error' ? 'text-red-300' : 
                    log.status === 'info' ? 'text-blue-300' : 
                    'text-slate-400'
                  }`}>{log.message}</span>
                  <span className="text-slate-600 shrink-0 font-mono">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* مخطط ReactFlow */}
        <div ref={reactFlowWrapper} className="h-[550px] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-slate-50"
            deleteKeyCode="Delete"
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>

          {/* لوحة إعدادات العُقدة */}
          {editingNode && (
            <div className="absolute top-3 left-3 z-20 w-72 bg-white rounded-xl shadow-2xl border-2 border-indigo-100 flex flex-col overflow-hidden">
              <div className="p-3 bg-indigo-50 border-b flex justify-between items-center">
                <span className="text-[11px] font-black text-indigo-900 flex items-center gap-2">
                  {editingNode.data.icon} {editingNode.data.label}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => deleteNode(editingNode.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                    <FiTrash2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingNode(null)} className="h-6 w-6 p-0 text-indigo-400">
                    <FiX size={14} />
                  </Button>
                </div>
              </div>
              <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
                {/* إعدادات المصادر */}
                {['googleNews', 'duckduckgoNews'].includes(editingNode.type || '') && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">كلمات البحث</label>
                      <Input 
                        value={editingNode.data.config?.keywords?.join(', ') || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { keywords: e.target.value.split(',').map((s: string) => s.trim()) })}
                        placeholder="الإسكندرية، محرم بك..."
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">مصدر الجلب</label>
                      <select className="w-full h-8 text-xs border rounded-md px-2" value={editingNode.data.config?.sourceType || 'all'} onChange={(e) => updateNodeConfig(editingNode.id, { sourceType: e.target.value })}>
                        <option value="all">🌐 الكل</option>
                        <option value="google">🔍 Google News</option>
                        <option value="duckduckgo">🦆 DuckDuckGo</option>
                      </select>
                    </div>
                  </>
                )}
                {/* إعدادات Telegram */}
                {editingNode.type === 'telegramSearch' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">القنوات (usernames)</label>
                      <Input 
                        value={editingNode.data.config?.channels?.join(', ') || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { channels: e.target.value.split(',').map((s: string) => s.trim()) })}
                        placeholder="channel1, channel2"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">كلمات البحث</label>
                      <Input 
                        value={editingNode.data.config?.keywords?.join(', ') || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { keywords: e.target.value.split(',').map((s: string) => s.trim()) })}
                        placeholder="محرم بك، إسكندرية"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                      <p className="text-[9px] text-sky-700">⚡ يتطلب: <code className="bg-sky-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> و <code className="bg-sky-100 px-1 rounded">TELEGRAM_API_ID</code></p>
                    </div>
                  </>
                )}
                {/* إعدادات Facebook Pages */}
                {editingNode.type === 'facebookPages' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">الصفحات (Page IDs)</label>
                      <Input 
                        value={editingNode.data.config?.pages?.join(', ') || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { pages: e.target.value.split(',').map((s: string) => s.trim()) })}
                        placeholder="page_id_1, page_id_2"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">نوع الجلب</label>
                      <select className="w-full h-8 text-xs border rounded-md px-2" value={editingNode.data.config?.fetchType || 'posts'} onChange={(e) => updateNodeConfig(editingNode.id, { fetchType: e.target.value })}>
                        <option value="posts">📝 المنشورات</option>
                        <option value="comments">💬 التعليقات</option>
                        <option value="reactions">❤️ التفاعلات</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">🔑 Facebook Access Token</label>
                      <Input 
                        type="password"
                        value={editingNode.data.config?.accessToken || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { accessToken: e.target.value })}
                        placeholder="الصق التوكن هنا..."
                        className="text-xs h-8 font-mono"
                      />
                      <div className="flex gap-1.5">
                        <a 
                          href="https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Faccounts&version=v21.0&permissions=pages_read_engagement%2Cpages_manage_posts%2Cpages_show_list" 
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          🔗 جلب التوكن من Facebook
                        </a>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[9px] h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={async () => {
                            const token = editingNode.data.config?.accessToken;
                            if (!token) { toast.error('الصق التوكن أولاً'); return; }
                            try {
                              const res = await fetch('/api/integrations/facebook', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint: 'me/accounts', accessToken: token })
                              });
                              const data = await res.json();
                              if (data.error) { toast.error('❌ التوكن غير صالح: ' + data.error.message); updateNodeConfig(editingNode.id, { connectionStatus: 'error' }); return; }
                              const pages = data.data || [];
                              const pageNames = pages.map((p: any) => p.name).join(', ');
                              toast.success(`✅ متصل! الصفحات: ${pageNames}`);
                              updateNodeConfig(editingNode.id, { 
                                connectionStatus: 'connected', 
                                connectedPages: pages.map((p: any) => ({ id: p.id, name: p.name, access_token: p.access_token })),
                                pages: pages.map((p: any) => p.id)
                              });
                            } catch (err: any) { toast.error('❌ فشل الاتصال: ' + err.message); updateNodeConfig(editingNode.id, { connectionStatus: 'error' }); }
                          }}
                        >
                          ✓ اختبار
                        </Button>
                      </div>
                    </div>
                    {editingNode.data.config?.connectionStatus === 'connected' && (
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1">
                        <p className="text-[9px] font-black text-emerald-700">✅ متصل بنجاح!</p>
                        {editingNode.data.config?.connectedPages?.map((p: any) => (
                          <div key={p.id} className="text-[9px] text-emerald-600 flex items-center gap-1">
                            <span>📘</span> <span className="font-bold">{p.name}</span> <span className="text-emerald-400">({p.id})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {editingNode.data.config?.connectionStatus === 'error' && (
                      <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-[9px] text-red-700">❌ فشل الاتصال — تحقق من التوكن</p>
                      </div>
                    )}
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
                      <p className="text-[8px] text-blue-600 font-bold">📋 خطوات الربط:</p>
                      <p className="text-[8px] text-blue-500">1. اضغط "جلب التوكن" → سجّل دخول Facebook</p>
                      <p className="text-[8px] text-blue-500">2. اضغط "Generate Access Token"</p>
                      <p className="text-[8px] text-blue-500">3. انسخ التوكن والصقه في الحقل أعلاه</p>
                      <p className="text-[8px] text-blue-500">4. اضغط "اختبار" للتحقق</p>
                    </div>
                  </>
                )}
                {/* إعدادات Telegram Publisher */}
                {editingNode.type === 'telegramPublisher' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">معرف القناة/المجموعة (Chat ID)</label>
                      <Input 
                        value={editingNode.data.config?.channel || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { channel: e.target.value })}
                        placeholder="@channel_name or chat_id"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">🔑 Telegram Bot Token</label>
                      <Input 
                        type="password"
                        value={editingNode.data.config?.botToken || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { botToken: e.target.value })}
                        placeholder="الصق توكن البوت هنا..."
                        className="text-xs h-8 font-mono"
                      />
                      <div className="flex gap-1.5">
                        <a 
                          href="https://t.me/BotFather" 
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center text-[9px] font-bold bg-sky-500 hover:bg-sky-600 text-white px-2 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          🤖 افتح @BotFather
                        </a>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[9px] h-7 px-2 border-sky-200 text-sky-700 hover:bg-sky-50"
                          onClick={async () => {
                            const token = editingNode.data.config?.botToken;
                            if (!token) { toast.error('أدخل التوكن أولاً'); return; }
                            try {
                              const res = await fetch('/api/integrations/telegram', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ method: 'getMe', token })
                              });
                              const data = await res.json();
                              if (!data.ok) { toast.error('❌ توكن غير صحيح: ' + data.description); updateNodeConfig(editingNode.id, { botStatus: 'error' }); return; }
                              toast.success(`✅ متصل! البوت: ${data.result.first_name}`);
                              updateNodeConfig(editingNode.id, { botStatus: 'connected', botInfo: data.result });
                            } catch (err: any) { toast.error('❌ خطأ في الاتصال بالسيرفر'); }
                          }}
                        >
                          ✓ اختبار
                        </Button>
                      </div>
                    </div>
                    {editingNode.data.config?.botStatus === 'connected' && (
                      <div className="p-2 bg-sky-50 rounded-lg border border-sky-200">
                        <p className="text-[9px] font-black text-sky-700">✅ متصل بـ: {editingNode.data.config?.botInfo?.first_name}</p>
                        <p className="text-[8px] text-sky-500">@{editingNode.data.config?.botInfo?.username} • جاهز للنشر</p>
                      </div>
                    )}
                    <div className="p-2 bg-sky-50 rounded-lg border border-sky-100 space-y-1">
                      <p className="text-[8px] text-sky-600 font-bold">💡 ملاحظة:</p>
                      <p className="text-[8px] text-sky-500">تأكد أن البوت "Admin" في القناة/المجموعة ليتمكن من النشر.</p>
                    </div>
                  </>
                )}
                {/* إعدادات Facebook Publisher */}
                {editingNode.type === 'facebookPublisher' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">معرف الصفحة (Page ID)</label>
                      <Input 
                        value={editingNode.data.config?.pageId || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { pageId: e.target.value })}
                        placeholder="page_id"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">🔑 Page Access Token</label>
                      <Input 
                        type="password"
                        value={editingNode.data.config?.pageAccessToken || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeConfig(editingNode.id, { pageAccessToken: e.target.value })}
                        placeholder="الصق Page Access Token هنا..."
                        className="text-xs h-8 font-mono"
                      />
                      <div className="flex gap-1.5">
                        <a 
                          href="https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Faccounts&version=v21.0&permissions=pages_manage_posts%2Cpages_read_engagement%2Cpages_show_list%2Cpublish_to_groups" 
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          🔗 جلب التوكن من Facebook
                        </a>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[9px] h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={async () => {
                            const token = editingNode.data.config?.pageAccessToken;
                            const pageId = editingNode.data.config?.pageId;
                            if (!token) { toast.error('الصق التوكن أولاً'); return; }
                            if (!pageId) { toast.error('أدخل معرف الصفحة أولاً'); return; }
                            try {
                              const res = await fetch('/api/integrations/facebook', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint: `${pageId}?fields=name,id,fan_count`, accessToken: token })
                              });
                              const data = await res.json();
                              if (data.error) { toast.error('❌ ' + data.error.message); updateNodeConfig(editingNode.id, { publisherStatus: 'error' }); return; }
                              toast.success(`✅ متصل بصفحة "${data.name}" (${data.fan_count || 0} متابع)`);
                              updateNodeConfig(editingNode.id, { publisherStatus: 'connected', pageName: data.name, fanCount: data.fan_count });
                            } catch (err: any) { toast.error('❌ فشل: ' + err.message); updateNodeConfig(editingNode.id, { publisherStatus: 'error' }); }
                          }}
                        >
                          ✓ اختبار
                        </Button>
                      </div>
                    </div>
                    {editingNode.data.config?.publisherStatus === 'connected' && (
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-[9px] font-black text-emerald-700">✅ متصل بصفحة "{editingNode.data.config?.pageName}"</p>
                        <p className="text-[8px] text-emerald-500">{editingNode.data.config?.fanCount || 0} متابع • جاهز للنشر</p>
                      </div>
                    )}
                    {editingNode.data.config?.publisherStatus === 'error' && (
                      <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-[9px] text-red-700">❌ فشل — تأكد من Page ID و Token</p>
                      </div>
                    )}
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
                      <p className="text-[8px] text-blue-600 font-bold">💡 ملاحظة:</p>
                      <p className="text-[8px] text-blue-500">التوكن من Graph API Explorer مؤقت (ساعة). للدائم:</p>
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-600 underline font-bold">إنشاء تطبيق فيسبوك → Page Token الدائم</a>
                    </div>
                  </>
                )}
                {/* إعدادات AI */}
                {['geminiGenerator', 'contentEnhancer'].includes(editingNode.type || '') && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">أسلوب/توجيهات التوليد</label>
                    <textarea 
                      className="w-full text-xs border rounded-md px-2 py-1 h-20 resize-none"
                      value={editingNode.data.config?.style || editingNode.data.description || ''}
                      onChange={(e) => updateNodeConfig(editingNode.id, { style: e.target.value })}
                      placeholder="أسلوب سكندري تفاعلي..."
                    />
                  </div>
                )}
                {/* إعدادات عامة */}
                {['psychologyAnalyzer', 'translator', 'imageSelector', 'ifElse', 'filter', 'merge', 'supabaseStorage'].includes(editingNode.type || '') && (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] text-slate-500 italic">⚙️ هذه العُقدة تعمل تلقائياً بدون إعدادات إضافية حالياً.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* إحصائيات */}
          <div className="absolute top-3 right-3 z-10">
            <Card className="p-2.5 bg-white/90 backdrop-blur-md border-slate-200/50 shadow-xl w-40 ring-1 ring-black/5">
              <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                إحصائيات <FiActivity size={10} className="text-emerald-500" />
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">عُقد:</span>
                  <span className="font-black text-slate-800">{nodes.length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">وصلات:</span>
                  <span className="font-black text-slate-800">{edges.length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">أخبار:</span>
                  <span className="text-emerald-600 font-black">{newsList.length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">خبر مختار:</span>
                  <span className={`font-black ${selectedNewsItem ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {selectedNewsItem ? '✓' : '—'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* === لوحة الأخبار === */}
        {showNewsPanel && newsList.length > 0 && (
          <div ref={newsPanelRef} className="border-t-2 border-slate-200 bg-white">
            <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-700">📰 الأخبار — {newsList.length} نتيجة</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedNewsItem && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] font-black">
                    <FiCheck size={10} className="ml-1" /> تم تحديد الخبر
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowNewsPanel(false)} className="h-6 w-6 p-0 text-slate-400">
                  <FiX size={14} />
                </Button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto">
              {newsList.map((news: any, idx: number) => {
                const isSelected = selectedNewsItem?.link === news.link;
                return (
                  <Card 
                    key={idx} 
                    onClick={() => setSelectedNewsItem(isSelected ? null : news)}
                    className={`p-0 overflow-hidden cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative aspect-[16/9] bg-slate-100">
                      {news.thumbnail ? (
                        <img src={news.thumbnail} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><FiImage size={32} /></div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={`text-[9px] font-black ${news.relevance_score >= 8 ? 'bg-emerald-500' : 'bg-slate-500'} text-white border-0`}>
                          {news.relevance_score || '—'}/10
                        </Badge>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl">
                            <FiCheck className="text-white" size={20} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="text-[11px] font-bold text-slate-900 line-clamp-2 mb-1">{news.title}</h5>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold border">{news.source}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {selectedNewsItem && (
              <div className="p-3 bg-indigo-50 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-indigo-600" />
                  <span className="text-[11px] font-bold text-indigo-900">تم تحديد الخبر</span>
                  <span className="text-[10px] text-indigo-600 italic truncate max-w-[300px]">{selectedNewsItem.title}</span>
                </div>
                <Button 
                  onClick={generateFromSelectedNews}
                  disabled={generatingPost}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] h-9 px-5"
                >
                  {generatingPost ? <FiRefreshCcw className="ml-1 animate-spin" size={12} /> : <FiZap className="ml-1" size={12} />}
                  توليد من الخبر المختار
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === نافذة مراجعة المنشور === */}
      <Dialog open={postEditorModal?.open} onOpenChange={(open) => !open && setPostEditorModal(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[90vh]">
            <div className="col-span-3 p-8 bg-white space-y-6 overflow-y-auto">
              <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FiEdit3 className="text-indigo-600" /> مراجعة وتعديل المنشور
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                قم بمراجعة محتوى المنشور وتعديله قبل الحفظ في طابور المراجعة أو النشر المباشر.
              </DialogDescription>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">نص المنشور</Label>
                  <Textarea 
                    value={postEditorModal?.content || ''}
                    onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="min-h-[250px] text-base leading-relaxed border-slate-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">نشر في غرفة (Target Room)</Label>
                    <Select 
                      value={postEditorModal?.roomId} 
                      onValueChange={(val) => setPostEditorModal(prev => prev ? { ...prev, roomId: val } : null)}
                    >
                      <SelectTrigger className="text-xs h-9 border-slate-200">
                        <SelectValue placeholder="اختر الغرفة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map(room => (
                          <SelectItem key={room.id} value={room.id} className="text-xs">
                            {room.icon} {room.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">رابط المصدر</Label>
                    <Input value={postEditorModal?.sourceLink || ''} onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, sourceLink: e.target.value } : null)} className="text-xs h-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">رابط الصورة</Label>
                  <Input value={postEditorModal?.imageUrl || ''} onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, imageUrl: e.target.value } : null)} className="text-xs" />
                </div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
                  <Label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><FiSearch /> بحث عن صور:</Label>
                  <div className="flex gap-2">
                    <Select value={imageSource} onValueChange={setImageSource}>
                      <SelectTrigger className="h-9 text-[10px] bg-white min-w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المصادر</SelectItem>
                        <SelectItem value="pixabay">Pixabay</SelectItem>
                        <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="ابحث بالإنجليزية..." value={imageSearchQuery} onChange={(e) => setImageSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchSuggestedImages(imageSearchQuery)} className="h-9 text-sm" />
                    <Button size="sm" onClick={() => fetchSuggestedImages(imageSearchQuery)} disabled={searchingImages} className="bg-slate-800 hover:bg-black h-9 px-4">
                      {searchingImages ? <FiRefreshCcw className="animate-spin" /> : 'بحث'}
                    </Button>
                  </div>
                  {imageSearchResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2 max-h-32 overflow-y-auto">
                      {imageSearchResults.map((img: any, i: number) => (
                        <div key={i} onClick={() => setPostEditorModal(prev => prev ? { ...prev, imageUrl: img.url } : null)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${postEditorModal?.imageUrl === img.url ? 'border-indigo-600 scale-95' : 'border-transparent hover:border-slate-300'}`}>
                          <img src={img.thumb} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button onClick={saveToQueue} disabled={generatingPost} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg">
                  {generatingPost ? <span className="animate-spin mr-2">⏳</span> : <FiCheck className="mr-2" />}
                  حفظ في الطابور للمراجعة
                </Button>
                <Button variant="outline" onClick={() => setPostEditorModal(null)} className="h-12 px-6 font-bold rounded-xl">إلغاء</Button>
              </div>
            </div>
            <div className="col-span-2 p-8 bg-slate-50 border-r space-y-6 overflow-y-auto">
              <Label className="text-[10px] font-black text-slate-400 uppercase">معاينة المنشور (Preview)</Label>
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-3 border-b">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">Z</div>
                  <div>
                    <p className="text-xs font-black text-slate-800">Zoon Club Admin</p>
                    <p className="text-[10px] text-slate-400 font-bold">الآن • عام</p>
                  </div>
                </div>
                {postEditorModal?.imageUrl && (
                  <div className="aspect-[4/3] bg-slate-100"><img src={postEditorModal.imageUrl} className="w-full h-full object-cover" alt="" /></div>
                )}
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{postEditorModal?.content || ''}</p>
                  {postEditorModal?.sourceLink && (
                    <div className="p-3 bg-slate-50 rounded-2xl border flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border"><FiExternalLink className="text-slate-400" /></div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-800 truncate">{postEditorModal.sourceTitle}</p>
                        <p className="text-[9px] text-slate-400 truncate">{postEditorModal.sourceLink}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">⚡ Workflow Builder</Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">🤖 Gemini 1.5 Flash</Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// تغليف بـ ReactFlowProvider لدعم Drag & Drop
export default function WorkflowBuilder({ onPostSaved }: { onPostSaved?: () => void }) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner onPostSaved={onPostSaved} />
    </ReactFlowProvider>
  );
}
