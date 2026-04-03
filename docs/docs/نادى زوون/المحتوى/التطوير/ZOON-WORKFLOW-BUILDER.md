# بناء Workflow Builder داخلي لـ Zoon Club 🔧
# نظام أتمتة مرئي مثل n8n - مع ميزات تليجرام ومحسنات المحتوى

---

## 🎯 الفكرة: Zoon Workflow Builder

### **ماذا سنبني؟**

نظام **Drag & Drop** مرئي يسمح لك ببناء workflows للمحتوى بدون كتابة كود، مثل n8n تماماً، لكن **مخصص لـ Zoon Club** مع:

✅ البحث في **Telegram Channels/Groups**
✅ ربط **صفحات Facebook**
✅ محسنات **AI للمحتوى**
✅ تحليل **نفسي وثقافي**
✅ جدولة **ذكية**
✅ **A/B Testing** للمنشورات

---

## 🏗️ البنية المعمارية (Architecture)

### المكونات الرئيسية

```
┌─────────────────────────────────────────────────────────────┐
│                  ZOON WORKFLOW BUILDER UI                   │
│  (React + ReactFlow) - واجهة Drag & Drop مرئية             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NODE LIBRARY (مكتبة العُقد)              │
│                                                             │
│  📥 Input Nodes          📊 Processing Nodes                │
│  • Telegram Search       • AI Content Enhancer             │
│  • DuckDuckGo News      • Psychology Analyzer               │
│  • Facebook Pages       • Translation                       │
│  • Google News RSS      • Summarization                     │
│                                                             │
│  🤖 AI Nodes             📤 Output Nodes                    │
│  • Gemini Generator     • Supabase Storage                  │
│  • Image Selector       • Telegram Publisher                │
│  • Quality Checker      • Facebook Publisher                │
│                                                             │
│  🔄 Logic Nodes          ⏰ Trigger Nodes                   │
│  • If/Else              • Cron Schedule                     │
│  • Filter               • Webhook                           │
│  • Merge                • Manual Trigger                    │
│  • Loop                                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOW ENGINE                           │
│  (Executes nodes in order, manages state, error handling)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATIONS LAYER                        │
│  • Telegram API  • Facebook API  • Gemini  • Supabase      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 المكونات التقنية (Tech Stack)

```json
{
  "frontend": {
    "framework": "Next.js 14",
    "ui": "React + TailwindCSS",
    "workflow_canvas": "ReactFlow",
    "state_management": "Zustand",
    "forms": "React Hook Form + Zod"
  },
  "backend": {
    "runtime": "Next.js API Routes (Node.js)",
    "database": "Supabase (PostgreSQL)",
    "queue": "BullMQ (Redis)",
    "cron": "node-cron"
  },
  "integrations": {
    "telegram": "telegraf",
    "facebook": "facebook-nodejs-sdk",
    "ai": "Google Gemini 2.5 Flash",
    "news": "duck-duck-scrape + rss-parser",
    "images": "Pixabay API + DuckDuckGo"
  }
}
```

---

## 🎨 واجهة Workflow Builder

### 1️⃣ **Canvas (لوحة الرسم)**

```tsx
// ========================================
// FILE: app/components/WorkflowCanvas.tsx
// ========================================

'use client';

import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useState } from 'react';

// تعريف أنواع العُقد
const nodeTypes = {
  telegramSearch: TelegramSearchNode,
  duckduckgoNews: DuckDuckGoNewsNode,
  geminiGenerator: GeminiGeneratorNode,
  imageSelector: ImageSelectorNode,
  qualityChecker: QualityCheckerNode,
  supabaseStorage: SupabaseStorageNode,
  ifElse: IfElseNode,
  filter: FilterNode
};

export default function WorkflowCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // إضافة عُقدة جديدة
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const nodeType = event.dataTransfer.getData('nodeType');
    const position = {
      x: event.clientX,
      y: event.clientY
    };

    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: { label: nodeType }
    };

    setNodes((nds) => nds.concat(newNode));
  }, []);

  // ربط العُقد
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => setNodes(changes)}
        onEdgesChange={(changes) => setEdges(changes)}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

