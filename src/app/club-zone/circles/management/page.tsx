'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchZoonCircles, 
  createZoonCircle, 
  updateZoonCircle,
  fetchCircleConnections,
  addCircleMember,
  addCircleResource,
  fetchZoonCategories,
  createZoonCategory,
  deleteZoonCategory,
  createCircleConnection,
  updateCircleConnection,
  deleteCircleConnection,
  fetchAvailableClubMembers
} from '@/domains/zoon-club/store/zoonCirclesSlice';
import { CosmicCanvas } from '@/domains/zoon-club/components/circles/CosmicCanvas';
import { CircleDialog } from '@/domains/zoon-club/components/circles/CircleDialog';
import { CategoryManagementDialog } from '@/domains/zoon-club/components/circles/CategoryManagementDialog';
import { ConnectionDetailsDialog } from '@/domains/zoon-club/components/circles/ConnectionDetailsDialog';
import { TransferDialog } from '@/domains/zoon-club/components/circles/TransferDialog';
import { deleteCircleMember, moveToOuterZone, removeFromOuterZone } from '@/domains/zoon-club/store/zoonCirclesSlice';
import { DirectLinkDialog } from '@/domains/zoon-club/components/circles/DirectLinkDialog';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { FiPlus, FiUsers, FiSearch, FiBookOpen, FiHeadphones, FiGift, FiHeart, FiHome, FiUser, FiSettings, FiLayout, FiEye, FiEyeOff, FiLink, FiTrash2 } from 'react-icons/fi';
import { ZoonCircle, ZoonCircleConnection, ZoonCircleMember, ZoonCircleResource } from '@/domains/zoon-club/services/zoonCirclesService';
import { motion, AnimatePresence } from 'framer-motion';

// الموارد المتاحة
const RESOURCES = [
  { id: 'avatar', icon: <FiUser />, label: 'أفاتار', color: '#3b82f6' },
  { id: 'books', icon: <FiBookOpen />, label: 'كتب', color: '#22c55e' },
  { id: 'audio', icon: <FiHeadphones />, label: 'صوتيات', color: '#f59e0b' },
  { id: 'home', icon: <FiHome />, label: 'بيوتنا', color: '#8b5cf6' },
  { id: 'heart', icon: <FiHeart />, label: 'قلب', color: '#ef4444' },
  { id: 'gift', icon: <FiGift />, label: 'هدايا', color: '#ec4899' },
];

