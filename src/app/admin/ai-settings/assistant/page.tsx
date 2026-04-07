'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, FiX, FiRefreshCcw, 
  FiClock, FiTarget, FiLayout, FiActivity, FiArrowRight,
  FiEdit3, FiZap, FiCpu, FiMessageSquare, FiShield,
  FiSearch, FiExternalLink, FiCodesandbox, FiList, FiShare2
} from 'react-icons/fi';
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { zoonContentOrchestrator } from '@/domains/zoon-club/services/ZoonContentOrchestrator.service';

// Zoon OS Components
import SkillBuilder from '@/domains/zoon-os/components/SkillBuilder';
import WorkflowBuilder from '@/domains/zoon-os/components/WorkflowBuilder';
import ZoonTriggerManager from '@/domains/zoon-os/components/ZoonTriggerManager';
import ZoonPromptManager from '@/domains/zoon-os/components/ZoonPromptManager';
import ZoonLogViewer from '@/domains/zoon-os/components/ZoonLogViewer';
import ZoonChat from '@/domains/zoon-os/components/ZoonChat';

const roomTranslations: Record<string, string> = {
  'home': 'بيوتنا',
  'kitchen': 'مطبخنا',
  'health': 'صحتنا',
  'children': 'أطفالنا',
  'culture': 'ثقافتنا',
  'sports': 'رياضتنا',
  'success': 'نجاحاتنا',
  'neighborhood': 'حينا'
};

