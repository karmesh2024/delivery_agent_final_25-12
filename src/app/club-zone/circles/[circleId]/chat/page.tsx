'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { zoonCirclesService, ZoonCircleMember } from '@/domains/zoon-club/services/zoonCirclesService';
import { zoonChatService, ChatMessage } from '@/domains/zoon-club/services/zoonChatService';
import { FiMessageSquare, FiUsers, FiSend, FiArrowLeft, FiMoreVertical, FiLock, FiActivity, FiHash } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { archetypeEngine } from '@/domains/zoon-club/services/archetypeEngine.service'; // Correct path assumed
import { EmotionalShield } from '@/domains/zoon-club/components/chat/EmotionalShield';

// Types
type ChatMode = 'GROUP' | 'DIRECT';

export default function CircleChatPage() {
    const params = useParams();
    const router = useRouter();
    const circleId = params?.circleId as string;

    // State
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [members, setMembers] = useState<ZoonCircleMember[]>([]);
    
    // Chat Selection
    const [activeMode, setActiveMode] = useState<ChatMode>('GROUP');
    const [activeDirectUser, setActiveDirectUser] = useState<ZoonCircleMember | null>(null);
    const [activeDirectChatId, setActiveDirectChatId] = useState<string | null>(null);
    
    // Messages
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        if (circleId) {
            checkAuth();
            loadMembers();
        }
    }, [circleId]);

    // Auth Check
    const checkAuth = async () => {
        const { data } = await supabase!.auth.getUser();
        if (data.user) {
            setCurrentUserId(data.user.id);
        } else {
            // Force login or redirect
        }
    };

    // Load Members
    const loadMembers = async () => {
        try {
            const data = await zoonCirclesService.getCircleMembers(circleId);
            setMembers(data);
        } catch (e) { console.error(e); }
    };

    // Chat Switcher Logic
    useEffect(() => {
        if (!circleId || !currentUserId) return;

        let channel: any;

        const connectToChat = async () => {
            setLoading(true);
            setMessages([]); // Clear previous messages

            if (activeMode === 'GROUP') {
                // 📢 Connect to Group Chat
                try {
                    const groupMsgs = await zoonChatService.getMessages(circleId);
                    setMessages(groupMsgs.map(m => ({ ...m, is_mine: m.sender_id === currentUserId })));
                    
                    channel = zoonChatService.subscribeToChat(circleId, (msg) => {
                        setMessages(prev => [...prev, { ...msg, is_mine: msg.sender_id === currentUserId }]);
                        scrollToBottom();
                    }, false); // isDirect = false
                } catch(e) { console.error(e); }

            } else if (activeMode === 'DIRECT' && activeDirectUser) {
                // 🔒 Connect to Direct Chat
                try {
                    // Open/Create chat session
                    const chatId = await zoonChatService.openDirectChat(currentUserId, activeDirectUser.user_id!);
                    setActiveDirectChatId(chatId);

                    const directMsgs = await zoonChatService.getDirectMessages(chatId);
                    setMessages(directMsgs.map(m => ({ ...m, is_mine: m.sender_id === currentUserId })));

                    channel = zoonChatService.subscribeToChat(chatId, (msg) => {
                         setMessages(prev => [...prev, { ...msg, is_mine: msg.sender_id === currentUserId }]);
                         scrollToBottom();
                    }, true); // isDirect = true
                } catch(e) { console.error(e); }
            }
            
            setLoading(false);
            scrollToBottom();
        };

        connectToChat();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [activeMode, activeDirectUser, circleId, currentUserId]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !currentUserId) return;
        
        const content = inputValue;
        setInputValue(''); // Optimistic clear

        try {
            if (activeMode === 'GROUP') {
                await zoonChatService.sendMessage(circleId, content, currentUserId);
            } else if (activeMode === 'DIRECT' && activeDirectChatId) {
                await zoonChatService.sendDirectMessage(activeDirectChatId, content, currentUserId);
            }

            // 🧠 Fire & Forget Analysis
            analyzeMessageBackground(content);
            
        } catch (e: any) {
            console.error("Send failed", e);
            alert("فشل الإرسال: " + (e.message || "خطأ غير معروف"));
            setInputValue(content); // Restore input on fail
        }
    };

    const switchToDirect = (member: ZoonCircleMember) => {
        if (member.user_id === currentUserId) return;
        setActiveDirectUser(member);
        setActiveMode('DIRECT');
    };

    // 🧠 Psychological Engine Integration
    const [toneInstruction, setToneInstruction] = useState<string | null>(null);
    const [isConsented, setIsConsented] = useState(false);

    // التحليل النفسي للخلفية (Fire & Forget)
    const analyzeMessageBackground = async (text: string) => {
        if (!currentUserId || !isConsented) return;
        try {
            // 1. تحديث الملف النفسي (EXP Decay)
            await advancedPsychologicalEngine.analyzeCommentAdaptive(currentUserId, text);
            
            // 2. كشف التحول العاطفي (Mood Shift) للمحادثة الحالية
            const recentMsgs = messages.slice(-5).map(m => m.content); // آخر 5 رسائل للفحص
            const activeShift = archetypeEngine.detectMoodShift([...recentMsgs, text]);

            if (activeShift.shouldOverrideTone) {
                console.log("⚠️ Mood Shift Detected:", activeShift.dominantEmotion);
                // هنا يمكننا مستقبلاً تفعيل "Alert" للمستخدم أو للأدمن
            }
        } catch (e) {
            console.error("Analysis Error", e);
        }
    };

    const switchToGroup = () => {
        setActiveDirectUser(null);
        setActiveDirectChatId(null);
        setActiveMode('GROUP');
    };


    if (!currentUserId) return <div className="p-10 text-white">Loading Auth...</div>;

    return (
        <div className="flex h-screen bg-[#05070a] text-white overflow-hidden" dir="rtl">
            
            {/* 1. Sidebar (Members List) */}
            <div className="w-80 border-l border-white/10 bg-[#0a0e17] flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4">
                        <FiArrowLeft /> عودة للدائرة
                    </button>
                    <h2 className="text-xl font-bold">المحادثات</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Group Chat Button */}
                    <button 
                        onClick={switchToGroup}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                            activeMode === 'GROUP' 
                            ? 'bg-blue-600 shadow-lg shadow-blue-900/20' 
                            : 'hover:bg-white/5 text-white/60'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <FiUsers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-right">
                            <div className="font-bold">القاعة الرئيسية</div>
                            <div className="text-xs opacity-60">الدردشة الجماعية</div>
                        </div>
                    </button>

                    <div className="text-xs font-bold text-white/40 uppercase mt-6 mb-2 px-2">الأعضاء ({members.length - 1})</div>
                    
                    {/* Members List */}
                    {members
                        .filter(m => m.user_id !== currentUserId) // Show everyone except me
                        .map(member => (
                        <button
                            key={member.id}
                            disabled={!member.user_id} // Cannot chat if no user_id
                            onClick={() => switchToDirect(member)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                activeDirectUser?.id === member.id 
                                ? 'bg-white/10 border border-white/10' 
                                : 'hover:bg-white/5 text-white/60'
                            } ${!member.user_id ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <div className="relative">
                                <img 
                                    src={member.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${member.name}`} 
                                    className="w-10 h-10 rounded-full object-cover bg-black"
                                />
                                {member.is_host && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-[#0a0e17] flex items-center justify-center">
                                        <span className="text-[8px] leading-none">👑</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex-1 min-w-0">
                                <div className="font-bold truncate text-sm flex items-center gap-2">
                                    {member.name}
                                    {/* Smart Tag */}
                                    {member.archetype && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px]">
                                            {member.archetype}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs opacity-50 truncate flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                    {member.role || 'عضو'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#05070a] relative">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0c101b]">
                    <div className="flex items-center gap-4">
                        {activeMode === 'GROUP' ? (
                            <>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                                    <FiHash className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">القاعة الرئيسية (Agora)</h1>
                                    <p className="text-sm text-white/40">مساحة للحوار المفتوح مع الجميع</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <img 
                                    src={activeDirectUser?.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${activeDirectUser?.name}`} 
                                    className="w-12 h-12 rounded-full border-2 border-green-500/50"
                                />
                                <div>
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        {activeDirectUser?.name || 'عضو'}
                                        <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">متصل (Direct)</span>
                                    </h1>
                                    <p className="text-sm text-white/40">{activeDirectUser?.role || 'عضو'}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-white/30 animate-pulse">
                            جاري تحميل المحادثات...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <FiMessageSquare className="w-16 h-16 mb-4 opacity-30" />
                            <p>بداية المحادثة. قل مرحباً! 👋</p>
                            {activeMode === 'DIRECT' && (
                                <p className="text-xs mt-2 text-white/10 max-w-xs text-center">
                                    تذكير: التواصل الخاص يخضع لقواعد الاحترام المتبادل في Zoon Club.
                                </p>
                            )}
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <motion.div 
                                key={msg.id || idx} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.is_mine ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0 pt-1">
                                    <img 
                                        src={msg.sender_details?.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${msg.sender_details?.name}`} 
                                        className="w-10 h-10 rounded-full object-cover bg-white/5"
                                    />
                                </div>
                                
                                {/* Message Body */}
                                <div className={`max-w-[70%] group flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                        <span className="text-sm font-bold text-white/80">{msg.sender_details?.name}</span>
                                        <span className="text-xs text-white/30">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    
                                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm relative ${
                                        msg.is_mine 
                                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                                            : 'bg-white/10 text-gray-200 rounded-tl-sm hover:bg-white/15 transition-colors'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-[#0c101b] border-t border-white/5">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="bg-white/5 border border-white/10 rounded-2xl flex items-center p-2 focus-within:ring-2 ring-blue-500/50 transition-all"
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={activeMode === 'GROUP' ? "اكتب رسالة للمجموعة..." : `رسالة خاصة لـ ${activeDirectUser?.name}...`}
                            className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-white/20"
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                        >
                            <FiSend className={`w-5 h-5 ${inputValue.trim() ? '-rotate-45 translate-x-0.5' : ''} transition-transform`} />
                        </button>
                    </form>
                </div>
            </div>

            {/* 🛡️ Privacy Shield Overlay */}
            <EmotionalShield 
                onToneReady={(instruction) => setToneInstruction(instruction)}
                onConsentChange={(consented) => setIsConsented(consented)}
            />
        </div>
    );
}