export default function CirclesManagementPage() {
  const dispatch = useAppDispatch();
  const { 
    circles: dbCircles, 
    connections: dbConnections, 
    categories: dbCategories, 
    membersMap, 
    outerZoneMembers, 
    availableClubMembers,
    loading 
  } = useAppSelector((state) => state.zoonCircles);
  
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConnections, setShowConnections] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<ZoonCircleConnection | null>(null);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState('SUGGESTIONS');
  const [isCircleDialogOpen, setIsCircleDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // حالات حوار النقل (Transfer)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState<{
    member: ZoonCircleMember | null;
    fromCircle: ZoonCircle | null;
    toCircle: ZoonCircle | null;
  }>({ member: null, fromCircle: null, toCircle: null });
  
  // حالات الربط المباشر
  const [isDirectLinkDialogOpen, setIsDirectLinkDialogOpen] = useState(false);
  const [memberForAction, setMemberForAction] = useState<ZoonCircleMember | null>(null);

  // حساب عدد العناصر في كل فلتر
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { 'ALL': dbCircles.length };
    dbCircles.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return counts;
  }, [dbCircles]);

  // قائمة العلاقات النشطة للعرض في القائمة
  const activeConnectionsList = useMemo(() => {
    return dbConnections.map(conn => {
      const from = dbCircles.find(c => c.id === conn.from_circle_id);
      const to = dbCircles.find(c => c.id === conn.to_circle_id);
      
      const fromMember = conn.from_member_id ? 
        Object.values(membersMap).flat().find(m => m.id === conn.from_member_id) : null;
      const toMember = conn.to_member_id ? 
        Object.values(membersMap).flat().find(m => m.id === conn.to_member_id) : null;

      return { 
        ...conn, 
        fromName: from?.name, 
        toName: to?.name,
        fromMemberName: fromMember?.name,
        toMemberName: toMember?.name
      };
    });
  }, [dbConnections, dbCircles, membersMap]);

  // دمج الفلاتر الأساسية مع الفلاتر المخصصة من قاعدة البيانات
  const allCategories = useMemo(() => {
    const baseFilters = [
      { id: 'ALL', name: 'الكل', icon: '🌌', count: dbCircles.length }
    ];
    return [...baseFilters, ...dbCategories];
  }, [dbCategories, dbCircles]);

  // فلترة الدوائر حسب النوع
  const circles = useMemo(() => {
    if (activeFilter === 'ALL') return dbCircles;
    return dbCircles.filter(c => c.type === activeFilter);
  }, [dbCircles, activeFilter]);

  const selectedCircle = useMemo(() => {
    return dbCircles.find(c => c.id === selectedCircleId) || null;
  }, [dbCircles, selectedCircleId]);

  // فلترة الروابط (نستخدم dbConnections المجلوبة من قاعدة البيانات)
  const connections = useMemo(() => {
    return dbConnections;
  }, [dbConnections]);

  useEffect(() => {
    dispatch(fetchZoonCircles());
    dispatch(fetchZoonCategories());
    dispatch(fetchAvailableClubMembers());
  }, [dispatch]);

  useEffect(() => {
    if (dbCircles.length > 0) {
      const ids = dbCircles.map(c => c.id);
      dispatch(fetchCircleConnections(ids));
    }
  }, [dbCircles, dispatch]);

  const handleCreateOrUpdateCircle = async (values: Partial<ZoonCircle>) => {
    // تجهيز البيانات: تحويل المصفوفات إلى نصوص مفصولة بأسطر للحفظ في قاعدة البيانات إذا كانت مصفوفات
    const formattedValues = {
      ...values,
      constitution: Array.isArray(values.constitution) ? values.constitution.join('\n') : values.constitution,
      essence: Array.isArray(values.essence) ? values.essence.join('\n') : values.essence,
      compass: Array.isArray(values.compass) ? values.compass.join('\n') : values.compass,
      soul_filter: Array.isArray(values.soul_filter) ? values.soul_filter.join('\n') : values.soul_filter,
    };

    try {
      if (selectedCircle) {
        await dispatch(updateZoonCircle({ id: selectedCircle.id, updates: formattedValues })).unwrap();
        alert('تم تحديث أبعاد الدائرة بنجاح');
      } else {
        const newCircle = {
          ...formattedValues,
          position_x: 2500 + (Math.random() - 0.5) * 500,
          position_y: 2500 + (Math.random() - 0.5) * 500,
          scale: 1,
        };
        await dispatch(createZoonCircle(newCircle)).unwrap();
        dispatch(fetchZoonCategories());
      }
    } catch (error: any) {
      alert(`فشل الحفظ: ${error.message}`);
    }
    setIsCircleDialogOpen(false);
  };

  const handleAddMember = async (user: any) => {
    if (!selectedCircle) {
      alert('يرجى تحديد دائرة أولاً لإضافة العضو إليها');
      return;
    }

    if (['1', '2', '3'].includes(selectedCircle.id)) {
      alert('عذراً، لا يمكن الإضافة إلى الدوائر التجريبية.');
      return;
    }

    try {
      await dispatch(addCircleMember({
        circle_id: selectedCircle.id,
        name: user.name,
        compatibility: user.match,
        role: 'MEMBER'
      })).unwrap();
      alert(`تم إضافة ${user.name} إلى ${selectedCircle.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Add Member Error:', error);
      alert(`فشل الإضافة: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  const handleAddResource = async (res: any) => {
    if (!selectedCircle) {
      alert('يرجى تحديد دائرة أولاً لإضافة المورد إليها');
      return;
    }

    if (['1', '2', '3'].includes(selectedCircle.id)) {
      alert('عذراً، لا يمكن الإضافة إلى الدوائر التجريبية.');
      return;
    }

    const resourceMapping: Record<string, string> = {
      'books': 'BOOK', 'audio': 'AUDIO', 'gift': 'GIFT', 'avatar': 'AI_ASSISTANT', 'home': 'DOCUMENT', 'heart': 'GIFT'
    };

    try {
      await dispatch(addCircleResource({
        circle_id: selectedCircle.id,
        type: (resourceMapping[res.id] || 'DOCUMENT') as any,
        name: res.label,
        data: {}
      })).unwrap();
      
      alert(`تم إضافة مورد (${res.label}) إلى ${selectedCircle.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      alert(`فشل إضافة المورد: ${error.message}`);
    }
  };

  const handleMemberMove = async (member: ZoonCircleMember, fromCircleId: string, toCircleId: string) => {
    const fromCircle = dbCircles.find(c => c.id === fromCircleId);
    const toCircle = dbCircles.find(c => c.id === toCircleId);
    
    if (member && fromCircle && toCircle) {
      setTransferData({ member, fromCircle, toCircle });
      setIsTransferDialogOpen(true);
    }
  };

  const handleConfirmTransfer = async (type: 'move' | 'copy', reason: string) => {
    const { member, fromCircle, toCircle } = transferData;
    if (!member || !fromCircle || !toCircle) return;

    try {
      console.log(`[Cosmic Sync] Executing ${type} for member: ${member.name}`);

      // 1. إضافة العضو للدائرة الجديدة (دائماً سواء نقل أو نسخ)
      await dispatch(addCircleMember({
        circle_id: toCircle.id,
        name: member.name,
        compatibility: member.compatibility,
        avatar_url: member.avatar_url,
        role: member.role || 'MEMBER'
      })).unwrap();

      // 2. إذا كان نوع العملية "نقل" (Move)، نقوم بحذف العضو من الدائرة القديمة
      if (type === 'move') {
        await dispatch(deleteCircleMember(member.id)).unwrap();
      }

      // 3. إنشاء الرابط (Connection) بنوع يعكس العملية
      try {
        await dispatch(createCircleConnection({
          from_circle_id: fromCircle.id,
          to_circle_id: toCircle.id,
          from_member_id: type === 'move' ? undefined : member.id, // إذا كان نسخ، نربط الشخص، إذا كان نقل قد يكون السياق تغير
          connection_type: type === 'move' ? 'TRANSFER' : 'COPY',
          strength: type === 'move' ? 0.8 : 0.9,
          shared_members_count: 1,
          reason: reason || (type === 'move' ? `انتقال كامل من ${fromCircle.name}` : `نسخ/ازدواجية دور في ${toCircle.name}`)
        })).unwrap();
      } catch (connError: any) {
        console.warn('Connection failed, skipping link', connError);
      }

      setRefreshKey(prev => prev + 1);
      alert(type === 'move' ? `🚀 تم الانتقال الكامل لـ ${member.name}!` : `✨ تم منح ${member.name} دوراً إضافياً في الدائرة الجديدة.`);
    } catch (error: any) {
      console.error('Transfer Error:', error);
      alert(`⚠️ عذراً، فشلت العملية: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  const handleResourceMove = async (resource: ZoonCircleResource, fromCircleId: string, toCircleId: string) => {
    try {
      // نقل المورد للدائرة الجديدة
      await dispatch(addCircleResource({
        circle_id: toCircleId,
        type: resource.type,
        name: resource.name,
        data: resource.data
      })).unwrap();

      // إنشاء رابط بصري
      await dispatch(createCircleConnection({
        from_circle_id: fromCircleId,
        to_circle_id: toCircleId,
        connection_type: 'PROJECT',
        strength: 0.5,
        reason: `مشاركة مورد: ${resource.name}`
      })).unwrap();

      setRefreshKey(prev => prev + 1);
      alert(`تم نقل المورد ${resource.name} بنجاح! 📦`);
    } catch (error: any) {
      console.error('Resource Move Error:', error);
      alert(`فشل نقل المورد: ${error.message}`);
    }
  };

  const handleCircleMove = async (circleId: string, x: number, y: number) => {
    try {
      await dispatch(updateZoonCircle({ id: circleId, updates: { position_x: x, position_y: y } })).unwrap();
    } catch (error) {
      console.error('Failed to move circle:', error);
    }
  };

  const handleMemberAction = (member: ZoonCircleMember, action: 'EXIT' | 'LINK') => {
    if (action === 'EXIT') {
       dispatch(moveToOuterZone(member.id));
       alert(`تم نقل ${member.name} إلى الـ Outer Zone للمتابعة.`);
    } else {
       setMemberForAction(member);
       setIsDirectLinkDialogOpen(true);
    }
  };

  const handleDirectLinkToCircle = async (toCircleId: string, reason: string) => {
    if (!memberForAction) return;
    const fromCircleId = Object.keys(membersMap).find(id => membersMap[id].some(m => m.id === memberForAction.id));
    if (!fromCircleId) return;

    try {
      await dispatch(createCircleConnection({
        from_circle_id: fromCircleId,
        to_circle_id: toCircleId,
        from_member_id: memberForAction.id,
        connection_type: 'SOCIAL', // Fix for lint error: using a valid ZoonCircleConnectionType
        strength: 0.9,
        reason: reason
      })).unwrap();
      alert('تم إنشاء الرابط المباشر بنجاح 🔗');
    } catch (error: any) {
      alert(`فشل الربط: ${error.message}`);
    }
  };

  const handleSendToPerson = (personId: string, reason: string) => {
    if (!memberForAction) return;
    
    // التوصية تعني بقاء العضو في دائرته مع إرسال إشارة للوكيل الآخر
    // لمحاكاة ذلك، سنكتفي بإظهار رسالة النجاح (وفي الحقيقي يتم الحفظ في جدول recommendations)
    alert(`📡 تم إرسال توصية ذكية لـ ${memberForAction.name} إلى الوكيل المختار. سيظل العضو تحت إدارتك مع ظهوره كاقتراح مدعوم بالسبب عند زميلك.`);
    
    // لا نحتاج لاستدعاء moveToOuterZone هنا
  };

  return (
    <DashboardLayout title="إدارة الدوائر والعلاقات">
      <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-slate-50">
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative flex flex-col">
          
          {/* Top Info Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
             <div className="flex gap-2 pointer-events-auto">
                <button className="p-3 bg-white shadow-xl rounded-2xl hover:bg-blue-50 transition-colors group">
                  <FiLayout className="text-xl text-slate-400 group-hover:text-blue-600" />
                </button>
             </div>
             
             <div className="flex flex-col items-end gap-2 pointer-events-auto">
                <AnimatePresence>
                  {selectedCircle && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-inner" style={{ backgroundColor: `${selectedCircle.color}20` }}>
                         {selectedCircle.icon}
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter">الدائرة المحددة</div>
                         <div className="text-slate-800 font-black">{selectedCircle.name}</div>
                      </div>
                      <div className="h-8 w-px bg-slate-100 mx-2" />
                      <button 
                        onClick={() => setIsCircleDialogOpen(true)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                        title="إعدادات ذكية"
                      >
                         <FiSettings className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* Canvas Component */}
          <div className="absolute inset-0 z-0">
            <CosmicCanvas 
              circles={circles} 
              connections={connections}
              activeCircleId={selectedCircleId}
              refreshKey={refreshKey}
              onCircleClick={(c) => setSelectedCircleId(c.id)}
              onMemberMove={handleMemberMove}
              onResourceMove={handleResourceMove}
              onCircleMove={handleCircleMove}
              onMemberAction={handleMemberAction}
              showConnections={showConnections}
              onConnectionClick={(conn) => {
                setSelectedConnection(conn);
                setIsConnectionDialogOpen(true);
              }}
            />
          </div>

          {/* Bottom Filter & Actions Bar */}
          <div className="absolute bottom-6 left-6 right-6 z-20">
             <div className="max-w-4xl mx-auto flex flex-col gap-4">
                
                {/* Categories Flow */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 px-2 no-scrollbar">
                   {allCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.name === 'الكل' ? 'ALL' : cat.name)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap shadow-xl border border-white/5 ${
                          (activeFilter === 'ALL' && cat.id === 'ALL') || activeFilter === cat.name
                            ? 'bg-blue-600 text-white translate-y--1 shadow-blue-500/20' 
                            : 'bg-slate-900/40 backdrop-blur-xl text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        {cat.name}
                      </button>
                   ))}
                   
                   <button 
                      onClick={() => setIsCategoryDialogOpen(true)}
                      className="flex-shrink-0 w-11 h-11 rounded-2xl bg-slate-900/40 backdrop-blur-xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all shadow-xl"
                       title="صمم أنواع الدوائر"
                   >
                      <FiPlus className="w-5 h-5" />
                   </button>
                </div>

                {/* Horizontal Circles Bar */}
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-3 rounded-full shadow-2xl flex items-center gap-3">
                   <button 
                      onClick={() => { setSelectedCircleId(null); setIsCircleDialogOpen(true); }}
                      className="w-14 h-14 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 shrink-0"
                   >
                      <FiPlus className="text-2xl" />
                   </button>
                   
                   <div className="h-10 w-px bg-white/10 mx-1" />
                   
                   <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                      {circles.map(circle => (
                        <motion.button
                          key={circle.id}
                          onClick={() => setSelectedCircleId(circle.id)}
                          whileHover={{ scale: 1.1, y: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className={`flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all shadow-md relative group ${
                            selectedCircle?.id === circle.id ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                          }`}
                          style={{ background: `linear-gradient(135deg, ${circle.color}, ${circle.color}dd)` }}
                        >
                          <span className="text-2xl">{circle.icon}</span>
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                             {circle.name}
                          </div>
                        </motion.button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-slate-900 border-r border-white/5 flex flex-col shadow-2xl z-10">
          <div className="p-6 border-b border-white/5">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                   <FiUsers className="text-blue-500" /> اقتراحات ذكية
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg font-bold border border-emerald-500/20">نشط الآن</span>
             </div>
             <div className="relative group">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو الرقم..." 
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pr-11 pl-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 font-medium"
                 />
             </div>
          </div>

          <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="flex-1 flex flex-col overflow-hidden">
             <TabsList className="mx-4 mt-2 mb-2 p-1 bg-slate-800/50 rounded-xl grid grid-cols-3 border border-white/5">
                <TabsTrigger value="SUGGESTIONS" className="rounded-lg text-[10px] font-black py-1.5 px-0 text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">اقتراحات</TabsTrigger>
                <TabsTrigger value="CONNECTIONS" className="rounded-lg text-[10px] font-black py-1.5 px-0 text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">الروابط</TabsTrigger>
                <TabsTrigger value="RESOURCES" className="rounded-lg text-[10px] font-black py-1.5 px-0 text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">المحتوى</TabsTrigger>
             </TabsList>

             <TabsContent value="SUGGESTIONS" className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar mt-0">
                {/* Outer Zone Section (The Radar) */}
                {outerZoneMembers.length > 0 && (
                   <div className="mb-6 space-y-3">
                      <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                         Outer Zone (الرادار)
                      </h3>
                      <div className="space-y-2">
                        {outerZoneMembers.map(member => (
                           <motion.div 
                             key={member.id}
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className="bg-orange-400/5 border border-orange-400/20 p-3 rounded-2xl flex items-center justify-between group"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg border border-white/5 overflow-hidden">
                                    {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs text-orange-400">{member.name.charAt(0)}</span>}
                                 </div>
                                 <div className="text-xs font-bold text-white">{member.name}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => {
                                    if (!selectedCircleId) {
                                       alert("يرجى تحديد دائرة لاستقبال العضو");
                                       return;
                                    }
                                    dispatch(addCircleMember({ circle_id: selectedCircleId, name: member.name, compatibility: member.compatibility }));
                                    dispatch(removeFromOuterZone(member.id));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-emerald-400 hover:text-white transition-all bg-emerald-400/10 rounded-lg hover:bg-emerald-500"
                                  title="إعادة للمدار"
                                >
                                   <FiPlus className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف ${member.name} نهائياً من الرادار؟`)) {
                                      dispatch(removeFromOuterZone(member.id));
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-white transition-all bg-rose-400/10 rounded-lg hover:bg-rose-500"
                                  title="حذف نهائي"
                                >
                                   <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </motion.div>
                        ))}
                      </div>
                      <div className="h-px bg-white/5 mx-2" />
                   </div>
                )}

                {(availableClubMembers || [])
                  .filter(u => 
                    (u.phone_number && u.phone_number.includes(searchPhone)) || 
                    (u.name && u.name.includes(searchPhone))
                  ).map((user) => {
                   const getMatchInfo = (score: number) => {
                     if (score >= 85) return { color: 'text-emerald-500', arrow: '↗️', label: 'متوافق جداً' };
                     if (score >= 70) return { color: 'text-blue-500', arrow: '→', label: 'متوافق' };
                     return { color: 'text-rose-500', arrow: '↘️', label: 'توافق منخفض' };
                   };
                   const info = getMatchInfo(user.compatibility);

                   return (
                     <motion.div 
                       key={user.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl shadow-xl hover:shadow-blue-500/5 transition-all group"
                     >
                       <div className="flex items-start gap-4 mb-3">
                           <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl group-hover:bg-blue-600/20 transition-colors border border-white/5 overflow-hidden">
                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : '👤'}
                           </div>
                          <div className="flex-1">
                             <h4 className="font-bold text-white text-sm">{user.name}</h4>
                             <div className={`text-[10px] font-bold flex items-center gap-1 ${info.color}`}>
                                {info.arrow} {info.label} توافق {user.compatibility}%
                                {(user as any).confidence !== undefined && (
                                  <span title={`جودة البيانات: ${(user as any).confidence}%`} className="mr-1 cursor-help opacity-70 hover:opacity-100 flex items-center gap-0.5">
                                    {(user as any).confidence > 90 ? '✅' : (user as any).confidence >= 60 ? '⚠️' : '❓'}
                                    <span className="text-[9px] font-mono">{(user as any).confidence}%</span>
                                  </span>
                                )}
                              </div>
                             {user.archetype && (
                               <div className="mt-1 flex gap-1 flex-wrap">
                                 <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${
                                   user.archetype === 'LEADER' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                   user.archetype === 'INNOVATOR' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                   user.archetype === 'ANALYST' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                   user.archetype === 'HARMONIZER' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                   'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                 }`}>
                                   {user.archetype}
                                 </span>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddMember(user)}
                            className="flex-1 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                          >
                            ➕ أضف للزوون
                          </button>

                          <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const btn = e.currentTarget;
                                btn.innerHTML = '⏳';
                                try {
                                  // استيراد الخدمات ديناميكياً لتجنب مشاكل الاعتماد الدائري
                                  const { supabase } = await import('@/lib/supabase');
                                  const { zoonMindEngineService } = await import('@/domains/zoon-club/services/zoonMindEngineService');
                                  
                                  const archetypes = ['LEADER', 'INNOVATOR', 'ANALYST', 'HARMONIZER', 'ENTHUSIAST', 'REALIST', 'BALANCED'];
                                  const currentIdx = archetypes.indexOf(user.archetype || 'BALANCED');
                                  const nextArchetype = archetypes[(currentIdx + 1) % archetypes.length];
                                  
                                  const newProfile = zoonMindEngineService.simulateProfile(user.id, nextArchetype);
                                  await supabase!.from('zoon_psychological_profiles').upsert(newProfile);
                                  
                                  window.location.reload(); 
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  btn.innerHTML = '🎲'; 
                                }
                              }}
                              className="w-10 rounded-xl bg-slate-700/50 text-white/50 hover:bg-purple-600 hover:text-white border border-white/5 flex items-center justify-center text-sm transition-all"
                              title={`محاكاة نمط ${user.archetype}`}
                           >
                             🎲
                           </button>
                          {user.compatibility >= 85 && (
                            <button className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-400 text-[10px] font-black hover:bg-slate-700 transition-all border border-amber-400/20 animate-pulse">
                              🔥 نوصي بشدة
                            </button>
                          )}
                       </div>
                     </motion.div>
                   );
                })}
             </TabsContent>

             <TabsContent value="CONNECTIONS" className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar mt-0">
                {activeConnectionsList.length === 0 && (
                   <div className="text-center py-10 opacity-20 text-white text-xs font-bold uppercase tracking-widest">فراغ كوني...</div>
                )}
                {activeConnectionsList.map(conn => (
                   <motion.div 
                     key={conn.id}
                     whileHover={{ scale: 1.02, x: -5 }}
                     onClick={() => {
                        setSelectedConnection(conn);
                        setIsConnectionDialogOpen(true);
                     }}
                     className="p-3 bg-slate-800/40 border border-white/5 rounded-2xl shadow-xl cursor-pointer hover:border-blue-500/40 transition-all"
                   >
                      <div className="flex items-center justify-between mb-2">
                         <span className={`text-[9px] px-2 py-0.5 rounded-full font-black text-white shadow-lg`} style={{ backgroundColor: conn.color, boxShadow: `0 0 10px ${conn.color}44` }}>
                            {conn.connection_type}
                         </span>
                         <span className="text-[9px] text-slate-500 font-bold">{new Date().toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-[11px] font-black text-white">
                            <span className="text-blue-400">{conn.fromMemberName || conn.fromName}</span>
                            <FiLink className="text-slate-600 w-3 h-3" />
                            <span className="text-indigo-400">{conn.toMemberName || conn.toName}</span>
                         </div>
                         <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold text-slate-300">
                            <span>{conn.fromName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span>{conn.toName}</span>
                         </div>
                      </div>
                      {conn.reason && (
                         <p className="text-[10px] text-slate-500 mt-2 line-clamp-1 italic border-t border-white/5 pt-1.5">{conn.reason}</p>
                      )}
                   </motion.div>
                ))}
             </TabsContent>

             <TabsContent value="RESOURCES" className="flex-1 p-4 mt-0 bg-slate-900/40 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {RESOURCES.map(res => (
                    <button
                      key={res.id}
                      onClick={() => handleAddResource(res)}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/60 hover:bg-blue-600 text-white transition-all shadow-xl group border border-white/5"
                    >
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg mb-1 shadow-2xl group-hover:bg-white/20"
                        style={{ backgroundColor: res.color }}
                      >
                        {res.icon}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-60 group-hover:opacity-100">{res.label}</span>
                    </button>
                  ))}
                </div>
             </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <CircleDialog 
        open={isCircleDialogOpen}
        onOpenChange={setIsCircleDialogOpen}
        onSubmit={handleCreateOrUpdateCircle}
        circle={selectedCircle}
        categories={dbCategories}
        onManageCategories={() => setIsCategoryDialogOpen(true)}
      />

      <CategoryManagementDialog 
         open={isCategoryDialogOpen}
         onOpenChange={setIsCategoryDialogOpen}
         categories={dbCategories}
         onAdd={(val) => dispatch(createZoonCategory(val))}
         onDelete={(id) => dispatch(deleteZoonCategory(id))}
      />

      <ConnectionDetailsDialog 
        open={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        connection={selectedConnection}
        fromCircle={dbCircles.find(c => c.id === selectedConnection?.from_circle_id) || null}
        toCircle={dbCircles.find(c => c.id === selectedConnection?.to_circle_id) || null}
        fromMember={selectedConnection?.from_member_id ? Object.values(membersMap).flat().find(m => m.id === selectedConnection.from_member_id) || null : null} 
        toMember={selectedConnection?.to_member_id ? Object.values(membersMap).flat().find(m => m.id === selectedConnection.to_member_id) || null : null}
        onDelete={(id) => dispatch(deleteCircleConnection(id))}
        onUpdate={(id, updates) => dispatch(updateCircleConnection({ id, updates }))}
      />

      <TransferDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        member={transferData.member}
        fromCircle={transferData.fromCircle}
        toCircle={transferData.toCircle}
        onConfirm={handleConfirmTransfer}
      />

      <DirectLinkDialog 
        open={isDirectLinkDialogOpen}
        onOpenChange={setIsDirectLinkDialogOpen}
        member={memberForAction}
        circles={dbCircles}
        onLinkToCircle={handleDirectLinkToCircle}
        onSendToPerson={handleSendToPerson}
      />

      {/* Floating Toggle for Connections */}
      <div className="absolute top-6 right-[420px] z-50 flex flex-col gap-2">
         <Button 
           size="sm" 
           variant={showConnections ? "default" : "outline"}
           className={`rounded-full w-12 h-12 shadow-2xl transition-all ${showConnections ? 'bg-blue-600' : 'bg-white'}`}
           onClick={() => setShowConnections(!showConnections)}
           title={showConnections ? "إخفاء الروابط" : "إظهار الروابط"}
         >
           {showConnections ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
         </Button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </DashboardLayout>
  );
}
