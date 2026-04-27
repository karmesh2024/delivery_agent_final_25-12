"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { setPendingAction } from '@/store/slices/zoonSlice';
import ReactMarkdown from 'react-markdown';

// ─── أيقونات وألوان العُقد ─────────────────────────────────────────────
const NODE_META: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  searchNews: { icon: '🔍', label: 'البحث عن أخبار', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400' },
  alexDialect: { icon: '🗣️', label: 'اللغة الإسكندرانية', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400' },
  telegram: { icon: '📢', label: 'نشر على تليجرام', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-400' },
  publishToRoom: { icon: '📺', label: 'النشر في الغرفة', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400' },
  notifyAgents: { icon: '🔔', label: 'تنبيه المناديب', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400' },
  globalSearchV2: { icon: '🌐', label: 'البحث العالمي V2', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-400' },
  'web_search': { icon: '🌐', label: 'بحث سريع', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  'deep_research': { icon: '🧠', label: 'بحث معمق', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' },
  'image_ocr': { icon: '🖼️', label: 'قراءة صورة (OCR)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
  'web_fetch': { icon: '🌐', label: 'قراءة موقع', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-300' },
  'orchestrator': { icon: '🧠', label: 'المنسق الذكي', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-400' },
  'accounting': { icon: '💰', label: 'وكيل الحسابات', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  'inventory': { icon: '📦', label: 'وكيل المخازن', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400' },
  'reflection': { icon: '🧐', label: 'بوابة المراجعة', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400' },
  'parallel_executor': { icon: '⚡', label: 'التنفيذ الموازي', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400' },
};

const toolNameTranslations: Record<string, string> = {
  notifyAgents: 'تنبيه المناديب',
  telegram: 'تليجرام',
  publishToRoom: 'نشر الغرف',
  searchNews: 'البحث الإخباري',
  globalSearchV2: 'البحث العالمي (النسخة الثانية)',
  'web_search': 'بحث سريع',
  'deep_research': 'بحث معمق',
  'image_ocr': 'قراءة صورة (OCR)',
  'web_fetch': 'قراءة موقع',
  'orchestrator': 'المنسق الذكي',
  'accounting': 'المحاسبة المالية',
  'inventory': 'إدارة المخازن',
  'reflection': 'مراجعة الجودة',
  'parallel_executor': 'المعالجة المتوازية',
};

const STATE_BADGE: Record<string, { label: string; cls: string }> = {
  'input-streaming': { label: '⏳ معالجة...', cls: 'bg-yellow-100 text-yellow-700 animate-pulse' },
  'input-available': { label: '⌛ ينتظر موافقة', cls: 'bg-orange-100 text-orange-700 animate-bounce' },
  'output-available': { label: '✅ مكتمل', cls: 'bg-green-100 text-green-700' },
  'output-error': { label: '❌ خطأ', cls: 'bg-red-100 text-red-700' },
  'output-denied': { label: '🚫 مرفوض', cls: 'bg-gray-100 text-gray-600' },
};

// ─── مكوّن عقدة واحدة في الورك فلو ──────────────────────────────
function WorkflowNode({
  toolName, state, input, output, errorText, index, isLast,
  onApprove, onReject, onApproveWithEdit,
}: {
  toolName: string; state: string; input: any; output?: any; errorText?: string;
  index: number; isLast: boolean;
  onApprove: () => void; onReject: () => void;
  onApproveWithEdit?: (editedContent: string) => void;
}) {
  const meta = NODE_META[toolName] ?? { icon: '⚙️', label: toolName, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-400' };
  const badge = STATE_BADGE[state] ?? { label: state, cls: 'bg-gray-100 text-gray-600' };

  // أي عقدة تتوقف عند 'input-available' هي عقدة HITL تتطلب موافقة
  const isHITL = state === 'input-available';
  const isDone = state === 'output-available';

  return (
    <div className="flex flex-col items-center">
      {/* رقم الخطوة */}
      <div className="w-6 h-6 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center font-bold mb-1">
        {index + 1}
      </div>

      {/* بطاقة العقدة */}
      <div className={`
        relative w-52 rounded-xl border-2 p-3 shadow-sm transition-all duration-500
        ${meta.bg} ${meta.border}
        ${isHITL ? 'ring-2 ring-yellow-400 ring-offset-1 shadow-yellow-200 shadow-md' : ''}
        ${isDone ? 'opacity-100' : state === 'input-streaming' ? 'opacity-90' : 'opacity-100'}
      `}>
        {/* أيقونة ورأس العقدة */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className={`font-bold text-xs ${meta.color}`}>{meta.label}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* المدخلات */}
        {input !== undefined && (
          <div className="text-[10px] text-gray-500 bg-white bg-opacity-60 rounded p-1 mb-1 truncate" title={JSON.stringify(input)}>
            <span className="font-semibold text-gray-600">↳ </span>
            {typeof input === 'object' ? Object.values(input as any)[0] as string : String(input)}
          </div>
        )}

        {/* المخرجات للعقد العادية */}
        {isDone && output && !isHITL && (
          <div className="text-[10px] text-green-700 bg-green-50 rounded p-1 mt-1 line-clamp-2" title={JSON.stringify(output)}>
            <span className="font-semibold">✓ </span>
            {typeof output === 'object'
              ? ((output as any).message ?? (output as any).converted ?? (output as any).summary ?? (typeof (output as any).results?.[0] === 'string' ? (output as any).results[0] : null) ?? 'تم التنفيذ بنجاح')
              : String(output)}
          </div>
        )}

        {/* الخطأ */}
        {state === 'output-error' && errorText && (
          <div className="text-[10px] text-red-600 bg-red-50 rounded p-1 mt-1">⚠️ {errorText}</div>
        )}

        {/* ── بوابة HITL مع تعديل المحتوى ── */}
        {isHITL && (() => {
          const originalContent = toolName === 'telegram' ? (input as any)?.content : (input as any)?.message || (input as any)?.topic || JSON.stringify(input);
          const [isEditing, setIsEditing] = React.useState(false);
          const [editedText, setEditedText] = React.useState(originalContent || '');

          return (
            <div className="mt-2 border-t border-yellow-300 pt-2">
              <p className="text-[10px] font-bold text-yellow-700 mb-1.5">✍️ مراجعة وتعديل قبل الإرسال</p>

              {/* منطقة المحتوى - قابلة للتعديل */}
              {isEditing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full bg-white border-2 border-blue-300 rounded p-2 text-[11px] text-gray-800 min-h-[80px] max-h-[150px] resize-y outline-none focus:border-blue-500 transition-colors"
                  dir="rtl"
                  placeholder="عدّل المحتوى هنا..."
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className="bg-white border border-yellow-200 rounded p-2 text-[11px] text-gray-700 max-h-[100px] overflow-y-auto cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  title="اضغط للتعديل"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-400 group-hover:text-blue-500">اضغط للتعديل ✍️</span>
                  </div>
                  {editedText}
                </div>
              )}

              {/* أزرار القرار */}
              <div className="flex gap-1.5 mt-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        if (onApproveWithEdit) {
                          onApproveWithEdit(editedText);
                        } else {
                          onApprove();
                        }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 rounded shadow transition-colors"
                    >
                      📤 إرسال بعد التعديل
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold py-1.5 px-2 rounded shadow transition-colors"
                    >
                      ↩️ إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded shadow transition-colors"
                    >
                      ✍️ تعديل
                    </button>
                    <button
                      onClick={onApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-1.5 rounded shadow transition-colors"
                    >
                      ✅ موافقة
                    </button>
                    <button
                      onClick={onReject}
                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 px-2 rounded shadow transition-colors"
                    >
                      ❌
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* مؤشر تحميل متحرك عند المعالجة */}
        {state === 'input-streaming' && (
          <div className="absolute top-2 left-2 flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-current animate-bounce delay-0" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* سهم التوصيل بين العُقد */}
      {!isLast && (
        <div className="flex flex-col items-center my-1">
          <div className={`w-0.5 h-4 ${isDone ? 'bg-green-400' : 'bg-gray-300'} transition-colors duration-700`} />
          <div className={`text-base leading-none ${isDone ? 'text-green-500' : 'text-gray-300'} transition-colors duration-700`}>▼</div>
        </div>
      )}
    </div>
  );
}

// ─── نوع بيانات بنك المعلومات ──────────────────────────────────────
interface BankItem {
  id: string;
  title: string;
  source: string;
  link: string;
  date?: string;
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────
export default function ZoonChat() {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [newsBank, setNewsBank] = useState<BankItem[]>([]);
  const [showBank, setShowBank] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("Zoon Swarm (Qwen/Ollama)");
  const [searchMode, setSearchMode] = useState<'auto' | 'web' | 'deep'>('auto');
  const [searchCategory, setSearchCategory] = useState<'general' | 'images' | 'social' | 'news'>('general');
  const [imageAnalysis, setImageAnalysis] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});

  // دالة تحليل الصورة عند الطلب
  const handleAnalyzeImage = async (imageUrl: string, title: string) => {
    if (isAnalyzing[imageUrl]) return;
    
    setIsAnalyzing(prev => ({ ...prev, [imageUrl]: true }));
    try {
      const response = await fetch('/api/zoon/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl, 
          prompt: `حلل هذه الصورة بعنوان "${title}" بدقة. استخرج أي أرقام، أسعار، أو بيانات مهمة واعرضها في قائمة نقاط مختصرة جداً وباللغة العربية.` 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setImageAnalysis(prev => ({ ...prev, [imageUrl]: result.data.extractedText || result.data.text || 'لايوجد نص مقروء' }));
      } else {
        setImageAnalysis(prev => ({ ...prev, [imageUrl]: '⚠️ تعذر التحليل حالياً.' }));
      }
    } catch (e) {
      setImageAnalysis(prev => ({ ...prev, [imageUrl]: '❌ خطأ في الاتصال.' }));
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [imageUrl]: false }));
    }
  };

  // إضافة خبر للبنك
  const addToBank = (item: BankItem) => {
    setNewsBank(prev => {
      if (prev.some(b => b.id === item.id)) return prev; // لا تكرار
      return [...prev, item];
    });
  };

  // حذف خبر من البنك
  const removeFromBank = (id: string) => {
    setNewsBank(prev => prev.filter(b => b.id !== id));
  };

  // مسح البنك بالكامل
  const clearBank = () => setNewsBank([]);

  // استخدام fetch مخصص لالتقاط الهيدرات أثناء الإرسال وقراءة x-zoon-model
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, init);
    const modelFromHeader = res.headers.get('x-zoon-model');
    if (modelFromHeader) {
      setActiveModel(modelFromHeader);
    }
    return res;
  };

  const { messages, sendMessage, status, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/zoon',
      fetch: customFetch as any
    }),
    onToolCall({ toolCall }) {
      // أي أداة يتم استدعاؤها ولا تملك 'execute' على الخادم ستحتاج موافقة هنا
      dispatch(setPendingAction({
        id: toolCall.toolCallId,
        toolName: toolCall.toolName,
        args: (toolCall as any).args,
        description: `العقدة [${toolNameTranslations[toolCall.toolName] || toolCall.toolName}] تنتظر قرارك.`
      }));
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // استخراج كل أجزاء الأدوات من آخر رسالة مساعد لعرضها في الورك فلو
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const toolParts: any[] = lastAssistantMsg
    ? lastAssistantMsg.parts.filter((p: any) => p.type?.startsWith('tool-'))
    : [];

  const hasWorkflow = toolParts.length > 0;

  return (
    <div className="flex h-full gap-3 font-tajawal rtl" dir="rtl">

      {/* ── عمود الورك فلو البصري (يظهر فقط عند وجود أدوات) ── */}
      {hasWorkflow && (
        <div className="w-60 flex-shrink-0 bg-white border rounded-xl shadow-sm p-3 overflow-y-auto">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">مسار التنفيذ</span>
            <div className="text-[10px] text-gray-400">Execution Flow</div>
          </div>

          <div className="flex flex-col items-center">
            {/* عقدة البداية */}
            <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm flex items-center justify-center shadow mb-1">
              🚀
            </div>
            <div className="text-[10px] text-gray-500 mb-1">بدء المهمة</div>
            <div className="w-0.5 h-3 bg-green-400 mb-1" />
            <div className="text-green-500 text-xs mb-2">▼</div>

            {/* عُقد الأدوات */}
            {toolParts.map((part: any, idx: number) => {
              const toolName = part.type.replace(/^tool-/, '');
              return (
                <WorkflowNode
                  key={part.toolCallId ?? idx}
                  toolName={toolName}
                  state={part.state}
                  input={part.input}
                  output={part.output}
                  errorText={part.errorText}
                  index={idx}
                  isLast={idx === toolParts.length - 1}
                  onApprove={() => {
                    const successMsg = `تم تنفيذ [${toolNameTranslations[toolName] || toolName}] بنجاح بموافقة صريحة من المسؤول.`;
                    addToolOutput({ toolCallId: part.toolCallId, output: successMsg, tool: toolName });
                    dispatch(setPendingAction(null));
                  }}
                  onReject={() => {
                    addToolOutput({ toolCallId: part.toolCallId, output: '❌ تم رفض الطلب من قبل المسؤول.', tool: toolName });
                    dispatch(setPendingAction(null));
                  }}
                  onApproveWithEdit={(editedContent) => {
                    const editedMsg = `تم تنفيذ [${toolNameTranslations[toolName] || toolName}] بعد التعديل.\n\nالمحتوى المعدّل:\n${editedContent}`;
                    addToolOutput({ toolCallId: part.toolCallId, output: editedMsg, tool: toolName });
                    dispatch(setPendingAction(null));
                  }}
                />
              );
            })}

            {/* عقدة النهاية */}
            {toolParts.some((p: any) => p.state === 'output-available') && !isLoading && (
              <>
                <div className="w-0.5 h-3 bg-green-400 mt-1" />
                <div className="text-green-500 mb-1">▼</div>
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm flex items-center justify-center shadow">
                  🏁
                </div>
                <div className="text-[10px] text-gray-500 mt-1">اكتمل</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── عمود المحادثة ── */}
      <div className="flex flex-col flex-1 bg-gray-50 border rounded-xl shadow-lg overflow-hidden">

        {/* رأس المنسق */}
        <div className="bg-green-700 text-white p-3 text-center shadow-sm flex-shrink-0 relative">
          <h2 className="text-xl font-bold">Zoon Hybrid OS Copilot</h2>
          <span className="text-sm opacity-80">(المعمارية المرتكزة على العُقد)</span>

          {/* مؤشر النموذج والحدود */}
          <div className="absolute top-2 left-3 flex flex-col items-start gap-1" title="نموذج الذكاء الاصطناعي الحالي وحدود الاستخدام">
            <span className="bg-green-800 text-green-100 text-[10px] px-2 py-0.5 rounded-md border border-green-600 font-mono shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
              {activeModel}
            </span>
            <span className="text-[9px] text-green-200 font-medium px-1">
              Limits: {activeModel.includes('pro') ? '2 RPM / 50 RPD' : '15 RPM / 1500 RPD'}
            </span>
          </div>
        </div>

        {/* سجل المحادثة */}
        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 p-4">
          {messages.map((message: UIMessage) => (
             <div
               key={message.id}
               className={`p-3 rounded-xl max-w-[90%] shadow-sm ${message.role === 'user'
                 ? 'bg-green-100 mr-auto border border-green-200'
                 : 'bg-white border ml-auto min-h-[50px]'
                 }`}
             >
               {message.role === 'assistant' && (
                  <div className="text-[11px] font-black text-blue-600 mb-1 flex items-center gap-1.5 border-b border-gray-50 pb-1 opacity-80">
                    <span className="text-sm">🤖</span> {(message as any).model || 'الوكيل الذكي'}
                  </div>
               )}

               {message.parts.map((part: any, index: number) => {

                // ── نص عادي ──
                if (part.type === 'text') {
                  return (
                    <div key={`t-${index}`} className="text-gray-800 text-sm leading-relaxed prose prose-sm prose-green prose-img:rounded-xl prose-img:shadow-md">
                      {message.role === 'user' && <span className="font-bold block mb-1">👤 أنت: </span>}
                      <ReactMarkdown
                        components={{
                          img: ({ src, alt, ...props }) => {
                            if (!src) return null;
                            return <img 
                              src={src} 
                              alt={alt || "صورة توضيحية"} 
                              {...props} 
                              className="max-h-[300px] w-auto inline-block rounded-xl shadow-md border border-gray-200 mt-2 object-contain bg-gray-50"
                              onError={(e: any) => e.target.style.display='none'}
                              loading="lazy"
                            />;
                          },
                          a: ({ href, children }) => {
                            if (!href) return null;
                            const url = href;
                            const title = String(children);
                            const itemId = `${url}`;
                            const isInBank = newsBank.some(b => b.id === itemId);
                            const safeHostname = url.startsWith('http') ? new URL(url).hostname : 'رابط خارجي';
                            
                            return (
                              <span className="my-2 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 min-w-0" style={{ display: 'flex' }}>
                                <span className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
                                  <img 
                                    src={`https://www.google.com/s2/favicons?domain=${safeHostname}&sz=32`} 
                                    alt="" 
                                    className="w-5 h-5 block"
                                    onError={(e: any) => e.target.src = 'https://www.google.com/favicon.ico'}
                                  />
                                </span>
                                <span className="flex-1 min-w-0 overflow-hidden text-right block">
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate w-full">{safeHostname}</span>
                                  <span className="block text-[13px] font-bold text-gray-900 truncate leading-tight w-full mt-0.5">{title}</span>
                                </span>
                                <span className="flex items-center gap-1.5 flex-shrink-0">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] px-2.5 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-black transition-colors flex items-center gap-1"
                                  >
                                    🔗 فتح
                                  </a>
                                  <button
                                    onClick={() => {
                                      if (isInBank) {
                                        removeFromBank(itemId);
                                      } else {
                                        addToBank({ id: itemId, title, source: safeHostname, link: url });
                                      }
                                    }}
                                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-black transition-colors flex items-center gap-1 ${
                                      isInBank ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    }`}
                                  >
                                    {isInBank ? '❌' : '📥 حفظ'}
                                  </button>
                                </span>
                              </span>
                            );
                          }
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  );
                }

                // ── أداة: مختصرة في الشات (التفاصيل في الورك فلو) ──
                if (part.type?.startsWith('tool-')) {
                  const toolName = part.type.replace(/^tool-/, '');
                  const meta = NODE_META[toolName] ?? { icon: '⚙️', label: toolName, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-300' };
                  const badge = STATE_BADGE[part.state] ?? { label: part.state, cls: 'bg-gray-100 text-gray-600' };

                  // التحقق مما إذا كانت النتيجة أخباراً لعرضها كبطاقات
                  const isNewsResult = part.state === 'output-available'
                    && (part.output?.type === 'news_cards' || part.output?.type === 'search_results')
                    && (part.output?.results?.length > 0 || part.output?.items?.length > 0);

                  return (
                    <div key={`tool-${part.toolCallId ?? index}`}>
                      {/* شريط حالة الأداة */}
                      <div className={`flex items-center gap-2 mt-1 px-3 py-1.5 rounded-xl text-xs border shadow-sm ${meta.bg} ${meta.border}`}>
                        <span className="text-sm">{meta.icon}</span>
                        <span className={`font-black ${meta.color}`}>{meta.label}</span>
                        <span className={`mx-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter shadow-inner ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {/* زر إضافة الكل للبنك - مدمج في شريط الحالة */}
                        {isNewsResult && (
                          <button
                            onClick={() => {
                              let newText = '';
                              const results = part.output.results || part.output.items;
                              results.forEach((item: any) => {
                                const url = item.link || item.url || '';
                                const safeHostname = url.startsWith('http') ? new URL(url).hostname : 'مصدر';
                                addToBank({ id: url, title: item.title, source: item.source || safeHostname, link: url });
                              });
                              toast.success(`تمت إضافة ${results.length} نتيجة للبنك`);
                            }}
                            className="mr-auto text-[9px] bg-white hover:bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black border border-amber-200 transition-all flex items-center gap-1"
                          >
                            📥 أضف الكل للبنك
                          </button>
                        )}
                      </div>


                      {/* 🌐 نتائج البحث السريع والمعمق (Premium Cards & Media Support) */}
                      {part.state === 'output-available' && part.output?.type === 'search_results' && (
                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center justify-between px-1">
                            <div className="text-xs font-bold text-blue-700 flex items-center gap-2">
                              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                              <span>
                                {part.output.category === 'images' ? '🖼️ معرض الصور لـ:' : 
                                 part.output.category === 'social_media' ? '💬 نتائج التواصل لـ:' : 
                                 '🔍 نتائج البحث عن:'}
                              </span>
                              <span className="bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 italic text-blue-800">"{part.output.query}"</span>
                            </div>
                          </div>
                          
                          {/* 🖼️ عرض وضع الصور (Gallery Mode) */}
                          {part.output.category === 'images' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {part.output.results?.map((res: any, i: number) => {
                                const analysisId = res.imageUrl || res.fullImage || res.url;
                                const analysis = imageAnalysis[analysisId];
                                const loading = isAnalyzing[analysisId];
                                
                                return (
                                  <div key={i} className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                                    <div className="relative aspect-video overflow-hidden">
                                      {(res.imageUrl || res.thumbnail || res.img_src) ? (
                                        <img 
                                          src={res.imageUrl || res.thumbnail || res.img_src} 
                                          alt={res.title || 'صورة'} 
                                          className="w-full h-full object-contain bg-black/5 group-hover:scale-105 transition-transform duration-700"
                                          onError={(e: any) => e.target.src = 'https://via.placeholder.com/300?text=No+Image'}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">لا توجد صورة</div>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" 
                                           className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 border border-white/30 transition-all">
                                          🔗
                                        </a>
                                        <button 
                                          onClick={() => handleAnalyzeImage(analysisId, res.title)}
                                          className="px-3 py-1.5 bg-white text-blue-600 rounded-full text-[10px] font-bold shadow-lg hover:bg-blue-50 transition-all"
                                          disabled={loading}
                                        >
                                          {loading ? '⏳ جاري...' : '🔍 تحليل'}
                                        </button>
                                      </div>
                                    </div>
                                    
                                      <div className="p-3">
                                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-1 mb-1">{res.title}</h4>
                                        <div className="flex items-center gap-1 opacity-60">
                                          {res.url?.startsWith('http') && (
                                            <>
                                              <img src={`https://www.google.com/s2/favicons?domain=${new URL(res.url).hostname}&sz=16`} className="w-3 h-3" />
                                              <span className="text-[9px] truncate">{new URL(res.url).hostname}</span>
                                            </>
                                          )}
                                        </div>
                                      
                                      {/* عرض نتيجة التحليل الذكي */}
                                      {analysis && (
                                        <div className="mt-3 p-2 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-900 leading-relaxed animate-in fade-in zoom-in duration-300">
                                          <div className="flex items-center gap-1.5 mb-1 font-black text-blue-600 uppercase text-[8px]">
                                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                            نتائج تحليل Gemini Vision:
                                          </div>
                                          {analysis}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {part.output.results?.map((res: any, i: number) => {
                                const safeUrl = res.url?.startsWith("http") ? res.url : ""; 
                                const hostname = safeUrl ? new URL(safeUrl).hostname : "link";
                                const favicon = safeUrl ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : "";
                                const isSocial = part.output.category === 'social_media';
                                
                                return (
                                  <div key={i} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
                                    
                                    <div className={`relative bg-white border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden ${isSocial ? 'border-r-4 border-r-indigo-400' : ''}`}>
                                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row gap-4">
                                        {res.thumbnail && (
                                          <div className={`w-full sm:w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-inner ${isSocial ? 'sm:w-16 sm:h-16 rounded-full self-center' : ''}`}>
                                            <img src={res.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                          <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <div className="p-1 bg-white rounded shadow-sm border border-gray-50 uppercase tracking-tighter">
                                                 {favicon ? (
                                                   <img src={favicon} alt="" className="w-3.5 h-3.5" />
                                                 ) : (
                                                   <span className="text-[10px]">🌐</span>
                                                 )}
                                              </div>
                                              <span className="text-[10px] font-bold text-blue-500 tracking-wide uppercase">{hostname}</span>
                                              {isSocial && <span className="bg-indigo-100 text-indigo-600 text-[8px] px-1.5 rounded-full py-0.5 font-bold">نقاش / تواصل</span>}
                                            </div>
                                            
                                            <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug mb-2">
                                              {res.title}
                                            </h4>
                                            
                                            <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                              {res.snippet}
                                            </p>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50/50">
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const itemId = res.url;
                                                const isInBank = newsBank.some(b => b.id === itemId);
                                                if (isInBank) {
                                                  removeFromBank(itemId);
                                                } else {
                                                  addToBank({ id: itemId, title: res.title, source: hostname, link: res.url });
                                                }
                                              }}
                                              className={`text-[10px] px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1.5 ${
                                                newsBank.some(b => b.id === res.url) 
                                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                              }`}
                                            >
                                              {newsBank.some(b => b.id === res.url) ? '❌ إزالة' : '📥 حفظ بالبنك'}
                                            </button>
                                            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                                              {isSocial ? 'مشاهدة النقاش' : 'قراءة المزيد'} <span className="text-xs">←</span>
                                            </span>
                                          </div>
                                        </div>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {toolName === 'deep_research' && part.output.summary && (
                            <div className="relative mt-4">
                              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-md opacity-10"></div>
                              <div className="relative bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                                <h5 className="text-xs font-black text-purple-700 mb-3 flex items-center gap-2">
                                  <span className="text-lg">🧠</span>
                                  ملخص البحث المعمق (Advanced Analysis)
                                </h5>
                                <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                  {part.output.summary}
                                </div>
                                <div className="absolute top-4 left-4 text-purple-100 text-4xl font-black select-none opacity-40">"</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 🖼️ نتائج قراءة الصورة OCR */}
                      {toolName === 'image_ocr' && part.state === 'output-available' && part.output?.type === 'ocr_result' && (
                        <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">📄</span>
                            <h4 className="text-sm font-bold text-orange-700">النصوص المستخرجة من الصورة:</h4>
                          </div>
                          <div className="bg-white border border-orange-200 rounded-lg p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">
                            {part.output.text}
                          </div>
                          {part.output.confidence && (
                            <div className="mt-2 text-[10px] text-orange-600 font-medium">
                              دقة الاستخراج: {Math.round(part.output.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      )}

                      {/* 🌐 نتائج قراءة المواقع Web Fetch */}
                      {toolName === 'web_fetch' && part.state === 'output-available' && (
                        <div className="mt-3 bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🌐</span>
                            <h4 className="text-sm font-bold text-cyan-700">محتوى الموقع: {part.output.title}</h4>
                          </div>
                          <div className="bg-white border border-cyan-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner leading-relaxed">
                            {part.output.content || part.output.markdown || 'لا يوجد محتوى نصي متاح.'}
                          </div>
                          <a href={part.output.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[10px] text-cyan-600 font-bold hover:underline">
                             🔗 المصدر: {part.output.url}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm px-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic">Zoon Orchestrator يعمل...</span>
            </div>
          )}
        </div>

        {/* ── بنك المعلومات ── */}
        {newsBank.length > 0 && (
          <div className="border-t bg-amber-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowBank(!showBank)}
                className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
              >
                <span className="bg-amber-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {newsBank.length}
                </span>
                📋 بنك المعلومات {showBank ? '▲' : '▼'}
              </button>
              <div className="flex gap-1">
                <button
                  onClick={clearBank}
                  className="text-[10px] bg-red-100 hover:bg-red-200 text-red-600 px-2 py-0.5 rounded-full font-medium transition-colors"
                >
                  🗑️ مسح الكل
                </button>
              </div>
            </div>
            {showBank && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {newsBank.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2 bg-white rounded p-1.5 text-[10px] border border-amber-200">
                    <span className="font-bold text-amber-600">{i + 1}.</span>
                    <span className="flex-1 truncate text-gray-700 font-medium">{item.title}</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded">{item.source}</span>
                    <button onClick={() => removeFromBank(item.id)} className="text-red-400 hover:text-red-600">✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* اختيار وضع البحث ومدخلات المستخدم */}
        <div className="border-t p-3 bg-white flex flex-col gap-3">
          
          <div className="flex flex-wrap items-center gap-4">
            {/* محدد وضع البحث (Search Mode Selector) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">الوضع:</span>
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1 shadow-inner">
                {[
                  { id: 'auto', label: '🤖 تلقائي', color: 'peer-checked:bg-green-600 peer-checked:text-white' },
                  { id: 'web', label: '🌐 سريع', color: 'peer-checked:bg-blue-600 peer-checked:text-white' },
                  { id: 'deep', label: '🧠 معمق', color: 'peer-checked:bg-purple-600 peer-checked:text-white' },
                ].map(mode => (
                  <label key={mode.id} className="cursor-pointer">
                    <input 
                      type="radio" 
                      name="searchMode" 
                      className="sr-only peer" 
                      checked={searchMode === mode.id}
                      onChange={() => setSearchMode(mode.id as any)}
                    />
                    <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-300 text-gray-500 hover:bg-gray-200 ${mode.color}`}>
                      {mode.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* محدد التصنيف (Category Selector) */}
            <div className="flex items-center gap-2 border-r pr-4 border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">تصفية حسب:</span>
              <div className="flex bg-blue-50/30 p-1 rounded-xl gap-1 border border-blue-100/30">
                {[
                  { id: 'general', label: '🌐 الكل', color: 'peer-checked:bg-blue-500 peer-checked:text-white' },
                  { id: 'images', label: '🖼️ صور', color: 'peer-checked:bg-orange-500 peer-checked:text-white' },
                  { id: 'social', label: '💬 تواصل', color: 'peer-checked:bg-indigo-500 peer-checked:text-white' },
                  { id: 'news', label: '📰 أخبار', color: 'peer-checked:bg-red-500 peer-checked:text-white' },
                ].map(cat => (
                  <label key={cat.id} className="cursor-pointer">
                    <input 
                      type="radio" 
                      name="searchCategory" 
                      className="sr-only peer" 
                      checked={searchCategory === cat.id}
                      onChange={() => setSearchCategory(cat.id as any)}
                    />
                    <div className={`text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all duration-300 text-gray-400 hover:bg-white shadow-sm peer-checked:shadow-md ${cat.color}`}>
                      {cat.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || isLoading) return;

              let finalText = input;
              
              // ⚠️ إضافة تعليمات للوكيل بناءً على الوضع والتصنيف
              const toolPart = searchMode === 'deep' ? 'deep-research' : 'web-search';
              const forceTag = searchMode !== 'auto' ? `[FORCE_TOOL: ${toolPart}]` : '';
              const categoryTag = searchCategory !== 'general' ? `[CATEGORY: ${searchCategory}]` : '';
              
              if (forceTag || categoryTag) {
                finalText = `${forceTag} ${categoryTag} ${finalText}`.trim();
              }

              if (newsBank.length > 0) {
                const bankContext = newsBank.map((item, i) =>
                  `${i + 1}. "${item.title}" - المصدر: ${item.source} - الرابط: ${item.link}`
                ).join('\n');
                finalText = `${finalText}\n\n[محتوى بنك المهام المحفوظة (${newsBank.length} عنصر):]\n${bankContext}\n\nيرجى استخدام هذه المعلومات في ردك.`;
              }

              sendMessage({ text: finalText });
              setInput("");
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
               <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={newsBank.length > 0
                  ? `📋 لديك ${newsBank.length} أخبار محفوظة - اكتب أمرك...`
                  : searchCategory === 'images' ? "أدخل اسم الشيء الذي تريد جلب صوره..."
                  : searchCategory === 'social' ? "ما هو الموضوع الذي تريد معرفة رأي الناس فيه؟"
                  : searchMode === 'deep' ? "ما هو موضوع البحث المعمق؟ (سأقوم بتحليل شامل)"
                  : "اكتب هدفك هنا..."
                }
                disabled={isLoading}
                className={`w-full border-2 transition-all p-2.5 rounded-xl text-sm outline-none shadow-sm
                  ${searchCategory === 'images' ? 'border-orange-100 focus:border-orange-500' :
                    searchCategory === 'social' ? 'border-indigo-100 focus:border-indigo-500' :
                    searchMode === 'deep' ? 'border-purple-200 focus:border-purple-500' : 
                    searchMode === 'web' ? 'border-blue-200 focus:border-blue-500' :
                    'border-gray-200 focus:border-green-500'
                  }
                  disabled:bg-gray-100`}
              />
              {searchCategory !== 'general' && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 animate-pulse">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-400 font-bold border border-gray-200 uppercase tracking-tighter">
                    {searchCategory} mode
                  </span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input}
              className={`px-5 py-2.5 rounded-xl disabled:bg-gray-300 font-bold transition-all text-sm shadow-md flex items-center gap-2
                ${searchCategory === 'images' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                  searchCategory === 'social' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                  searchMode === 'deep' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 
                  searchMode === 'web' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
              <span>{isLoading ? '⏳ جاري...' : 'أرسل'}</span>
              {!isLoading && <span>▶</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
