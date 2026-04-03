'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zoonLibraryService, ZoonResource } from '@/domains/zoon-club/services/zoonLibraryService';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiPlus, FiBook, FiImage, FiVideo, FiLink, FiDownload, FiHeart, FiFileText } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function CircleLibraryPage() {
    const params = useParams();
    const router = useRouter();
    const circleId = params?.circleId as string;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [resources, setResources] = useState<ZoonResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'LINK' | 'PDF' | 'IMAGE' | 'VIDEO'>('ALL');

    useEffect(() => {
        if (circleId) {
            checkAuth();
            loadLibrary();
        }
    }, [circleId]);

    const checkAuth = async () => {
        const { data } = await supabase!.auth.getUser();
        if (data.user) setCurrentUserId(data.user.id);
    };

    const loadLibrary = async () => {
        setLoading(true);
        try {
            const data = await zoonLibraryService.getResources(circleId, currentUserId || undefined);
            setResources(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (resourceId: string) => {
        if (!currentUserId) return;
        
        // Optimistic UI Update
        setResources(prev => prev.map(res => {
            if (res.id === resourceId) {
                const isVoted = !res.is_voted_by_me;
                return {
                    ...res,
                    is_voted_by_me: isVoted,
                    votes_count: isVoted ? res.votes_count + 1 : res.votes_count - 1
                };
            }
            return res;
        }));

        try {
            await zoonLibraryService.toggleVote(resourceId, currentUserId);
        } catch (e) {
            console.error("Vote failed", e);
            loadLibrary(); // Revert on failure
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'PDF': return <FiFileText className="w-6 h-6 text-red-400" />;
            case 'IMAGE': return <FiImage className="w-6 h-6 text-purple-400" />;
            case 'VIDEO': return <FiVideo className="w-6 h-6 text-pink-400" />;
            case 'LINK': return <FiLink className="w-6 h-6 text-blue-400" />;
            default: return <FiBook className="w-6 h-6 text-gray-400" />;
        }
    };

    const filteredResources = filter === 'ALL' ? resources : resources.filter(r => r.resource_type === filter);

    return (
        <div className="min-h-screen bg-[#05070a] text-white p-6 relative overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                        مكتبة المعرفة (Archive)
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        {loading ? 'جاري التحميل...' : `${resources.length} مصدر معرفي متاح`}
                    </p>
                </div>
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <FiArrowLeft /> عودة للدائرة
                </button>
            </div>

            {/* Toolbar */}
            <div className="relative z-10 flex flex-wrap gap-4 justify-between items-center mb-10">
                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    {['ALL', 'PDF', 'LINK', 'IMAGE', 'VIDEO'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                filter === type 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {type === 'ALL' ? 'الكل' : type}
                        </button>
                    ))}
                </div>

                {/* Add Button */}
                <button 
                    onClick={() => alert('قريبا: سيتم تفعيل رفع الملفات في التحديث القادم')}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                    <FiPlus className="w-5 h-5" /> إضافة مصدر جديد
                </button>
            </div>

            {/* Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                    ))
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-white/20 flex flex-col items-center">
                        <FiBook className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg">المكتبة فارغة حالياً.</p>
                        <p className="text-sm">كن أول من يشارك المعرفة!</p>
                    </div>
                ) : (
                    filteredResources.map((res) => (
                        <motion.div
                            key={res.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0a0e17] group border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 transition-all hover:translate-y-[-2px] hover:shadow-xl shadow-black/50"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                                    {getIcon(res.resource_type)}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold bg-white/5 px-2 py-1 rounded">
                                        {res.resource_type}
                                    </span>
                                </div>
                            </div>

                            <a 
                                href={res.url || '#'} 
                                target="_blank" 
                                className="block text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2"
                            >
                                {res.title}
                            </a>
                            
                            <p className="text-sm text-white/40 mb-6 line-clamp-2 min-h-[40px]">
                                {res.description || 'لا يوجد وصف لهذا المصدر.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                        {res.author_name?.[0] || '?'}
                                    </div>
                                    <span className="text-xs text-white/40 truncate max-w-[100px]">
                                        {res.author_name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleVote(res.id)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                                            res.is_voted_by_me 
                                            ? 'bg-red-500/20 text-red-400' 
                                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                    >
                                        <FiHeart className={`w-3.5 h-3.5 ${res.is_voted_by_me ? 'fill-current' : ''}`} />
                                        {res.votes_count}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