### 2️⃣ **Node Library (Sidebar)**

```tsx
// ========================================
// FILE: app/components/NodeLibrary.tsx
// ========================================

'use client';

const nodeCategories = [
  {
    name: 'Input Sources',
    icon: '📥',
    nodes: [
      {
        type: 'telegramSearch',
        label: 'Telegram Search',
        icon: '✈️',
        description: 'البحث في قنوات ومجموعات تليجرام'
      },
      {
        type: 'duckduckgoNews',
        label: 'DuckDuckGo News',
        icon: '🦆',
        description: 'جلب الأخبار من DuckDuckGo'
      },
      {
        type: 'googleNewsRss',
        label: 'Google News RSS',
        icon: '📰',
        description: 'جلب الأخبار من Google News'
      },
      {
        type: 'facebookPages',
        label: 'Facebook Pages',
        icon: '📘',
        description: 'جلب المنشورات من صفحات فيسبوك'
      }
    ]
  },
  {
    name: 'AI Processing',
    icon: '🤖',
    nodes: [
      {
        type: 'geminiGenerator',
        label: 'Gemini Generator',
        icon: '✨',
        description: 'توليد محتوى باستخدام Gemini'
      },
      {
        type: 'psychologyAnalyzer',
        label: 'Psychology Analyzer',
        icon: '🧠',
        description: 'التحليل النفسي للمحتوى'
      },
      {
        type: 'contentEnhancer',
        label: 'Content Enhancer',
        icon: '⚡',
        description: 'تحسين جودة المحتوى'
      },
      {
        type: 'translator',
        label: 'Translator',
        icon: '🌐',
        description: 'ترجمة النصوص'
      }
    ]
  },
  {
    name: 'Media',
    icon: '🖼️',
    nodes: [
      {
        type: 'imageSelector',
        label: 'Image Selector',
        icon: '🎨',
        description: 'اختيار صورة مناسبة'
      },
      {
        type: 'imageGenerator',
        label: 'Image Generator',
        icon: '🖌️',
        description: 'توليد صور بالذكاء الاصطناعي'
      }
    ]
  },
  {
    name: 'Logic',
    icon: '🔄',
    nodes: [
      {
        type: 'ifElse',
        label: 'If/Else',
        icon: '🔀',
        description: 'شرط منطقي'
      },
      {
        type: 'filter',
        label: 'Filter',
        icon: '🔍',
        description: 'تصفية البيانات'
      },
      {
        type: 'merge',
        label: 'Merge',
        icon: '🔗',
        description: 'دمج مصادر متعددة'
      },
      {
        type: 'loop',
        label: 'Loop',
        icon: '🔁',
        description: 'تكرار العملية'
      }
    ]
  },
  {
    name: 'Output',
    icon: '📤',
    nodes: [
      {
        type: 'supabaseStorage',
        label: 'Supabase Storage',
        icon: '💾',
        description: 'حفظ في قاعدة البيانات'
      },
      {
        type: 'telegramPublisher',
        label: 'Telegram Publisher',
        icon: '📣',
        description: 'نشر في قناة تليجرام'
      },
      {
        type: 'facebookPublisher',
        label: 'Facebook Publisher',
        icon: '📘',
        description: 'نشر في صفحة فيسبوك'
      }
    ]
  }
];

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">📦 Node Library</h2>
      
      {nodeCategories.map((category) => (
        <div key={category.name} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            {category.icon} {category.name}
          </h3>
          
          <div className="space-y-2">
            {category.nodes.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{node.icon}</span>
                  <span className="font-medium text-sm">{node.label}</span>
                </div>
                <p className="text-xs text-gray-500">{node.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
```

---

## 🔧 العُقد المخصصة (Custom Nodes)

### 1️⃣ **Telegram Search Node**

