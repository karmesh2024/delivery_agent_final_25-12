'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchZoonRooms, fetchZoonPosts, fetchCircles, fetchBazzzzTypes, fetchZoonQuestions, joinCircleAction, interactWithPost, addPostCommentAction, fetchPostComments, fetchJoinedCircles } from '@/domains/zoon-club/store/zoonClubSlice';
import { Button } from "@/shared/components/ui/button";
import { FiArrowRight, FiSmartphone, FiMonitor, FiRotateCcw, FiZap, FiTarget, FiUsers, FiStar, FiHeart, FiSmile, FiPlus, FiMaximize2, FiSend, FiImage, FiMic, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Link from 'next/link';
import { Badge } from '@/shared/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { UniversalDialog, UniversalDialogContent, UniversalDialogHeader, UniversalDialogTitle, UniversalDialogFooter, UniversalDialogDescription } from '@/shared/components/ui/universal-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { zoonClubService } from '@/domains/zoon-club/services/zoonClubService';

export default function RoomsPreviewPage() {
  const dispatch = useAppDispatch();
  const { rooms, posts, circles, bazzzzTypes, questions, loading, comments: storeComments } = useAppSelector((state) => state.zoonClub);
  const { currentAdmin } = useAppSelector((state) => state.auth);
  const [localBazzzz, setLocalBazzzz] = useState<Record<string, Record<string, number>>>({}); // postId -> { typeId: count }
  const [bazzzzedPosts, setBazzzzedPosts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'mobile' | 'web'>('mobile');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [shownQuestions, setShownQuestions] = useState<string[]>([]); // To track shown entry questions
  const [activeEntryQuestion, setActiveEntryQuestion] = useState<any>(null);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [activeCircleDashboard, setActiveCircleDashboard] = useState<any>(null);
  const [showCosmicChat, setShowCosmicChat] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [showBazzzzModal, setShowBazzzzModal] = useState<string | null>(null); // postId
  const [showDiamondModal, setShowDiamondModal] = useState<string | null>(null); // postId
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null); // postId
  const [selectedCommentBazzzz, setSelectedCommentBazzzz] = useState<any>(null);
  const [localJoinedCircles, setLocalJoinedCircles] = useState<any[]>([]);
  const [localComments, setLocalComments] = useState<Record<string, any[]>>({}); // postId -> comments[]
  const [userBazzzzSelections, setUserBazzzzSelections] = useState<Record<string, string>>({}); // postId -> typeId
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({}); // postId -> isExpanded
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [diamondComment, setDiamondComment] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollBazzzz = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  useEffect(() => {
    dispatch(fetchZoonRooms());
    dispatch(fetchZoonPosts());
    dispatch(fetchCircles());
    dispatch(fetchBazzzzTypes());
    dispatch(fetchZoonQuestions());
    
    if (currentAdmin?.user_id) {
      dispatch(fetchJoinedCircles(currentAdmin.user_id)).then((res: any) => {
        if (res.payload) {
          const validCircles = res.payload
            .map((item: any) => item.zoon_circles || item.scope_circles) // Handle both potential property names
            .filter((circle: any) => circle && circle.id); // Filter out null/undefined or invalid circles
          setLocalJoinedCircles(validCircles);
        }
      });
    }
  }, [dispatch, currentAdmin]);

  useEffect(() => {
    if (posts.length > 0) {
      posts.forEach(post => {
        dispatch(fetchPostComments(post.id));
      });
    }
  }, [posts, dispatch]);

  // Merge store comments with local comments (if any session-only ones exist)
  const allComments = useMemo(() => {
    const merged: Record<string, any[]> = {};
    if (!storeComments) return merged;
    
    // Map store comments to match the UI format
    Object.keys(storeComments).forEach(postId => {
      merged[postId] = (storeComments[postId] || []).map(c => ({
        id: c.id,
        text: c.content,
        user: c.user_name || 'عضو كوني',
        isDiamond: c.is_diamond_buzz,
        bazzzz: c.zoon_bazzzz_types
      }));
    });
    return merged;
  }, [storeComments]);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
    
    if (selectedRoomId && !shownQuestions.includes(selectedRoomId)) {
      const entryQ = questions.find(q => 
        q.room_id === selectedRoomId && 
        (q.trigger_type === 'ENTRY' || q.trigger_context === 'ENTRY') &&
        q.is_active
      );
      
      if (entryQ) {
        setTimeout(() => {
          setActiveEntryQuestion(entryQ);
          setShownQuestions(prev => [...prev, selectedRoomId]);
        }, 800);
      }
    }
  }, [rooms, selectedRoomId, questions, shownQuestions]);

  useEffect(() => {
    if (showCosmicChat && activeCircleDashboard?.id) {
      zoonClubService.getCircleMessages(activeCircleDashboard.id).then((messages) => {
        setChatMessages(messages.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === currentAdmin?.id ? 'me' : 'other',
          senderName: m.sender_id === currentAdmin?.id ? (currentAdmin?.full_name || 'ME') : 'عضو كوني'
        })));
      });
    }
  }, [showCosmicChat, activeCircleDashboard, currentAdmin]);

  const handleBazzzz = (postId: string, type: any, comment?: string) => {
    if (!currentAdmin?.id) {
      toast.error('يجب تسجيل الدخول للتفاعل');
      return;
    }

    if (!currentAdmin?.user_id) {
      toast.error('يجب تسجيل الدخول بحساب مرتبط بمستخدم للتفاعل');
      return;
    }

    const currentTypeId = userBazzzzSelections[postId];
    
    // Prevent spamming same type
    if (currentTypeId === type.id) {
       // Optional: Toast "You already reacted with this"
       return; 
    }

    dispatch(interactWithPost({ postId, userId: currentAdmin.user_id, typeId: type.id }));

    setLocalBazzzz(prev => {
      const postCounts = { ...(prev[postId] || {}) };
      
      // Decrement old interaction count if exists in this session
      if (currentTypeId && postCounts[currentTypeId] > 0) {
         postCounts[currentTypeId]--;
      }
      
      // Increment new interaction count
      postCounts[type.id] = (postCounts[type.id] || 0) + 1;
      
      return { ...prev, [postId]: postCounts };
    });
    
    setUserBazzzzSelections(prev => ({ ...prev, [postId]: type.id }));
    
    if (!bazzzzedPosts.includes(postId)) {
      setBazzzzedPosts(prev => [postId, ...prev.filter(id => id !== postId)]);
    }

    const successMsg = type.name_en === 'Diamond' 
      ? `💎 Diamond Buzz! تم توثيق تَميُّز هذا المنشور` 
      : `${type.icon} ${type.name_ar}! تم رفع طاقة المنشور`;

    toast.success(successMsg, {
      icon: '🚀',
      style: { borderRadius: '15px', background: '#4f46e5', color: '#fff' }
    });
    
    setShowCommentModal(null);
    setShowBazzzzModal(null);
    setShowDiamondModal(null);
    
    if (comment) {
      console.log('Dispatching addPostCommentAction with:', {
        post_id: postId,
        user_id: currentAdmin.user_id,
        content: comment,
        bazzzz_type_id: type.id,
        is_diamond_buzz: type.name_en === 'Diamond'
      });

      dispatch(addPostCommentAction({
        post_id: postId,
        user_id: currentAdmin.user_id,
        content: comment,
        bazzzz_type_id: type.id,
        is_diamond_buzz: type.name_en === 'Diamond'
      })).unwrap().then(() => {
        toast.success('تمت إضافة بصمتك بنجاح');
      }).catch((err) => {
        console.error('Failed to save comment:', err);
        toast.error('حدث خطأ أثناء حفظ التعليق. قد تحتاج لمراجعة صلاحيات قاعدة البيانات.');
      });
    }
    
    setDiamondComment('');
    setGeneralComment('');
    setSelectedCommentBazzzz(null);
  };

  const handleJoinCircle = (circleName: string, icon: string) => {
    const circle = circles.find(c => c.name === circleName);
    if (!circle || !currentAdmin?.user_id) {
      if (!currentAdmin?.user_id) toast.error('يجب تسجيل الدخول بحساب مستخدم للانضمام');
      return;
    }

    setIsJoining(circleName);
    
    dispatch(joinCircleAction({ circleId: circle.id, userId: currentAdmin.user_id }))
      .then(() => {
        setLocalJoinedCircles(prev => [...prev, circle]);
        setIsJoining(null);
        setShowJoinCircleModal(false);
        toast.success(`أهلاً بك في دائرة ${circleName}!`);
        setActiveCircleDashboard(circle);
        setShowCosmicChat(true);
      })
      .catch((err) => {
        console.error('Failed to join circle:', err);
        setIsJoining(null);
        toast.error('فشل الانضمام للدائرة');
      });
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !activeCircleDashboard?.id || !currentAdmin?.user_id) {
       if (!currentAdmin?.user_id) toast.error('يجب تسجيل الدخول بحساب مستخدم لإرسال الرسائل');
       return;
    }
    
    const messageContent = chatInput.trim();
    setChatInput('');

    zoonClubService.sendCircleMessage({
      circle_id: activeCircleDashboard.id,
      sender_id: currentAdmin.user_id,
      content: messageContent,
      message_type: 'TEXT'
    }).then((res) => {
      setChatMessages(prev => [...prev, {
        id: res.id,
        text: res.content,
        sender: 'me',
        senderName: currentAdmin.full_name || 'ME'
      }]);
    }).catch((err) => {
      console.error('Failed to send message:', err);
      toast.error('فشل إرسال الرسالة');
    });
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newMessage = {
          id: Date.now(),
          image: event.target?.result as string,
          sender: 'me',
          senderName: 'ME'
        };
        setChatMessages(prev => [...prev, newMessage]);
        toast.success('تم رفع الصورة للبصمة الكونية', { icon: '📸' });
      };
      reader.readAsDataURL(file);
    }
  };

  const getActiveBuzz = (postId: string) => {
    const postBazzzz = localBazzzz[postId];
    if (!postBazzzz) return null;
    const sortedTypes = [...bazzzzTypes].sort((a, b) => (b.points_given || 0) - (a.points_given || 0));
    for (const type of sortedTypes) {
      if (postBazzzz[type.id]) return type;
    }
    return null;
  };

  const activeRoom = rooms.find(r => r.id === selectedRoomId);

  const getPostPoints = (post: any) => {
    const interactions = localBazzzz[post.id];
    const basePoints = post.likes_count || 0;
    if (!interactions) return basePoints;
    const bazzzzPoints = Object.entries(interactions).reduce((total, [typeId, count]) => {
      const type = bazzzzTypes.find(t => t.id === typeId);
      return total + (count * (type?.points_given || 0));
    }, 0);
    return basePoints + bazzzzPoints;
  };

  const displayPosts = posts
    .filter(post => post.room_id === selectedRoomId)
    .sort((a, b) => {
      const pointsA = getPostPoints(a);
      const pointsB = getPostPoints(b);
      if (pointsB !== pointsA) return pointsB - pointsA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <DashboardLayout title="معاينة الغرف (ويب)">
      <div className="p-6 h-[calc(100vh-100px)] flex flex-col bg-slate-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/club-zone">
                <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-gray-500">
                  <FiArrowRight className="ml-1" /> العودة للوحة التحكم
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold italic text-slate-800">SCOPE <span className="text-blue-600">ZONE</span> PREVIEW</h1>
          </div>
          <div className="flex bg-white p-1 rounded-lg border shadow-sm gap-1">
            <Button variant={viewMode === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('mobile')} className="gap-2"><FiSmartphone /> جوال</Button>
            <Button variant={viewMode === 'web' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('web')} className="gap-2"><FiMonitor /> متصفح</Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="w-64 bg-white rounded-xl border shadow-sm p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4 px-2">استكشف الغرف</h3>
            <div className="space-y-2">
              {loading ? (
                  Array(8).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>)
              ) : (
                rooms.map((room) => (
                  <button key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedRoomId === room.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                    <span className="text-xl">{room.icon}</span>
                    <span className="font-medium">{room.name_ar}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-center items-start p-4 bg-slate-200 rounded-2xl overflow-y-auto">
            <div className={`bg-white transition-all duration-500 shadow-2xl relative overflow-hidden ${viewMode === 'mobile' ? 'w-[375px] h-[750px] rounded-[40px] border-[12px] border-slate-900 mx-auto' : 'w-full h-full rounded-xl border border-gray-300'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${activeRoom?.color}`} style={{ backgroundColor: activeRoom?.color || '#3b82f6', color: 'white' }}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{activeRoom?.icon}</span>
                    <h2 className="font-bold text-lg">{activeRoom?.name_ar || 'جاري التحميل...'}</h2>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><FiRotateCcw /></Button>
              </div>

                {selectedRoomId && (
                  <div className="p-4 border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1"><FiTarget className="w-3 h-3" /> الدوائر الاجتماعية النشطة</h3>
                      <span className="text-[9px] text-indigo-300 font-bold">بناءً على بصمتك</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                      {circles.filter(c => c.room_id === selectedRoomId).map((circle) => (
                        <div key={circle.id} onClick={() => setActiveCircleDashboard(circle)} className="flex-shrink-0 flex flex-col items-center gap-1.5 group cursor-pointer">
                          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 transition-transform group-hover:scale-110 active:scale-95">
                             <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl overflow-hidden border-2 border-white">
                                {circle.icon || (circle.name.includes('ديكور') ? '🏠' : circle.name.includes('جيران') ? '🤝' : '💫')}
                             </div>
                          </div>
                          <span className={`text-[10px] font-bold max-w-[60px] truncate text-center leading-tight ${localJoinedCircles.some(jc => jc.id === circle.id) ? 'text-indigo-600' : 'text-gray-500'}`}>{circle.name.split(' ')[1] || circle.name}</span>
                        </div>
                      ))}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1.5" onClick={() => setShowJoinCircleModal(true)}>
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300 text-xl hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer">+</div>
                        <span className="text-[10px] font-medium text-indigo-300">انضم</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-140px)] custom-scrollbar">
                {loading && posts.length === 0 ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden animate-pulse">
                      <div className="h-48 bg-gray-200" /><div className="p-3 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
                    </div>
                  ))
                ) : displayPosts.length > 0 ? (
                  <AnimatePresence>
                    {displayPosts.map((post: any) => (
                      <motion.div layout key={post.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{activeRoom?.icon}</div>
                          <div><div className="text-sm font-bold">نادي {activeRoom?.name_ar}</div><div className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                        </div>
                        {post.media_urls?.[0] && <div className="aspect-square"><img src={post.media_urls[0]} alt="media" className="w-full h-full object-cover" /></div>}
                        <div className="p-3 space-y-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex -space-x-1.5">{[1, 2, 3].map(i => (<div key={i} className="w-5 h-5 rounded-full border border-white bg-indigo-100 flex items-center justify-center"><FiZap className="w-2.5 h-2.5 text-indigo-500" /></div>))}<span className="text-[10px] text-gray-400 mr-3 self-center">+12 عضواً تفاعلوا</span></div>
                              <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">{getPostPoints(post)} Energy Points</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                               <Button variant="ghost" size="sm" onClick={() => { const quickType = bazzzzTypes.find(t => t.name_en === 'Quick'); if (quickType) handleBazzzz(post.id, quickType); }} onContextMenu={(e) => { e.preventDefault(); setShowBazzzzModal(post.id); }} className={`h-10 flex-1 rounded-xl gap-2 font-black text-sm group transition-all duration-500 ${bazzzzedPosts.includes(post.id)? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100 text-gray-700 border'}`}>
                                  {(() => { const activeBuzz = getActiveBuzz(post.id); return (<><span className={bazzzzedPosts.includes(post.id) ? 'animate-bounce' : 'group-hover:scale-125'}>{activeBuzz ? activeBuzz.icon : '🔥'}</span>{activeBuzz ? `${activeBuzz.name_en.toUpperCase()} BAZZZZ` : 'BAZZZZ'}</>); })()}
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => setShowCommentModal(post.id)} className="h-10 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 gap-2 font-bold"><FiPlus className="w-4 h-4" />تعليق</Button>
                               <Button variant="ghost" size="sm" onClick={() => setShowBazzzzModal(post.id)} className="h-10 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200"><FiZap className="w-4 h-4" /></Button>
                            </div>
                             <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
                               <div className="flex-shrink-0 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-purple-100">🎯 الوعي +5</div>
                               <div className="flex-shrink-0 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-100">🧬 الانفتاح +2</div>
                               <div className="flex-shrink-0 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-100">✨ طاقة +10</div>
                             </div>
                             {allComments[post.id]?.length > 0 && (
                               <div className="mt-4 pt-3 border-t">
                                 <Button variant="ghost" size="sm" onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="w-full h-9 justify-between px-3 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 rounded-xl">
                                   <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white">💬</div><span className="text-xs font-bold">Comments ({allComments[post.id].length})</span></div>
                                   {expandedComments[post.id] ? <FiChevronUp /> : <FiChevronDown />}
                                 </Button>
                                 <AnimatePresence>{expandedComments[post.id] && (
                                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 mt-3 overflow-hidden">
                                       {allComments[post.id].map((comm: any) => (
                                         <div key={comm.id} className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-3 rounded-2xl border border-indigo-100 flex gap-3 text-right" dir="rtl">
                                           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white shrink-0 shadow-sm border border-indigo-200">{comm.bazzzz?.icon || (comm.isDiamond ? '💎' : '💬')}</div>
                                           <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-black text-indigo-900">{comm.user}</span>{comm.isDiamond && <Badge className="text-[8px] h-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">DIAMOND</Badge>}</div>
                                             <p className="text-xs text-indigo-800 leading-relaxed font-medium">{comm.text}</p>
                                           </div>
                                         </div>
                                       ))}
                                     </motion.div>
                                   )}</AnimatePresence>
                               </div>
                             )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (<div className="text-center py-12 text-gray-400">لا توجد منشورات حتى الآن</div>)}
                {posts.filter(p => p.room_id === selectedRoomId).length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2"><div className="bg-white/20 p-2 rounded-lg"><FiUsers /></div><h4 className="font-bold text-sm">هذا القوام يشبهك!</h4></div>
                      <p className="text-xs text-indigo-100 leading-relaxed">بناءً على تحليل ذكاء كارمش، ننصحك بالانضمام لدائرة رواد {activeRoom?.name_ar}.</p>
                      <Button onClick={() => setShowJoinCircleModal(true)} className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs h-10 rounded-xl mt-2 shadow-lg">اطلب الانضمام ✨</Button>
                    </div><div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  </div>
                )}
                <AnimatePresence>{activeCircleDashboard && (
                    <motion.div initial={{ opacity: 0, x: 375 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 375 }} className="absolute inset-0 z-[60] bg-slate-950 flex flex-col no-scrollbar overflow-y-auto">
                      <div className="p-6 bg-gradient-to-b from-indigo-900/50 flex items-center justify-between">
                         <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setActiveCircleDashboard(null)}><FiArrowRight className="w-6 h-6 rotate-180" /></Button>
                         <div className="text-center"><div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 mx-auto flex items-center justify-center text-3xl mb-2 backdrop-blur-xl shadow-2xl">{activeCircleDashboard.icon || '💫'}</div><h3 className="text-white font-black text-xl">{activeCircleDashboard.name}</h3><Badge className="bg-indigo-500/20 text-indigo-300 text-[9px] mt-1">دائرة كوكبية نشطة</Badge></div><Button variant="ghost" size="icon" className="text-white/40"><FiMaximize2 /></Button>
                      </div>
                      <div className="px-6 space-y-6 pb-20">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-5 space-y-4">
                           <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">رادار التفاعل الكوني</h4><span className="text-[10px] text-green-400 font-bold shrink-0">نشط الآن ⚡</span></div>
                           <div className="flex-around items-end h-24 gap-2">{[40, 70, 45, 90, 60, 80].map((h, i) => (<motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t-lg opacity-80" />))}</div>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-indigo-400 tracking-widest px-2 uppercase">الدردشة الكونية</h4>
                           <div className="space-y-2"><div className="bg-white/5 p-3 rounded-2xl rounded-tr-none border border-white/5 max-w-[80%] ml-auto text-xs text-indigo-100">يا جماعة شفتوا المنشور الاستثنائي في قسم الديكور؟ لازم تباركون لصاحبه! 💎</div><div className="bg-indigo-600/20 p-3 rounded-2xl rounded-tl-none border border-indigo-500/20 max-w-[80%] text-xs text-white font-medium">تم كغز المنشور بـ Diamond Buzz فوراً! يستاهل 🔥</div></div>
                           <div onClick={() => setShowCosmicChat(true)} className="p-3 bg-white/5 border border-dashed border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"><span className="text-[10px] text-indigo-300 font-bold">ادخل المساحة الحوارية الآن</span><FiArrowRight className="w-3 h-3 text-indigo-500" /></div>
                        </div>
                      </div>
                      <div className="mt-auto p-6 bg-gradient-to-t from-slate-950 to-transparent"><Button className="w-full h-14 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105" onClick={() => toast.success('جاري نقلك للغرف الكونية لـ ' + activeCircleDashboard.name)}>استكشاف غرف الدائرة 🌌</Button></div>
                    </motion.div>
                  )}</AnimatePresence>

                <AnimatePresence>{showCosmicChat && activeCircleDashboard && (
                    <motion.div initial={{ opacity: 0, y: 300, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 300, scale: 0.9 }} className="absolute inset-0 z-[70] bg-[#0a0e17] flex flex-col">
                      <div className="p-5 bg-indigo-600/10 border-b border-white/10 flex items-center gap-4"><Button variant="ghost" size="icon" className="text-white hover:bg-white/5" onClick={() => setShowCosmicChat(false)}><FiArrowRight className="w-5 h-5 rotate-180" /></Button><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">{activeCircleDashboard.icon || '💫'}</div><div><h4 className="text-white font-bold text-sm">المساحة الكونية : {activeCircleDashboard.name}</h4><p className="text-[10px] text-green-400 font-medium">{activeCircleDashboard?.member_count || 0} أعضاء متصلين حالياً</p></div></div></div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${msg.sender === 'me' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>{msg.senderName}</div><div className={`${msg.sender === 'me' ? 'bg-indigo-600 shadow-lg' : 'bg-white/5 border border-white/5'} p-3 rounded-2xl max-w-[85%] text-xs ${msg.sender === 'me' ? 'text-white' : 'text-indigo-100'}`}>{msg.text}</div></div>
                        ))}
                      </div>
                      <div className="p-4 bg-[#0d121c] border-t border-white/5"><div className="bg-white/5 rounded-[24px] p-1.5 flex items-center gap-1 border border-white/10"><input type="file" id="chat-image-input" className="hidden" accept="image/*" onChange={handleChatImageUpload} /><Button variant="ghost" size="icon" className="text-slate-400 rounded-full" onClick={() => document.getElementById('chat-image-input')?.click()}><FiImage className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-slate-400 rounded-full"><FiMic className="w-4 h-4" /></Button><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} placeholder="اكتب رسالتك الكونية..." className="flex-1 bg-transparent border-none outline-none text-white text-xs px-2 py-2 placeholder:text-slate-600" /><Button onClick={handleSendChatMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-10 h-10 p-0 shrink-0"><FiSend className="w-4 h-4" /></Button></div></div>
                    </motion.div>
                  )}</AnimatePresence>

                <AnimatePresence>{activeEntryQuestion && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                      <motion.div initial={{ y: 100, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 100, scale: 0.9 }} className="bg-white rounded-[32px] w-full max-w-[340px] p-6 shadow-2xl relative border border-indigo-100 mb-20 overflow-hidden">
                        <div className="relative z-10 space-y-4"><div className="flex justify-between items-start"><div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg"><FiTarget className="w-5 h-5 text-white" /></div><Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100" onClick={() => setActiveEntryQuestion(null)}>✕</Button></div><div className="space-y-1"><h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">مهمة Profiling ذكية</h4><p className="text-lg font-black text-slate-800 leading-tight">{activeEntryQuestion.question_text_ar}</p><p className="text-[10px] text-slate-400 font-medium">إجابتك تساعدنا وتحصل على <span className="text-indigo-600 font-bold">+{activeEntryQuestion.points_reward} نقطة</span></p></div><div className="space-y-2.5 pt-2">{activeEntryQuestion.options?.map((option: string, i: number) => (<Button key={i} variant="outline" onClick={() => { setActiveEntryQuestion(null); toast.success('بصمة رائعة!'); }} className="w-full text-[13px] h-12 bg-slate-50 border-transparent hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-2xl font-bold shadow-sm">{option}</Button>))}<button onClick={() => setActiveEntryQuestion(null)} className="w-full text-[11px] text-slate-400 font-bold py-2">ربما لاحقاً</button></div></div>
                      </motion.div>
                    </motion.div>
                  )}</AnimatePresence>
              </div>
              {viewMode === 'mobile' && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t flex justify-around items-center px-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 bg-blue-50">🏠</div><div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400">🔍</div><div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400">➕</div><div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400">🔔</div><div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400">👤</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UniversalDialog open={!!showBazzzzModal} onOpenChange={() => setShowBazzzzModal(null)}>
        <UniversalDialogContent className="sm:max-w-[400px] rounded-3xl p-6">
          <UniversalDialogHeader>
            <UniversalDialogTitle className="text-center text-xl font-black italic text-slate-800">أوزان التفاعل الكوني</UniversalDialogTitle>
            <UniversalDialogDescription className="text-center text-xs">اختر مستوى الطاقة لهذا المنشور</UniversalDialogDescription>
          </UniversalDialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            {bazzzzTypes.filter(t => t.is_primary).map((type) => (
              <Button 
                key={type.id} 
                variant="outline" 
                className={`h-20 flex items-center justify-start gap-4 px-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${type.name_en === 'Diamond' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200'}`} 
                onClick={() => { 
                  if (type.name_en === 'Diamond') { 
                    setShowDiamondModal(showBazzzzModal); 
                    setShowBazzzzModal(null); 
                  } else handleBazzzz(showBazzzzModal!, type); 
                }}
              >
                <span className="text-3xl">{type.icon}</span>
                <div className="text-right">
                  <div className="font-black text-sm">{type.name_ar} (Buzz)</div>
                  <div className="text-[10px] opacity-70">يمنح {type.points_given} نقطة طاقة</div>
                </div>
              </Button>
            ))}
          </div>
        </UniversalDialogContent>
      </UniversalDialog>

      <UniversalDialog open={!!showCommentModal} onOpenChange={() => setShowCommentModal(null)}>
        <UniversalDialogContent className="sm:max-w-[420px] rounded-[28px] border-2 border-indigo-100 shadow-2xl bg-white p-0 overflow-hidden" hideCloseButton>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <FiSmile className="w-5 h-5 text-white" />
                </div>
                <div>
                  <UniversalDialogTitle className="text-base font-black text-white m-0 p-0">أضف بصمتك الكونية</UniversalDialogTitle>
                  <UniversalDialogDescription className="text-[10px] text-indigo-100 font-medium">شارك شعورك مع المجتمع • ZOON 2026</UniversalDialogDescription>
                </div>
              </div>
              <button 
                onClick={() => setShowCommentModal(null)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all font-bold"
              >✕</button>
            </div>
          </div>

          <div className="p-6 space-y-4" dir="rtl">
            {/* Bazzzz Selector */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">اختر نوع التفاعل</label>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => scrollBazzzz('right')} 
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 active:scale-90 transition-all border border-slate-200"
                >
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
                
                <div 
                  ref={scrollRef} 
                  className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {bazzzzTypes.filter(t => t.allows_comment && t.name_en !== 'Diamond').map((type) => (
                    <button 
                      key={type.id} 
                      onClick={() => setSelectedCommentBazzzz(type)} 
                      className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border ${
                        selectedCommentBazzzz?.id === type.id 
                          ? 'bg-indigo-600 text-white shadow-md border-indigo-500 scale-105' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className={`text-[6px] font-black ${selectedCommentBazzzz?.id === type.id ? 'text-white' : 'text-slate-400'}`}>
                        {type.name_ar}
                      </span>
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => scrollBazzzz('left')} 
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 active:scale-90 transition-all border border-slate-200"
                >
                  <FiChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Comment Input */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">نص التعليق</label>
              <Textarea 
                placeholder="شارك أفكارك وانطباعاتك هنا..." 
                className="rounded-xl border border-slate-200 focus:border-indigo-500 min-h-[80px] text-sm p-3 resize-none bg-white font-medium text-gray-800 placeholder:text-gray-400" 
                value={generalComment} 
                onChange={(e) => setGeneralComment(e.target.value)} 
              />
              {selectedCommentBazzzz && (
                <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg mt-2 w-fit">
                  <span className="text-sm">{selectedCommentBazzzz.icon}</span>
                  <span className="text-[10px] font-bold text-indigo-700">{selectedCommentBazzzz.name_ar}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40" 
              disabled={!generalComment.trim() && !selectedCommentBazzzz} 
              onClick={() => { 
                if (showCommentModal) { 
                  const type = selectedCommentBazzzz || bazzzzTypes.find(t => t.name_en === 'Quick'); 
                  const finalComment = generalComment.trim() || (selectedCommentBazzzz ? selectedCommentBazzzz.name_ar : '');
                  handleBazzzz(showCommentModal, type, finalComment); 
                } 
              }}
            >
              نشر البصمة ✨
            </Button>
          </div>
        </UniversalDialogContent>
      </UniversalDialog>

      <UniversalDialog open={!!showDiamondModal} onOpenChange={() => setShowDiamondModal(null)}>
        <UniversalDialogContent className="sm:max-w-[400px] rounded-3xl p-6">
          <UniversalDialogHeader>
            <UniversalDialogTitle className="flex items-center gap-2">
              <span className="text-2xl">💎</span> Diamond Buzz
            </UniversalDialogTitle>
            <UniversalDialogDescription>توثيق المحتوى الاستثنائي</UniversalDialogDescription>
          </UniversalDialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-700 font-medium">تفاعل الـ Diamond يتطلب تعليقاً يوضح التميز.</div>
            <Textarea 
              placeholder="اكتب تعليقك هنا..." 
              className="rounded-2xl border-gray-200 focus:ring-blue-500 h-32" 
              value={diamondComment} 
              onChange={(e) => setDiamondComment(e.target.value)} 
            />
          </div>
          <UniversalDialogFooter>
            <Button 
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold" 
              disabled={diamondComment.trim().length < 5} 
              onClick={() => { 
                const diamondType = bazzzzTypes.find(t => t.name_en === 'Diamond'); 
                if (diamondType) handleBazzzz(showDiamondModal!, diamondType, diamondComment); 
              }}
            >إرسال Diamond Buzz ✨</Button>
          </UniversalDialogFooter>
        </UniversalDialogContent>
      </UniversalDialog>

      <UniversalDialog open={showJoinCircleModal} onOpenChange={setShowJoinCircleModal}>
        <UniversalDialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white relative">
            <UniversalDialogHeader className="relative z-10 space-y-4 text-right">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <UniversalDialogTitle className="text-2xl font-black text-white">انضم لدوائر {activeRoom?.name_ar}</UniversalDialogTitle>
                <UniversalDialogDescription className="text-indigo-100 text-[11px] mt-1 font-medium italic">اختر الدائرة التي تناسب اهتماماتك لبناء بصمتك</UniversalDialogDescription>
              </div>
            </UniversalDialogHeader>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-60" />
          </div>
          <div className="p-6 space-y-3 bg-slate-50 overflow-y-auto max-h-[350px] custom-scrollbar">
            {circles.filter(c => c.room_id === selectedRoomId).map((circle) => { 
              const icon = circle.icon || '🔍'; 
              return (
                <Button 
                  key={circle.id} 
                  variant="outline" 
                  disabled={!!isJoining || localJoinedCircles.includes(circle.name)} 
                  className={`w-full h-16 justify-between px-5 bg-white border-2 rounded-2xl transition-all group shadow-sm ${localJoinedCircles.includes(circle.name)? 'border-green-100 bg-green-50/30' : 'border-slate-100'}`} 
                  onClick={() => handleJoinCircle(circle.name, icon)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${localJoinedCircles.includes(circle.name) ? 'bg-green-100' : 'bg-indigo-50'}`}>{icon}</div>
                    <div className="text-right">
                      <div className="font-black text-slate-800 text-[13px]">{circle.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">تفاعل نشط • {circle.member_count || 0} عضواً</div>
                    </div>
                  </div>
                  {isJoining === circle.name ? (
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  ) : localJoinedCircles.includes(circle.name) ? (
                    <div className="text-green-600 font-bold text-[10px]">تم الانضمام</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-all"><FiPlus className="w-4 h-4" /></div>
                  )}
                </Button>
              ); 
            })}
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex justify-center text-center">
            <p className="text-[10px] text-slate-400 font-bold tracking-tight">كل انضمام يمنحك صلاحيات وصول جديدة للدوائر المغلقة 🚀</p>
          </div>
        </UniversalDialogContent>
      </UniversalDialog>

      <style jsx>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </DashboardLayout>
  );
}
