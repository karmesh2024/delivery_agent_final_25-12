"use client";

import React, { useEffect, useState } from "react";
import { FUNCTION_NODES } from "../functions/registry";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getSkills, addSkill, updateSkill, removeSkill } from "@/store/slices/aiSkillsSlice";
import { AISkill, AISkillFunction } from "@/services/aiSkillsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Zap, Globe, ShieldCheck, Workflow } from "lucide-react";
import { toast } from "react-toastify";

// ========================================
// ثوابت التصنيفات والأيقونات
// ========================================
const CATEGORIES = [
  { value: 'general', label: 'عام', icon: '⚡' },
  { value: 'financial', label: 'مالية', icon: '💰' },
  { value: 'content', label: 'محتوى', icon: '📝' },
  { value: 'delivery', label: 'توصيل', icon: '🚴' },
  { value: 'messaging', label: 'رسائل', icon: '💬' },
  { value: 'export', label: 'تصدير', icon: '📄' },
  { value: 'files', label: 'ملفات', icon: '📁' },
  { value: 'search', label: 'بحث', icon: '🔍' },
  { value: 'ai', label: 'ذكاء اصطناعي', icon: '🧠' },
];

const SKILL_TYPES = [
  { value: 'webhook', label: 'Webhook (API خارجي)', icon: Globe },
  { value: 'hitl', label: 'HITL (موافقة بشرية)', icon: ShieldCheck },
  { value: 'internal', label: 'Internal (معالجة داخلية)', icon: Zap },
  { value: 'function', label: 'Function (وظائف متعددة)', icon: Workflow },
];

const FN_TYPES = [
  { value: 'internal', label: 'داخلي (Handler)' },
  { value: 'webhook', label: 'Webhook (رابط API)' },
  { value: 'pipeline', label: 'Pipeline (سلسلة عمليات)' },
  { value: 'hitl', label: 'HITL (موافقة بشرية)' },
];

// ========================================
// واجهة وظيفة فارغة
// ========================================
function createEmptyFunction(): Partial<AISkillFunction> {
  return {
    name: '',
    label: '',
    description: '',
    type: 'internal',
    endpoint: '',
    input_schema: { type: 'object', properties: {} },
    is_active: true,
  };
}