```tsx
// ========================================
// FILE: app/components/nodes/TelegramSearchNode.tsx
// ========================================

'use client';

import { Handle, Position } from 'reactflow';
import { useState } from 'react';

export default function TelegramSearchNode({ data, id }: any) {
  const [config, setConfig] = useState({
    channels: ['moharrambek_news'],
    keywords: ['محرم بك', 'الإسكندرية'],
    limit: 10,
    timeRange: '24h'
  });

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-4 min-w-[300px]">
      {/* Handle للدخول */}
      <Handle type="target" position={Position.Left} />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✈️</span>
        <h3 className="font-bold">Telegram Search</h3>
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Channels</label>
          <input
            type="text"
            value={config.channels.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              channels: e.target.value.split(',').map(s => s.trim())
            })}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="channel1, channel2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Keywords</label>
          <input
            type="text"
            value={config.keywords.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              keywords: e.target.value.split(',').map(s => s.trim())
            })}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="كلمة1, كلمة2"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Limit</label>
            <input
              type="number"
              value={config.limit}
              onChange={(e) => setConfig({
                ...config,
                limit: parseInt(e.target.value)
              })}
              className="w-full px-2 py-1 text-sm border rounded"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Time</label>
            <select
              value={config.timeRange}
              onChange={(e) => setConfig({
                ...config,
                timeRange: e.target.value
              })}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="1h">آخر ساعة</option>
              <option value="24h">آخر 24 ساعة</option>
              <option value="7d">آخر أسبوع</option>
              <option value="30d">آخر شهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

---

### 2️⃣ **Content Enhancer Node (محسّن المحتوى)**

```tsx
// ========================================
// FILE: app/components/nodes/ContentEnhancerNode.tsx
// ========================================

'use client';

import { Handle, Position } from 'reactflow';
import { useState } from 'react';

export default function ContentEnhancerNode({ data, id }: any) {
  const [config, setConfig] = useState({
    enhancementType: 'all',
    options: {
      addEmojis: true,
      fixGrammar: true,
      improveReadability: true,
      addHashtags: true,
      localizeDialect: true,  // تحويل إلى لهجة سكندرية
      addCallToAction: false
    }
  });

  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg p-4 min-w-[300px]">
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚡</span>
        <h3 className="font-bold">Content Enhancer</h3>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-1">
            Enhancement Type
          </label>
          <select
            value={config.enhancementType}
            onChange={(e) => setConfig({
              ...config,
              enhancementType: e.target.value
            })}
            className="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="all">تحسين شامل</option>
            <option value="grammar">القواعد اللغوية فقط</option>
            <option value="style">الأسلوب فقط</option>
            <option value="localization">اللهجة المحلية فقط</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.addEmojis}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, addEmojis: e.target.checked }
              })}
            />
            <span className="text-xs">إضافة إيموجي مناسبة</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.fixGrammar}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, fixGrammar: e.target.checked }
              })}
            />
            <span className="text-xs">تصحيح الأخطاء اللغوية</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.improveReadability}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, improveReadability: e.target.checked }
              })}
            />
            <span className="text-xs">تحسين سهولة القراءة</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.addHashtags}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, addHashtags: e.target.checked }
              })}
            />
            <span className="text-xs">إضافة هاشتاجات</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.localizeDialect}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, localizeDialect: e.target.checked }
              })}
            />
            <span className="text-xs">تحويل للهجة سكندرية</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.options.addCallToAction}
              onChange={(e) => setConfig({
                ...config,
                options: { ...config.options, addCallToAction: e.target.checked }
              })}
            />
            <span className="text-xs">إضافة دعوة للتفاعل</span>
          </label>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

---

### 3️⃣ **Facebook Pages Node**

