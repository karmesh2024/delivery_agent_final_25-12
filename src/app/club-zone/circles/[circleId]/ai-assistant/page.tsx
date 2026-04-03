'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zoonAiService, AiSettings } from '@/domains/zoon-club/services/zoonAiService';
import { FiCpu, FiSettings, FiSend, FiArrowLeft, FiActivity, FiZap, FiTarget, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiAssistantPage() {
    const params = useParams();
    const router = useRouter();
    const circleId = params?.circleId as string;

    const [settings, setSettings] = useState<AiSettings | null>(null);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (circleId) {
            loadSettings();
            // Initial greeting
            setMessages([{ role: 'ai', text: 'مرحباً بك في وعي الدائرة. أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟' }]);
        }
    }, [circleId]);

    const loadSettings = async () => {
        const data = await zoonAiService.getSettings(circleId);
        setSettings(data);
    };

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;
        
        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsThinking(true);

        try {
            const response = await zoonAiService.askAssistant(circleId, userText);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: 'عذراً، حدث تداخل في الوعي الرقمي. يرجى المحاولة لاحقاً.' }]);
        } finally {
            setIsThinking(false);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <div className="h-screen bg-[#05070a] text-white flex overflow-hidden font-sans" dir="rtl">
            {/* Sidebar Settings (Conditional) */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed inset-y-0 right-0 w-80 bg-[#0a0e17] border-l border-white/10 z-50 p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FiSettings className="text-blue-500" /> إعدادات الوعي
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-white/40 mb-2 uppercase">اسم المساعد</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                                    value={settings?.assistant_name}
                                    onChange={e => settings && setSettings({...settings, assistant_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 mb-2 uppercase">نوع الشخصية</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white"
                                    value={settings?.personality_type}
                                    onChange={e => settings && setSettings({...settings, personality_type: e.target.value as any})}
                                >
                                    <option value="BALANCED">متوازن</option>
                                    <option value="LOGICAL">منطقي / تحليلي</option>
                                    <option value="EMPATHETIC">عاطفي / داعم</option>
                                    <option value="CREATIVE">إبداعي / ملهم</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 mb-2 uppercase">نبض الدائرة (دستور)</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm h-32 resize-none"
                                    placeholder="أدخل تعليمات خاصة للمساعد..."
                                    value={settings?.custom_instructions}
                                    onChange={e => settings && setSettings({...settings, custom_instructions: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={() => settings && zoonAiService.updateSettings(circleId, settings).then(() => alert('تم تحديث بروتوكول الذكاء!'))}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
                            >
                                حفظ الإعدادات
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Background Decoration */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/20 blur-[100px] rounded-full" />
                </div>

                {/* Header */}
                <header className="p-6 border-b border-white/10 bg-[#0c101b]/50 backdrop-blur-md flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FiCpu className="w-7 h-7 text-white animate-spin-slow" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{settings?.assistant_name || 'Zoon AI'}</h1>
                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span>وعي الدائرة متصل</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm"
                    >
                        <FiSettings /> الضبط المتقدم
                    </button>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 z-10 custom-scrollbar">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[80%] flex items-start gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'ai' ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white/10'}`}>
                                        {msg.role === 'ai' ? <FiZap className="w-4 h-4" /> : <FiMessageCircle className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'ai' 
                                            ? 'bg-white/5 border border-white/10 text-blue-50' 
                                            : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 rounded-tr-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                           <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="flex gap-1">
                                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs text-white/40 font-medium">جاري تحليل البيانات...</span>
                           </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-10 z-10">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute -top-12 left-0 right-0 flex justify-center gap-3">
                            {['كيف نحسن التناغم؟', 'حلل أعضاء الدائرة', 'ما هي روح الدائرة؟'].map((suggest, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setInput(suggest)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 hover:text-white hover:border-blue-500/50 transition-all uppercase font-bold"
                                >
                                    {suggest}
                                </button>
                            ))}
                        </div>
                        <form 
                            onSubmit={e => { e.preventDefault(); handleSend(); }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl backdrop-blur-xl focus-within:border-blue-500 transition-all"
                        >
                            <input 
                                className="flex-1 bg-transparent border-none px-6 py-4 text-white focus:outline-none placeholder-white/20"
                                placeholder="اسأل وعي الدائرة عن أي شيء..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isThinking}
                                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-600/30"
                            >
                                <FiSend className="w-5 h-5 text-white" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