export default function AssistantSettingsPage() {
  const supabase = createClient();
  const [circles, setCircles] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [articleMetas, setArticleMetas] = useState<Record<string, any>>({});
  const [loadingMeta, setLoadingMeta] = useState<Set<string>>(new Set());
  
  const [newsResults, setNewsResults] = useState<Record<string, any[]>>({});
  const [selectedNews, setSelectedNews] = useState<Record<string, any>>({});
  const [fetchingNews, setFetchingNews] = useState<string | null>(null);
  
  // Image Search
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageSource, setImageSource] = useState('all');

  // Editor
  const [postEditorModal, setPostEditorModal] = useState<{
    open: boolean;
    circleId: string;
    content: string;
    imageUrl: string;
    sourceLink: string;
    sourceTitle: string;
    postType: string;
    targetGoal: string;
    psychologicalAnalysis: any;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, queueRes, settingsRes] = await Promise.all([
        supabase.from('zoon_rooms').select('*'),
        supabase.from('zoon_posts_queue').select('*, zoon_rooms(name)').order('created_at', { ascending: false }),
        supabase.from('circle_content_settings').select('*')
      ]);

      const settingsMap = (settingsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.circle_id] = curr;
        return acc;
      }, {});

      setCircles(roomsRes.data || []);
      setQueue(queueRes.data || []);
      setSettings(settingsMap);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const approvePost = async (postId: string) => {
    try {
      const { data: post, error: fetchErr } = await supabase
        .from('zoon_posts_queue')
        .select('*')
        .eq('id', postId)
        .single();
      if (fetchErr || !post) throw new Error('تعذر العثور على بيانات المنشور');

      const { error: postErr } = await supabase
        .from('zoon_posts')
        .insert({
          room_id: post.circle_id,
          content: post.content,
          post_type: post.post_type,
          media_urls: post.image_url ? [post.image_url] : [],
          is_approved: true,
          status: 'APPROVED',
          classification_source: 'AI_ASSISTANT',
          hidden_tags: {
            psychological_analysis: post.psychological_analysis,
            target_goal: post.target_goal
          }
        });
      if (postErr) throw postErr;

      const { error: queueErr } = await supabase
        .from('zoon_posts_queue')
        .update({ status: 'published' })
        .eq('id', postId);
      if (queueErr) throw queueErr;

      toast.success('تم النشر بنجاح! 🚀');
      loadData();
    } catch (error: any) {
      toast.error('فشل في النشر: ' + error.message);
    }
  };

  const rejectPost = async (postId: string) => {
    try {
      await supabase.from('zoon_posts_queue').update({ status: 'rejected' }).eq('id', postId);
      toast.success('تم رفض المنشور');
      loadData();
    } catch (error) {
      toast.error('فشل في الرفض');
    }
  };

  const fetchSuggestedImages = async (query: string) => {
    if (!query) return;
    setSearchingImages(true);
    try {
      const res = await fetch('/api/ai/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source: imageSource })
      });
      const data = await res.json();
      if (data.success) setImageSearchResults(data.images);
    } catch (e) {
      console.error('Image Search Err:', e);
    } finally {
      setSearchingImages(false);
    }
  };

  const saveEditedPost = async () => {
    if (!postEditorModal) return;
    setGenerating(postEditorModal.circleId);
    try {
      const postData = {
        circle_id: postEditorModal.circleId,
        content: postEditorModal.content,
        post_type: postEditorModal.postType,
        target_goal: postEditorModal.targetGoal,
        image_url: postEditorModal.imageUrl, 
        news_source_url: postEditorModal.sourceLink,
        psychological_analysis: postEditorModal.psychologicalAnalysis,
        status: 'draft',
      };
      if (postData.news_source_url) {
        await supabase.from('zoon_posts_queue').delete().eq('news_source_url', postData.news_source_url);
      }
      const { error } = await supabase.from('zoon_posts_queue').insert(postData);
      if (error) throw error;
      toast.success('تم حفظ المنشور في الطابور ✅');
      setPostEditorModal(null);
      loadData();
    } catch (error: any) {
      toast.error(`فشل في الحفظ: ${error.message}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <DashboardLayout title="إعدادات المساعد الذكي | Zoon OS Assistant">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/ai-settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة للإعدادات العامة
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                      <FiCpu className="animate-pulse" />
                      إعدادات المساعد الذكي Zoon OS
                   </h1>
                   <p className="text-indigo-100 font-bold max-w-lg">
                      تحكم كامل في شخصية الوكيل، مهاراته، المشغلات التلقائية، ومراجعة المحتوى المولد في مكان واحد.
                   </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 grid grid-cols-3 gap-8">
                   <div className="text-center">
                      <p className="text-[10px] uppercase font-black opacity-60">المنشورات المعلقة</p>
                      <p className="text-2xl font-black">{queue.filter(p => p.status === 'draft').length}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] uppercase font-black opacity-60">المهارات</p>
                      <p className="text-2xl font-black">{circles.length}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] uppercase font-black opacity-60">الحالة</p>
                      <Badge className="bg-emerald-400 text-emerald-950 font-black">ACTIVE</Badge>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        <Tabs defaultValue="queue" className="w-full" dir="rtl">
          <TabsList className="bg-slate-100/80 p-1 mb-8 w-full justify-start overflow-x-auto h-auto min-h-[50px]">
            <TabsTrigger value="queue" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-black px-6 py-2.5">
              <FiClock className="ml-2" /> طابور المراجعة
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-black px-6 py-2.5">
              <FiCodesandbox className="ml-2" /> إدارة المهارات
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-white data-[state=active]:text-fuchsia-600 font-black px-6 py-2.5">
              <FiShare2 className="ml-2 inline-block w-4 h-4" /> مصمم المسارات (Workflow)
            </TabsTrigger>
            <TabsTrigger value="prompts" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 font-black px-6 py-2.5">
              <FiMessageSquare className="ml-2" /> إدارة الشخصية
            </TabsTrigger>
            <TabsTrigger value="triggers" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 font-black px-6 py-2.5">
              <FiZap className="ml-2" /> مشغلات المهام
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:text-slate-700 font-black px-6 py-2.5">
              <FiList className="ml-2" /> سجلات التنفيذ
            </TabsTrigger>
            <TabsTrigger value="copilot" className="data-[state=active]:bg-white data-[state=active]:text-green-600 font-black px-6 py-2.5">
               🤖 المساعد الذكي
            </TabsTrigger>
          </TabsList>

          {/* 📬 Queue Tab */}
          <TabsContent value="queue">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {queue.filter(p => p.status === 'draft').map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="overflow-hidden flex flex-col h-full border-2 hover:border-indigo-200 transition-all shadow-lg bg-white">
                      <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold">
                          {roomTranslations[post.zoon_rooms?.name] || post.zoon_rooms?.name}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(post.created_at).toLocaleTimeString('ar-EG')}
                        </span>
                      </div>
                      
                      {post.image_url && (
                        <div className="aspect-video bg-slate-200 relative overflow-hidden">
                          <img src={post.image_url} alt="AI Generated" className="object-cover w-full h-full" />
                        </div>
                      )}

                      <div className="p-5 flex-1 space-y-4">
                        <div className="flex gap-2">
                           <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">#{post.post_type}</Badge>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-bold">
                          {post.content}
                        </p>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <p className="text-[11px] text-amber-800 font-black">🎯 الهدف: {post.target_goal}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => approvePost(post.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5"
                        >
                          <FiCheck className="ml-2" /> موافقة
                        </Button>
                        <Button 
                          onClick={() => rejectPost(post.id)}
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 font-black py-5"
                        >
                          <FiX className="ml-2" /> رفض
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {queue.filter(p => p.status === 'draft').length === 0 && (
                <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed rounded-3xl text-center">
                   <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiClock className="text-slate-400" size={40} />
                   </div>
                   <h3 className="text-lg font-black text-slate-600">لا توجد منشورات في طابور المراجعة</h3>
                   <p className="text-slate-400 text-sm">البوت يعمل دائماً.. ستظهر النتائج هنا فور نضجها.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 🛠️ Skills Tab */}
          <TabsContent value="skills">
            <SkillBuilder />
          </TabsContent>

          {/* 🔗 Workflow Builder Tab */}
          <TabsContent value="workflow">
            <WorkflowBuilder />
          </TabsContent>

          {/* 🎭 Prompts Tab */}
          <TabsContent value="prompts">
            <ZoonPromptManager />
          </TabsContent>

          {/* ⚡ Triggers Tab */}
          <TabsContent value="triggers">
            <ZoonTriggerManager />
          </TabsContent>

          {/* 📋 Logs Tab */}
          <TabsContent value="logs">
            <ZoonLogViewer />
          </TabsContent>

          {/* 🤖 Copilot Tab */}
          <TabsContent value="copilot">
            <div className="h-[600px] border rounded-3xl overflow-hidden shadow-2xl mt-4 bg-white">
              <ZoonChat />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Editor Modal - Simple version reused from Studio */}
      <Dialog open={postEditorModal?.open} onOpenChange={(open) => !open && setPostEditorModal(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[90vh]" dir="rtl">
            <div className="col-span-3 p-8 space-y-6 overflow-y-auto">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FiEdit3 className="text-indigo-600" /> تعديل المنشور المقترح
              </h2>
              <div className="space-y-4">
                <Textarea 
                  value={postEditorModal?.content}
                  onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="min-h-[250px] text-base leading-relaxed border-slate-200"
                />
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400">رابط الصورة</Label>
                  <Input 
                    value={postEditorModal?.imageUrl || ''}
                    onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button onClick={saveEditedPost} className="flex-1 h-12 bg-indigo-600 text-white font-black rounded-xl">حفظ التغييرات</Button>
                <Button variant="outline" onClick={() => setPostEditorModal(null)} className="h-12 px-6 font-bold rounded-xl">إلغاء</Button>
              </div>
            </div>
            <div className="col-span-2 p-8 bg-slate-50 border-r border-slate-200">
               <Label className="text-[10px] font-black text-slate-400 uppercase">المُعاينة</Label>
               <div className="mt-4 bg-white rounded-2xl shadow-sm border overflow-hidden p-4">
                  {postEditorModal?.imageUrl && <img src={postEditorModal.imageUrl} className="w-full aspect-video object-cover rounded-lg mb-4" />}
                  <p className="text-sm text-slate-700 leading-relaxed">{postEditorModal?.content}</p>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