```tsx
// ========================================
// FILE: app/components/nodes/FacebookPagesNode.tsx
// ========================================

'use client';

import { Handle, Position } from 'reactflow';
import { useState } from 'react';

export default function FacebookPagesNode({ data, id }: any) {
  const [config, setConfig] = useState({
    pages: ['alexandria.gov.eg', 'moharrambek.official'],
    fetchType: 'posts',  // posts, comments, reactions
    limit: 10,
    includeComments: false
  });

  return (
    <div className="bg-white border-2 border-blue-600 rounded-lg p-4 min-w-[300px]">
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📘</span>
        <h3 className="font-bold">Facebook Pages</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">
            Pages (usernames)
          </label>
          <input
            type="text"
            value={config.pages.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              pages: e.target.value.split(',').map(s => s.trim())
            })}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="page1, page2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Fetch Type</label>
          <select
            value={config.fetchType}
            onChange={(e) => setConfig({
              ...config,
              fetchType: e.target.value
            })}
            className="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="posts">المنشورات</option>
            <option value="comments">التعليقات</option>
            <option value="reactions">التفاعلات</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-xs">Include Comments?</label>
          <input
            type="checkbox"
            checked={config.includeComments}
            onChange={(e) => setConfig({
              ...config,
              includeComments: e.target.checked
            })}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

---

## 🔄 Workflow Engine (محرك التنفيذ)

```typescript
// ========================================
// FILE: lib/workflow-engine.ts
// ========================================

interface WorkflowNode {
  id: string;
  type: string;
  data: any;
}

interface WorkflowEdge {
  source: string;
  target: string;
}

interface WorkflowState {
  [nodeId: string]: any;
}

export class WorkflowEngine {
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private state: WorkflowState = {};

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * تنفيذ الـ Workflow كاملاً
   */
  async execute() {
    console.log('🚀 بدء تنفيذ Workflow...');

    // إيجاد العُقدة الأولى (بدون input)
    const startNode = this.findStartNode();
    
    if (!startNode) {
      throw new Error('لا توجد عُقدة بداية');
    }

    // تنفيذ من العُقدة الأولى
    await this.executeNode(startNode.id);

    console.log('✅ انتهى تنفيذ Workflow');
    return this.state;
  }

  /**
   * تنفيذ عُقدة واحدة
   */
  private async executeNode(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      console.error(`❌ لم يتم العثور على العُقدة: ${nodeId}`);
      return;
    }

    console.log(`⚙️ تنفيذ العُقدة: ${node.type} (${nodeId})`);