// ========================================
// المكون الرئيسي
// ========================================
export default function SkillBuilder() {
  const dispatch = useAppDispatch();
  const { skills, loading } = useAppSelector((state) => state.aiSkills);

  const [isOpen, setIsOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AISkill | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // حالة النموذج
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("webhook");
  const [category, setCategory] = useState("general");
  const [icon, setIcon] = useState("⚡");
  const [inputSchema, setInputSchema] = useState('{\n  "type": "object",\n  "properties": {}\n}');
  const [webhookUrl, setWebhookUrl] = useState("");

  // حالة الوظائف
  const [functions, setFunctions] = useState<Partial<AISkillFunction>[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'functions'>('basic');
  const [availablePipelines, setAvailablePipelines] = useState<any[]>([]);
  const [availableFunctions, setAvailableFunctions] = useState<any[]>([]);

  const fetchPipelines = async () => {
    try {
      const resp = await fetch('/api/zoon/pipelines');
      if (resp.ok) {
        const data = await resp.json();
        setAvailablePipelines(data);
      }
    } catch (err) {
      console.error('Failed to fetch pipelines', err);
    }
  };

  const fetchAvailableFunctions = async () => {
    try {
      const resp = await fetch('/api/zoon/functions');
      if (resp.ok) {
        const data = await resp.json();
        setAvailableFunctions(data);
      }
    } catch (err) {
      console.error('Failed to fetch available functions', err);
    }
  };

  /**
   * استنتاج الـ Schema من عُقد الـ Pipeline
   */
  const inferSchemaFromPipeline = (pipelineId: string) => {
    const pipeline = availablePipelines.find(p => p.id === pipelineId);
    if (!pipeline || !pipeline.nodes) return null;

    const nodes = typeof pipeline.nodes === 'string' ? JSON.parse(pipeline.nodes) : pipeline.nodes;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // مسح العُقد بحثاً عن قيم تبدأ بـ {{input.variable}}
    nodes.forEach((node: any) => {
      const params = node.params || {};
      Object.values(params).forEach((val: any) => {
        if (typeof val === 'string' && val.includes('{{input.')) {
          const match = val.match(/{{input\.([^}]+)}}/);
          if (match) {
            const key = match[1];
            properties[key] = {
              type: "string", // افتراضي
              title: key,
              description: `قيمة لـ ${key}`
            };
            if (!required.includes(key)) required.push(key);
          }
        }
      });
    });

    return {
      type: "object",
      properties,
      required
    };
  };

  /**
   * بناء Schema من بارامترات العقدة (للوظائف الداخلية)
   */
  const buildSchemaFromParams = (params: any[]) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    params.forEach(p => {
      properties[p.key] = {
        type: p.type === 'date' ? 'string' : (p.type || 'string'),
        title: p.label,
        description: p.description || `قيمة لـ ${p.label}`,
        ...(p.options && { enum: p.options }),
        ...(p.default !== undefined && { default: p.default })
      };
      if (p.required) required.push(p.key);
    });

    return {
      type: "object",
      properties,
      required
    };
  };

  useEffect(() => {
    dispatch(getSkills());
  }, [dispatch]);

  // ========================================
  // handlers
  // ========================================
  const handleOpenModal = (skill?: AISkill) => {
    if (skill) {
      setEditingSkill(skill);
      setName(skill.name);
      setDescription(skill.description);
      setType(skill.type);
      setCategory(skill.category || 'general');
      setIcon(skill.icon || '⚡');
      setInputSchema(JSON.stringify(skill.input_schema, null, 2));
      setWebhookUrl(skill.webhook_url || "");
      setFunctions(
        skill.ai_skill_functions?.map(fn => ({
          ...fn,
          input_schema: fn.input_schema || { type: 'object', properties: {} },
        })) || []
      );
    } else {
      setEditingSkill(null);
      setName("");
      setDescription("");
      setType("webhook");
      setCategory("general");
      setIcon("⚡");
      setInputSchema('{\n  "type": "object",\n  "properties": {}\n}');
      setWebhookUrl("");
      setFunctions([]);
    }
    setActiveTab('basic');
    setIsOpen(true);
    fetchPipelines();
    fetchAvailableFunctions();
  };

  const handleSave = async () => {
    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(inputSchema);
    } catch {
      toast.error("هيكل المخطط (Schema) غير صحيح - يجب أن يكون JSON صالحاً");
      return;
    }

    // التحقق من الوظائف
    const validFunctions = functions.filter(fn => fn.name && fn.label);
    for (const fn of validFunctions) {
      if (typeof fn.input_schema === 'string') {
        try {
          fn.input_schema = JSON.parse(fn.input_schema as any);
        } catch {
          toast.error(`خطأ في JSON Schema للوظيفة: ${fn.name}`);
          return;
        }
      }
    }

    const payload = {
      name,
      description,
      type,
      input_schema: parsedSchema,
      webhook_url: webhookUrl || undefined,
      category,
      icon,
      functions: validFunctions,
    };

    try {
      if (editingSkill) {
        await dispatch(updateSkill({ id: editingSkill.id, data: payload })).unwrap();
        toast.success("تم تحديث المهارة بنجاح ✅");
      } else {
        await dispatch(addSkill(payload)).unwrap();
        toast.success("تم إنشاء المهارة بنجاح ✅");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err || "حدث خطأ غير معروف");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المهارة وجميع وظائفها؟")) {
      try {
        await dispatch(removeSkill(id)).unwrap();
        toast.success("تم حذف المهارة ✅");
      } catch (err: any) {
        toast.error(err || "فشل في الحذف");
      }
    }
  };

  // ========================================
  // إدارة الوظائف
  // ========================================
  const addFunction = () => {
    setFunctions([...functions, createEmptyFunction()]);
  };

  const removeFunction = (index: number) => {
    setFunctions(functions.filter((_, i) => i !== index));
  };

  const updateFunction = (index: number, field: string, value: any) => {
    const updated = [...functions];
    (updated[index] as any)[field] = value;
    setFunctions(updated);
  };

  // ========================================
  // العرض (Render)
  // ========================================
  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            منشئ المهارات v2 (Zoon Skill Builder)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ مهارات متعددة الوظائف لتوسيع إمكانيات الوكيل في النظام.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          إضافة مهارة
        </Button>
      </div>

      {/* Skills Grid */}
      {loading && skills.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => {
            const catInfo = getCategoryInfo(skill.category || 'general');
            const fns = skill.ai_skill_functions || [];
            const isExpanded = expandedSkill === skill.id;

            return (
              <div
                key={skill.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* رأس المهارة */}
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon || catInfo.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{skill.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {skill.description.length > 80
                          ? skill.description.substring(0, 80) + '...'
                          : skill.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {catInfo.label}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">
                      {skill.type}
                    </span>
                    {fns.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {fns.length} وظيفة
                      </span>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(skill)}>
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                    {fns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* الوظائف التابعة (Expandable) */}
                {isExpanded && fns.length > 0 && (
                  <div className="border-t border-gray-200 bg-white">
                    <div className="p-3 text-xs font-medium text-gray-500 border-b bg-gray-25">
                      📋 الوظائف المسجلة ({fns.length})
                    </div>
                    {fns.map((fn, idx) => (
                      <div
                        key={fn.id || idx}
                        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-medium text-sm text-gray-800">
                              {fn.label || fn.name}
                            </span>
                            <p className="text-xs text-gray-400">{fn.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                            {fn.type}
                          </span>
                          {fn.endpoint && (
                            <span className="text-xs text-gray-400 font-mono max-w-[200px] truncate">
                              {fn.endpoint}
                            </span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${fn.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {skills.length === 0 && (
            <div className="text-center p-12 text-gray-500 border-2 border-dashed rounded-lg">
              لا توجد مهارات مضافة حالياً. اضغط &quot;إضافة مهارة&quot; للبدء.
            </div>
          )}
        </div>
      )}

      {/* =============================== */}
      {/*   نافذة الإنشاء / التعديل       */}
      {/* =============================== */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingSkill ? "✏️ تعديل مهارة" : "➕ إضافة مهارة جديدة"}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              ⚙️ الإعدادات الأساسية
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'functions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('functions')}
            >
              🔧 الوظائف ({functions.length})
            </button>
          </div>

          {/* Tab: Basic */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المهارة (بالإنجليزية)</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="financialManager"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={category} onValueChange={(val) => {
                    setCategory(val);
                    const cat = CATEGORIES.find(c => c.value === val);
                    if (cat) setIcon(cat.icon);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف (للذكاء الاصطناعي ليفهم متى وماذا تفعل)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="إدارة العمليات المالية، حساب أرباح المناديب..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع المهارة</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_TYPES.map(st => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأيقونة</Label>
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="⚡"
                    className="text-center text-2xl"
                  />
                </div>
              </div>

              {type === "webhook" && (
                <div className="space-y-2">
                  <Label>رابط Webhook</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.example.com/check"
                    dir="ltr"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>مخطط المدخلات (JSON Schema) — للمهارات بدون وظائف فرعية</Label>
                <Textarea
                  value={inputSchema}
                  onChange={(e) => setInputSchema(e.target.value)}
                  className="font-mono text-sm"
                  rows={6}
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Tab: Functions */}
          {activeTab === 'functions' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                💡 أضف وظائف متعددة أسفل هذه المهارة. كل وظيفة ستظهر للوكيل كأداة منفصلة باسم: 
                <code className="bg-blue-100 px-1 rounded mx-1">{name || 'skillName'}_functionName</code>
              </div>

              {functions.map((fn, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      وظيفة #{idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFunction(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الاسم البرمجي</Label>
                      <Input
                        value={fn.name || ''}
                        onChange={(e) => updateFunction(idx, 'name', e.target.value)}
                        placeholder="calcEarnings"
                        dir="ltr"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الاسم العربي</Label>
                      <Input
                        value={fn.label || ''}
                        onChange={(e) => updateFunction(idx, 'label', e.target.value)}
                        placeholder="حساب مستحقات مندوب"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">الوصف</Label>
                    <Input
                      value={fn.description || ''}
                      onChange={(e) => updateFunction(idx, 'description', e.target.value)}
                      placeholder="حساب أرباح مندوب محدد خلال فترة زمنية"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">النوع</Label>
                      <Select
                        value={fn.type || 'internal'}
                        onValueChange={(val) => updateFunction(idx, 'type', val)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FN_TYPES.map(ft => (
                            <SelectItem key={ft.value} value={ft.value}>
                              {ft.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {fn.type === 'internal' && (
                      <div className="space-y-1">
                        <Label className="text-xs">اختر وظيفة من المكتبة</Label>
                        <Select
                          onValueChange={(fnId) => {
                            const selected = availableFunctions.find(f => f.id === fnId);
                            if (selected) {
                              updateFunction(idx, 'name', selected.id);
                              updateFunction(idx, 'label', selected.label);
                              updateFunction(idx, 'description', selected.description);
                              updateFunction(idx, 'endpoint', selected.id); // الـ ID يمثل الـ handler
                              updateFunction(idx, 'input_schema', buildSchemaFromParams(selected.params || []));
                            }
                          }}
                        >
                          <SelectTrigger className="text-sm bg-indigo-50 border-indigo-200">
                            <SelectValue placeholder="--- اختر مهمة جاهزة ---" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => {
                              const catFns = availableFunctions.filter(f => f.category === cat.value);
                              if (catFns.length === 0) return null;
                              return (
                                <React.Fragment key={cat.value}>
                                  <div className="px-2 py-1.5 text-xs font-black text-slate-400 bg-slate-50 uppercase tracking-widest">
                                    {cat.icon} {cat.label}
                                  </div>
                                  {catFns.map(f => (
                                    <SelectItem key={f.id} value={f.id} className="pr-8">
                                      {f.label}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(fn.type === 'webhook' || fn.type === 'pipeline') && (
                      <div className="space-y-1">
                        <Label className="text-xs">المسار / Endpoint</Label>
                        {fn.type === 'pipeline' ? (
                          <Select
                            value={fn.endpoint?.split('/').pop() || ''}
                            onValueChange={(val) => {
                              updateFunction(idx, 'endpoint', `/api/internal/run-pipeline/${val}`);
                              // توليد الـ Schema تلقائياً عند الاختيار
                              const inferred = inferSchemaFromPipeline(val);
                              if (inferred && Object.keys(inferred.properties).length > 0) {
                                updateFunction(idx, 'input_schema', inferred);
                              }
                            }}
                          >
                            <SelectTrigger className="text-sm dir-ltr font-mono">
                              <SelectValue placeholder="اختر مساراً (Pipeline)..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePipelines.map(p => (
                                <SelectItem key={p.id} value={p.id || p.name}>
                                  {p.name}
                                </SelectItem>
                              ))}
                              {availablePipelines.length === 0 && (
                                <SelectItem value="none" disabled>لا توجد مسارات محفوظة</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={fn.endpoint || ''}
                            onChange={(e) => updateFunction(idx, 'endpoint', e.target.value)}
                            placeholder="https://api.example.com/..."
                            dir="ltr"
                            className="text-sm font-mono"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">مخطط المدخلات (JSON Schema)</Label>
                    <Textarea
                      value={
                        typeof fn.input_schema === 'string'
                          ? fn.input_schema
                          : JSON.stringify(fn.input_schema || {}, null, 2)
                      }
                      onChange={(e) => {
                        try {
                          updateFunction(idx, 'input_schema', JSON.parse(e.target.value));
                        } catch {
                          updateFunction(idx, 'input_schema', e.target.value);
                        }
                      }}
                      className="font-mono text-xs"
                      rows={4}
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addFunction}
                className="w-full border-dashed border-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة وظيفة جديدة
              </Button>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingSkill ? "💾 حفظ التعديلات" : "✅ إنشاء المهارة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
