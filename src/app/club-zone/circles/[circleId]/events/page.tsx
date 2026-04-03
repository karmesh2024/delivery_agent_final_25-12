'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zoonEventsService, ZoonEvent } from '@/domains/zoon-club/services/zoonEventsService';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiPlus, FiCalendar, FiMapPin, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function CircleEventsPage() {
    const params = useParams();
    const router = useRouter();
    const circleId = params?.circleId as string;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [events, setEvents] = useState<ZoonEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });

    useEffect(() => {
        if (circleId) {
            checkAuth();
            loadEvents();
        }
    }, [circleId]);

    const checkAuth = async () => {
        const { data } = await supabase!.auth.getUser();
        if (data.user) setCurrentUserId(data.user.id);
    };

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await zoonEventsService.getEvents(circleId, currentUserId || undefined);
            setEvents(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleJoin = async (eventId: string) => {
        if (!currentUserId) return;
        // Optimistic Update
        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
                const attending = !ev.is_attending;
                return { 
                    ...ev, 
                    is_attending: attending,
                    attendees_count: attending ? ev.attendees_count + 1 : ev.attendees_count - 1
                };
            }
            return ev;
        }));

        try {
            await zoonEventsService.joinEvent(eventId, currentUserId);
        } catch (e) {
            console.error(e);
            loadEvents(); // Revert
        }
    };

    const handleCreate = async () => {
        if (!currentUserId || !newEvent.title || !newEvent.date) return;
        try {
            await zoonEventsService.createEvent({
                circle_id: circleId,
                organizer_id: currentUserId,
                title: newEvent.title,
                description: newEvent.description,
                event_date: new Date(newEvent.date).toISOString(),
                location_url: newEvent.location,
                status: 'UPCOMING'
            });
            setIsCreateOpen(false);
            setNewEvent({ title: '', description: '', date: '', location: '' });
            loadEvents();
            alert('تم إنشاء الفعالية بنجاح! 🎉');
        } catch (e) {
            console.error(e);
            alert('فشل الإنشاء');
        }
    };

    return (
        <div className="min-h-screen bg-[#05070a] text-white p-6 relative overflow-hidden" dir="rtl">
             {/* Header */}
             <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-500">
                        الفعاليات (The Gathering)
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        لقاءات حية ومناسبات مشتركة
                    </p>
                </div>
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <FiArrowLeft /> عودة للدائرة
                </button>
            </div>

            {/* Create Button */}
            <div className="relative z-10 mb-8">
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-pink-900/20 transition-all active:scale-95"
                >
                    <FiPlus className="w-5 h-5" /> تنظيم فعالية جديدة
                </button>
            </div>

            {/* Events List */}
            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-white/30">جاري تحميل الفعاليات...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                        <FiCalendar className="w-16 h-16 mx-auto mb-4 text-white/20" />
                        <h3 className="text-xl font-bold text-white/60">لا توجد فعاليات قادمة</h3>
                        <p className="text-sm text-white/30 mt-2">كن المبادر ونظم اللقاء الأول!</p>
                    </div>
                ) : (
                    events.map((ev, idx) => (
                        <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#0a0e17] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-pink-500/30 transition-all"
                        >
                            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-pink-500 to-orange-500" />
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Date Box */}
                                <div className="flex-shrink-0 flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/5 min-w-[80px]">
                                    <span className="text-xs text-white/40 uppercase font-bold">
                                        {new Date(ev.event_date).toLocaleString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-3xl font-black text-white">
                                        {new Date(ev.event_date).getDate()}
                                    </span>
                                    <span className="text-xs text-white/40">
                                        {new Date(ev.event_date).toLocaleString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-pink-400 transition-colors">
                                        {ev.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-4">
                                        <span className="flex items-center gap-1">
                                            <FiClock className="text-pink-500" /> 
                                            {new Date(ev.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiMapPin className="text-orange-500" /> 
                                            {ev.location_url ? 'أونلاين/رابط' : 'موقع محدد'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiUsers className="text-blue-500" /> 
                                            بواسطة: {ev.organizer_name}
                                        </span>
                                    </div>
                                    <p className="text-white/70 leading-relaxed text-sm">
                                        {ev.description || 'لا يوجد وصف إضافي.'}
                                    </p>
                                </div>

                                {/* Action */}
                                <div className="flex flex-col gap-2 min-w-[140px]">
                                    <button 
                                        onClick={() => handleJoin(ev.id)}
                                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                                            ev.is_attending 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                    >
                                        {ev.is_attending ? <FiCheckCircle /> : <FiCalendar />}
                                        {ev.is_attending ? 'مسجل' : 'حضور'}
                                    </button>
                                    <div className="text-center text-xs text-white/30">
                                        {ev.attendees_count} شخص سيحضرون
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0c101b] border border-white/10 w-full max-w-lg rounded-3xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">تنظيم فعالية جديدة</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/50 mb-2">عنوان الفعالية</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500"
                                        placeholder="مثال: ورشة عمل، جلسة نقاش..."
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">التاريخ</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                                            value={newEvent.date}
                                            onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">المكان / الرابط</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                                            placeholder="Zoom URL..."
                                            value={newEvent.location}
                                            onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-white/50 mb-2">التفاصيل</label>
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white h-24 resize-none"
                                        placeholder="صف الفعالية وأهدافها..."
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button 
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold"
                                >
                                    نشر الفعالية
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