    try {
      // تنفيذ العُقدة بناءً على نوعها
      const result = await this.runNodeLogic(node);
      
      // حفظ النتيجة في الحالة
      this.state[nodeId] = result;

      // إيجاد العُقد التالية
      const nextNodes = this.getNextNodes(nodeId);

      // تنفيذ العُقد التالية
      for (const nextNodeId of nextNodes) {
        await this.executeNode(nextNodeId);
      }

    } catch (error) {
      console.error(`❌ خطأ في تنفيذ العُقدة ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * تنفيذ منطق العُقدة
   */
  private async runNodeLogic(node: WorkflowNode): Promise<any> {
    switch (node.type) {
      case 'telegramSearch':
        return await this.executeTelegramSearch(node);
      
      case 'duckduckgoNews':
        return await this.executeDuckDuckGoNews(node);
      
      case 'geminiGenerator':
        return await this.executeGeminiGenerator(node);
      
      case 'contentEnhancer':
        return await this.executeContentEnhancer(node);
      
      case 'imageSelector':
        return await this.executeImageSelector(node);
      
      case 'supabaseStorage':
        return await this.executeSupabaseStorage(node);
      
      case 'ifElse':
        return await this.executeIfElse(node);
      
      default:
        console.warn(`⚠️ نوع عُقدة غير معروف: ${node.type}`);
        return null;
    }
  }

  /**
   * تنفيذ Telegram Search
   */
  private async executeTelegramSearch(node: WorkflowNode) {
    const { channels, keywords, limit } = node.data;
    
    console.log(`✈️ البحث في Telegram: ${channels.join(', ')}`);

    // استدعاء Telegram API
    const results = await this.telegramService.search({
      channels,
      keywords,
      limit
    });

    return results;
  }

  /**
   * تنفيذ Content Enhancer
   */
  private async executeContentEnhancer(node: WorkflowNode) {
    const { enhancementType, options } = node.data;
    
    // الحصول على المحتوى من العُقدة السابقة
    const previousNodes = this.getPreviousNodes(node.id);
    const inputContent = this.state[previousNodes[0]]?.content;

    if (!inputContent) {
      throw new Error('لا يوجد محتوى للتحسين');
    }

    console.log('⚡ تحسين المحتوى...');

    // استدعاء Gemini لتحسين المحتوى
    const enhancedContent = await this.geminiService.enhance({
      content: inputContent,
      type: enhancementType,
      options: options
    });

    return enhancedContent;
  }

  /**
   * إيجاد العُقدة الأولى
   */
  private findStartNode(): WorkflowNode | null {
    for (const node of this.nodes) {
      const hasInput = this.edges.some(e => e.target === node.id);
      if (!hasInput) {
        return node;
      }
    }
    return null;
  }

  /**
   * الحصول على العُقد التالية
   */
  private getNextNodes(nodeId: string): string[] {
    return this.edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);
  }

  /**
   * الحصول على العُقد السابقة
   */
  private getPreviousNodes(nodeId: string): string[] {
    return this.edges
      .filter(e => e.target === nodeId)
      .map(e => e.source);
  }
}
```

---

## 📡 Telegram Integration

```typescript
// ========================================
// FILE: lib/integrations/telegram.ts
// ========================================

import { Telegraf } from 'telegraf';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

export class TelegramService {
  private bot: Telegraf;
  private client: TelegramClient;

  constructor(botToken: string, apiId: number, apiHash: string) {
    this.bot = new Telegraf(botToken);
    this.client = new TelegramClient(
      new StringSession(''),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );
  }

  /**
   * البحث في القنوات والمجموعات
   */
  async searchChannels(params: {
    channels: string[];
    keywords: string[];
    limit: number;
    timeRange?: string;
  }) {
    const results = [];

    for (const channel of params.channels) {
      try {
        // الحصول على الرسائل الأخيرة
        const messages = await this.client.getMessages(channel, {
          limit: params.limit
        });

        // تصفية بناءً على الكلمات المفتاحية
        const filtered = messages.filter(msg => {
          if (!msg.message) return false;
          
          return params.keywords.some(keyword => 
            msg.message.toLowerCase().includes(keyword.toLowerCase())
          );
        });

        results.push(...filtered.map(msg => ({
          channel: channel,
          text: msg.message,
          date: msg.date,
          views: msg.views,
          forwards: msg.forwards
        })));

      } catch (error) {
        console.error(`❌ خطأ في البحث في ${channel}:`, error);
      }
    }

    return results;
  }

  /**
   * نشر منشور في قناة
   */
  async publishToChannel(channelId: string, content: {
    text: string;
    image?: string;
  }) {
    try {
      if (content.image) {
        await this.bot.telegram.sendPhoto(
          channelId,
          content.image,
          { caption: content.text }
        );
      } else {
        await this.bot.telegram.sendMessage(
          channelId,
          content.text
        );
      }

      console.log(`✅ تم النشر في ${channelId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ فشل النشر:', error);
      throw error;
    }
  }
}
```

---

## 📘 Facebook Integration

```typescript
// ========================================
// FILE: lib/integrations/facebook.ts
// ========================================

import FB from 'fb';

export class FacebookService {
  constructor(accessToken: string) {
    FB.setAccessToken(accessToken);
  }

  /**
   * جلب منشورات من صفحة
   */
  async getPagePosts(pageId: string, limit: number = 10) {
    return new Promise((resolve, reject) => {
      FB.api(
        `/${pageId}/posts`,
        {
          fields: 'message,created_time,likes.summary(true),comments.summary(true)',
          limit: limit
        },
        (response: any) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response.data.map((post: any) => ({
              id: post.id,
              message: post.message,
              date: new Date(post.created_time),
              likes: post.likes?.summary.total_count || 0,
              comments: post.comments?.summary.total_count || 0
            })));
          }
        }
      );
    });
  }

  /**
   * نشر منشور في صفحة
   */
  async publishToPage(pageId: string, content: {
    message: string;
    link?: string;
    photo?: string;
  }) {
    return new Promise((resolve, reject) => {
      const endpoint = content.photo 
        ? `/${pageId}/photos`
        : `/${pageId}/feed`;

      FB.api(
        endpoint,
        'POST',
        content,
        (response: any) => {
          if (response.error) {
            reject(response.error);
          } else {
            console.log(`✅ تم النشر في صفحة ${pageId}`);
            resolve(response);
          }
        }
      );
    });
  }
}
```

---

## 🎯 سيناريو عملي كامل

### **Workflow: "Zoon Auto-Poster"**

```
[Telegram Search]  ─┐
                    ├─→ [Merge] ─→ [Filter Top News] ─→ [Psychology Analyzer]
[DuckDuckGo News]  ─┘                                         ↓
                                                    [Gemini Generator]
                                                         ↓
                                                   [Content Enhancer]
                                                    (إضافة لهجة سكندرية)
                                                         ↓
                                                   [Image Selector]
                                                    (Pixabay + DDG)
                                                         ↓
                                                   [Quality Checker]
                                                         ↓
                                                      [If/Else]
                                              (Quality >= 8?)
                                                /              \
                                            نعم                 لا
                                             ↓                   ↓
                                    [Supabase Storage]    [Re-generate]
                                             ↓
                                      ┌──────┴──────┐
                                      ↓             ↓
                          [Telegram Publisher]  [Facebook Publisher]
```

### الكود لحفظ هذا Workflow

```json
{
  "name": "Zoon Auto-Poster",
  "description": "نظام نشر تلقائي للأخبار في تليجرام وفيسبوك",
  "nodes": [
    {
      "id": "telegram-1",
      "type": "telegramSearch",
      "position": { "x": 100, "y": 100 },
      "data": {
        "channels": ["moharrambek_news"],
        "keywords": ["محرم بك"],
        "limit": 10
      }
    },
    {
      "id": "ddg-1",
      "type": "duckduckgoNews",
      "position": { "x": 100, "y": 250 },
      "data": {
        "query": "محرم بك الإسكندرية",
        "limit": 10
      }
    },
    {
      "id": "merge-1",
      "type": "merge",
      "position": { "x": 400, "y": 175 },
      "data": {}
    },
    {
      "id": "filter-1",
      "type": "filter",
      "position": { "x": 600, "y": 175 },
      "data": {
        "condition": "views > 100 OR likes > 50"
      }
    },
    {
      "id": "psychology-1",
      "type": "psychologyAnalyzer",
      "position": { "x": 800, "y": 175 },
      "data": {}
    },
    {
      "id": "gemini-1",
      "type": "geminiGenerator",
      "position": { "x": 1000, "y": 175 },
      "data": {
        "styles": ["informational", "narrative", "motivational"]
      }
    },
    {
      "id": "enhancer-1",
      "type": "contentEnhancer",
      "position": { "x": 1200, "y": 175 },
      "data": {
        "options": {
          "addEmojis": true,
          "localizeDialect": true,
          "addHashtags": true
        }
      }
    },
    {
      "id": "image-1",
      "type": "imageSelector",
      "position": { "x": 1400, "y": 175 },
      "data": {
        "sources": ["pixabay", "duckduckgo"]
      }
    },
    {
      "id": "quality-1",
      "type": "qualityChecker",
      "position": { "x": 1600, "y": 175 },
      "data": {
        "minScore": 8
      }
    },
    {
      "id": "supabase-1",
      "type": "supabaseStorage",
      "position": { "x": 1800, "y": 175 },
      "data": {
        "table": "posts"
      }
    },
    {
      "id": "telegram-pub-1",
      "type": "telegramPublisher",
      "position": { "x": 2000, "y": 100 },
      "data": {
        "channel": "@moharrambek_official"
      }
    },
    {
      "id": "facebook-pub-1",
      "type": "facebookPublisher",
      "position": { "x": 2000, "y": 250 },
      "data": {
        "pageId": "moharrambek.page"
      }
    }
  ],
  "edges": [
    { "source": "telegram-1", "target": "merge-1" },
    { "source": "ddg-1", "target": "merge-1" },
    { "source": "merge-1", "target": "filter-1" },
    { "source": "filter-1", "target": "psychology-1" },
    { "source": "psychology-1", "target": "gemini-1" },
    { "source": "gemini-1", "target": "enhancer-1" },
    { "source": "enhancer-1", "target": "image-1" },
    { "source": "image-1", "target": "quality-1" },
    { "source": "quality-1", "target": "supabase-1" },
    { "source": "supabase-1", "target": "telegram-pub-1" },
    { "source": "supabase-1", "target": "facebook-pub-1" }
  ]
}
```

---

## 📦 ملف `package.json`

```json
{
  "name": "zoon-workflow-builder",
  "version": "1.0.0",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.5.0",
    "telegraf": "^4.15.0",
    "telegram": "^2.19.0",
    "fb": "^3.1.1",
    "duck-duck-scrape": "^2.2.5",
    "rss-parser": "^3.13.0",
    "@google/generative-ai": "^0.21.0",
    "@supabase/supabase-js": "^2.39.0",
    "bullmq": "^5.0.0",
    "node-cron": "^3.0.3",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🚀 الميزات الإضافية المقترحة

### 1️⃣ **A/B Testing Node**
- نشر نسختين من المنشور
- قياس التفاعل لكل نسخة
- اختيار الأفضل تلقائياً

### 2️⃣ **Sentiment Analysis Node**
- تحليل مشاعر التعليقات
- تحديد المحتوى الأكثر إيجابية
- التنبيه عند محتوى سلبي

### 3️⃣ **Auto-Scheduler Node**
- جدولة ذكية بناءً على أفضل أوقات النشر
- تحليل سلوك الجمهور
- نشر تلقائي في الوقت الأمثل

### 4️⃣ **Trending Topics Node**
- رصد المواضيع الشائعة في محرم بك
- اقتراح محتوى بناءً على التريندات
- تنبيهات فورية

### 5️⃣ **Engagement Booster Node**
- إضافة أسئلة تفاعلية
- استطلاعات رأي
- مسابقات

---

## 📊 Database Schema (Supabase)

```sql
-- جدول الـ Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول سجل التنفيذ
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  status TEXT, -- running, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT,
  results JSONB
);

-- جدول المنشورات المُنتجة
CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  content TEXT NOT NULL,
  image_url TEXT,
  psychology JSONB,
  quality_score INTEGER,
  published_to JSONB, -- {telegram: true, facebook: false}
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ الخطوات التالية

### **المرحلة 1: MVP (2-3 أسابيع)**
- ✅ واجهة Workflow Builder أساسية
- ✅ 5 عُقد أساسية (News, Gemini, Image, Storage, Publisher)
- ✅ Workflow Engine بسيط
- ✅ حفظ وتحميل Workflows

### **المرحلة 2: Integrations (1-2 أسابيع)**
- ✅ Telegram Integration كامل
- ✅ Facebook Integration كامل
- ✅ Pixabay + DuckDuckGo للصور

### **المرحلة 3: Advanced Features (2-3 أسابيع)**
- ✅ Content Enhancer
- ✅ A/B Testing
- ✅ Auto-Scheduler
- ✅ Analytics Dashboard

---

**🎉 الآن لديك خطة كاملة لبناء نظام Workflow Builder احترافي لـ Zoon Club!**
