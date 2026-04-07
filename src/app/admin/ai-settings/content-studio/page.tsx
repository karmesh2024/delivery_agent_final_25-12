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
  FiSettings, FiPlus, FiCheck, FiX, FiRefreshCcw, 
  FiClock, FiTarget, FiHash, FiLayout, FiActivity, FiArrowRight,
  FiSave, FiEdit3, FiSliders, FiMessageSquare, FiTrendingUp, FiShield,
  FiCpu, FiZap, FiSearch, FiRss, FiTrash2, FiExternalLink, FiPlusCircle
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
import WorkflowBuilder from '@/domains/zoon-club/components/WorkflowBuilder';


/**
 * 🏢 AI Content Studio Page
 * واجهة الإدارة للتحكم في أتمتة محتوى الغرف الرسمية (Rooms)
 */

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

export default function AIContentStudioPage() {
  const supabase = createClient();
  const [circles, setCircles] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [fetchingNews, setFetchingNews] = useState<string | null>(null);
  const [newsResults, setNewsResults] = useState<Record<string, any[]>>({});
  const [selectedNews, setSelectedNews] = useState<Record<string, any>>({});
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  
  // 🎛️ فلاتر الأخبار
  const [newsDateFilter, setNewsDateFilter] = useState<Record<string, string>>({});
  const [newsSortOrder, setNewsSortOrder] = useState<Record<string, 'relevance' | 'date'>>({});
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<Record<string, string>>({});
  const [articleMetas, setArticleMetas] = useState<Record<string, any>>({});
  const [loadingMeta, setLoadingMeta] = useState<Set<string>>(new Set());
  
  // 🖼️ البحث عن الصور
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [newsSource, setNewsSource] = useState<Record<string, string>>({});
  const [imageSource, setImageSource] = useState('all');

  // ✏️ محرر المنشور
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
      const [roomsRes, queueRes, jobsRes, settingsRes] = await Promise.all([
        supabase.from('zoon_rooms').select('*'),
        supabase.from('zoon_posts_queue').select('*, zoon_rooms(name)').order('created_at', { ascending: false }),
        supabase.from('content_generation_jobs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('circle_content_settings').select('*')
      ]);

      const settingsMap = (settingsRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.circle_id] = curr;
        return acc;
      }, {});

      setCircles(roomsRes.data || []);
      setQueue(queueRes.data || []);
      setJobs(jobsRes.data || []);
      setSettings(settingsMap);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const runGenerator = async (circleId: string) => {
    setGenerating(circleId);
    try {
      await zoonContentOrchestrator.runGenerationForCircle(circleId);
      toast.success('تم بدء عملية التوليد بنجاح');
      loadData();
    } catch (error: any) {
      toast.error('فشل التوليد: ' + error.message);
    } finally {
      setGenerating(null);
    }
  };

  const saveSettings = async (circleId: string) => {
    if (!editForm) return;
    setSavingSettings(circleId);
    try {
      const { error } = await supabase
        .from('circle_content_settings')
        .upsert({
          circle_id: circleId,
          room_policy: editForm.room_policy,
          active_goal: editForm.active_goal,
          publish_mode: editForm.publish_mode,
          fallback_hours: parseInt(editForm.fallback_hours) || 12,
          active_preset_name: editForm.active_preset_name,
          presets: editForm.presets,
          search_keywords: editForm.search_keywords || ['\u0645\u062d\u0631\u0645 \u0628\u0643', '\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629'],
          content_style: editForm.content_style || 'motivational',
          updated_at: new Date()
        }, { onConflict: 'circle_id' });

      if (error) throw error;
      toast.success('\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0628\u0646\u062c\u0627\u062d ✅');
      setEditingCircleId(null);
      setEditForm(null);
      loadData();
    } catch (error: any) {
      toast.error('\u0641\u0634\u0644 \u0641\u064a \u0627\u0644\u062d\u0641\u0638: ' + error.message);
    } finally {
      setSavingSettings(null);
    }
  };

  // ====================================================
  // 🛰️ جلب بيانات المقال (صورة + تفاصيل) من الرابط
  // ====================================================
  const fetchArticleMeta = async (url: string) => {
    if (articleMetas[url] || loadingMeta.has(url)) return;
    
    setLoadingMeta(prev => new Set(prev).add(url));
    try {
      const res = await fetch('/api/ai/article-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        setArticleMetas(prev => ({ ...prev, [url]: data }));
      }
    } catch (e) {
      console.error('Meta Fetch Err:', e);
    } finally {
      setLoadingMeta(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const fetchNewsForRoom = async (circleId: string, circleSettings: any, roomName: string) => {
    setFetchingNews(circleId);
    try {
      const keywords = circleSettings?.search_keywords || ['\u0645\u062d\u0631\u0645 \u0628\u0643', '\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629'];
      
      const res = await fetch('/api/ai/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          weekly_goal: circleSettings?.active_goal || '',
          room_policy: circleSettings?.room_policy || '',
          room_name: roomName,
          filterByGoal: true,
          source: newsSource[circleId] || 'all'
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.message || '\u0641\u0634\u0644 \u0641\u064a \u062c\u0644\u0628 \u0627\u0644\u0623\u062e\u0628\u0627\u0631');
        return;
      }

      setNewsResults(prev => ({ ...prev, [circleId]: data.news }));
      toast.success(`ت\u0645 \u062c\u0644\u0628 ${data.total_relevant} \u062e\u0628\u0631 \u0645\u0646 \u0623\u0635\u0644 ${data.total_found} ✅`);
      
      // جلب صور الأخبار تلقائياً لأول 5 نتائج
      data.news.slice(0, 5).forEach((n: any) => {
        if (n.link) fetchArticleMeta(n.link);
      });

    } catch (error: any) {
      toast.error('\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0628\u062d\u062b: ' + error.message);
    } finally {
      setFetchingNews(null);
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
      if (data.success) {
        setImageSearchResults(data.images);
        if (data.message) toast.success(data.message);
      }
    } catch (e) {
      console.error('Image Search Err:', e);
    } finally {
      setSearchingImages(false);
    }
  };

  const generateFromSelectedNews = async (circleId: string) => {
    const news = selectedNews[circleId];
    if (!news) {
      toast.error('\u0627ختر خبراً أولاً من القائمة');
      return;
    }
    
    setGenerating(circleId);
    try {
      // طلب التوليد المبدئي من الـ Orchestrator
      // سنقوم بتعديل الـ Orchestrator ليعيد النتيجة بدلاً من حفظها مباشرة
      // أو نستخدم API Gemini المباشرة هنا للتوليد السريع للمراجعة
      const circleSettings = settings[circleId];
      const meta = articleMetas[news.link];

      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `
            أنت مايسترو محتوى لغرفة ${roomTranslations[circles.find(c => c.id === circleId)?.name] || 'نادي زوون'}.
            اكتب منشوراً فيسبوكياً جذاباً بناءً على الخبر التالي: 
            العنوان: ${news.title}
            التفاصيل: ${news.description}
            الهدف الحالي: ${circleSettings?.active_goal}
            
            الشروط: أسلوب سكندري دافئ، استخدم 2 Emojis، انهِ بسؤال تفاعلي.
            أهم نقطة: اقترح كلمة بحث بالإنجليزية (English search keywords) مناسبة للخبر لجلب صور من Pixabay (مثلاً لو الخبر عن أرسنال، الكلمة تكون: Arsenal FC stadium).

            أعطِ الرد بصيغة JSON فقط:
            { 
              "content": "...",
              "image_search_query": "English keywords here"
            }
          `
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      let content = '';
      let aiImageQuery = '';
      
      // الخادم يحلل JSON تلقائياً ويرسل النتيجة في data.parsed
      if (data.parsed && data.parsed.content) {
        content = data.parsed.content;
        aiImageQuery = data.parsed.image_search_query || '';
      } else {
        // fallback: استخراج بالـ Regex
        const rawText = (data.text || '').trim();
        const contentMatch = rawText.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
        const queryMatch = rawText.match(/"image_search_query"\s*:\s*"([^"]+)"/);
        if (contentMatch) {
          content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          aiImageQuery = queryMatch ? queryMatch[1] : '';
        } else {
          content = rawText
            .replace(/^\s*\{?\s*"content"\s*:\s*"?/i, '')
            .replace(/"?\s*,?\s*"image_search_query"\s*:\s*"[^"]*"\s*\}?\s*$/i, '')
            .replace(/^["'{}\s]+|["'{}\s]+$/g, '')
            .replace(/\\n/g, '\n').replace(/\\"/g, '"')
            .trim();
        }
      }

      setPostEditorModal({
        open: true,
        circleId,
        content: content,
        imageUrl: meta?.image || news.thumbnail || '',
        sourceLink: news.link,
        sourceTitle: news.title,
        postType: 'news_update',
        targetGoal: circleSettings?.active_goal || '',
        psychologicalAnalysis: { sentiment: 'positive' }
      });

      // البحث السريع عن صور مقترحة
      // نستخدم الكلمة المقترحة من AI (بالإنجليزي) لأفضل نتائج في المصادر
      const sQuery = aiImageQuery || news.image_search_keywords || news.title; 
      setImageSearchQuery(sQuery);
      fetchSuggestedImages(sQuery);

    } catch (error: any) {
      toast.error('\u0641\u0634\u0644 \u0627\u0644\u062a\u0648\u0644\u064a\u062f: ' + error.message);
    } finally {
      setGenerating(null);
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

      // 🛡️ معالجة التعارض (409) يدوياً لتجنب مشاكل تعارض الأعمدة في upsert
      if (postData.news_source_url) {
        await supabase
          .from('zoon_posts_queue')
          .delete()
          .eq('news_source_url', postData.news_source_url);
      }

      const { error } = await supabase
        .from('zoon_posts_queue')
        .insert(postData);

      if (error) {
        console.error('❌ Supabase Error:', error);
        throw error;
      }

      toast.success('تم حفظ المنشور في طابور المراجعة بنجاح ✅');
      setPostEditorModal(null);
      loadData();
    } catch (error: any) {
      const detail = error.details || error.hint || '';
      toast.error(`فشل في الحفظ: ${error.message} ${detail}`);
    } finally {
      setGenerating(null);
    }
  };

  const approvePost = async (postId: string) => {
    try {
      // 1. جلب بيانات المنشور من الطابور
      const { data: post, error: fetchErr } = await supabase
        .from('zoon_posts_queue')
        .select('*')
        .eq('id', postId)
        .single();

      if (fetchErr || !post) throw new Error('تعذر العثور على بيانات المنشور');

      // 2. إدراج المنشور في الجدول الحي (Live Posts) ليظهر للجمهور
      const { error: postErr } = await supabase
        .from('zoon_posts')
        .insert({
          room_id: post.circle_id, // هنا circle_id في الطابور هو room_id في الأساسي
          content: post.content,
          post_type: post.post_type,
          media_urls: post.image_url ? [post.image_url] : [],
          is_approved: true,
          status: 'APPROVED',
          classification_source: 'AI_STUDIO',
          hidden_tags: {
            psychological_analysis: post.psychological_analysis,
            target_goal: post.target_goal
          }
        });

      if (postErr) throw postErr;

      // 3. تحديث الحالة في الـ Queue إلى published
      const { error: queueErr } = await supabase
        .from('zoon_posts_queue')
        .update({ status: 'published' })
        .eq('id', postId);

      if (queueErr) throw queueErr;

      toast.success('تم النشر في الغرفة بنجاح! 🚀');
      loadData();
    } catch (error: any) {
      console.error('Approval Error:', error);
      toast.error('فشل في النشر: ' + error.message);
    }
  };

  const rejectPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('zoon_posts_queue')
        .update({ status: 'rejected' })
        .eq('id', postId);

      if (error) throw error;
      toast.success('تم رفض المنشور');
      loadData();
    } catch (error) {
      toast.error('فشل في الرفض');
    }
  };

  return (
    <DashboardLayout title="AI Content Studio | استوديو المحتوى الذكي">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/ai-settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة لإعدادات المحرك
            </Button>
          </Link>
        </div>
        
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-emerald-50 border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-xl">
              <FiCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase">بانتظار الموافقة</p>
              <h3 className="text-xl font-black text-emerald-950">{queue.filter(p => p.status === 'draft').length}</h3>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-100 flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl">
              <FiRefreshCcw size={20} />
            </div>
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase">عمليات توليد نشطة</p>
              <h3 className="text-xl font-black text-blue-950">{jobs.filter(j => j.status === 'running').length}</h3>
            </div>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-100 flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl">
              <FiTarget size={20} />
            </div>
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase">الأهداف المحققة</p>
              <h3 className="text-xl font-black text-amber-950">{queue.filter(p => p.status === 'published').length}</h3>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-slate-600 text-white rounded-xl">
              <FiLayout size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 font-bold uppercase">إجمالي الغرف</p>
              <h3 className="text-xl font-black text-slate-950">{circles.length}</h3>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="bg-slate-100 p-1 mb-6">
            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FiSettings className="ml-2" /> إعدادات الغرف (Room Settings)
            </TabsTrigger>
            <TabsTrigger value="ai-setup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FiCpu className="ml-2" /> إعداد Gemini
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FiActivity className="ml-2" /> سجل المحتوى
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-2 border-transparent data-[state=active]:border-indigo-200 text-indigo-700">
              <FiZap className="ml-2" /> باني التدفقات (Beta)
            </TabsTrigger>
          </TabsList>

          {/* ⚡ Workflow Builder Tab */}
          <TabsContent value="workflow" className="mt-0">
             <WorkflowBuilder onPostSaved={loadData} />
          </TabsContent>

          {/* ⚙️ Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 gap-6">
              {circles.map((circle) => {
                const circleSettings = settings[circle.id] || {
                  room_policy: '',
                  active_goal: '',
                  publish_mode: 'manual',
                  fallback_hours: 12,
                  active_preset_name: 'default',
                  presets: {
                    default: { question: 40, story: 20, info: 20, discussion: 20 }
                  }
                };
                
                const isEditing = editingCircleId === circle.id;

                return (
                  <Card key={circle.id} className="p-0 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-indigo-100 shadow-lg">
                          <FiLayout size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">
                            {roomTranslations[circle.name] || circle.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">مركز تحكم الغرفة الذكية</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setEditingCircleId(circle.id);
                                setEditForm(circleSettings);
                              }}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold gap-2"
                            >
                              <FiEdit3 /> تعديل الإعدادات
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => fetchNewsForRoom(circle.id, circleSettings, roomTranslations[circle.name] || circle.name)}
                              disabled={fetchingNews === circle.id}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold gap-2"
                            >
                              {fetchingNews === circle.id ? (
                                <FiRefreshCcw className="animate-spin" />
                              ) : (
                                <FiSearch />
                              )}
                              {fetchingNews === circle.id ? 'جاري البحث...' : 'بحث عن أخبار'}
                            </Button>
                            <Button 
                              onClick={() => generateFromSelectedNews(circle.id)}
                              disabled={generating === circle.id || !selectedNews[circle.id]}
                              className={`font-bold gap-2 rounded-xl ${selectedNews[circle.id] ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              {generating === circle.id ? (
                                <FiRefreshCcw className="animate-spin" />
                              ) : (
                                <FiZap />
                              )}
                              توليد من الخبر المختار
                            </Button>
                          </>
                        ) : (
                          <div className="flex gap-2">
                             <Button 
                               variant="ghost"
                               onClick={() => {
                                 setEditingCircleId(null);
                                 setEditForm(null);
                               }}
                               className="text-slate-500 font-bold"
                             >
                               إلغاء
                             </Button>
                             <Button 
                               onClick={() => saveSettings(circle.id)}
                               disabled={savingSettings === circle.id}
                               className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold gap-2"
                             >
                               {savingSettings === circle.id ? <FiRefreshCcw className="animate-spin" /> : <FiSave />}
                               حفظ التغييرات
                             </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🔍 نتائج البحث عن الأخبار */}
                    {newsResults[circle.id] && newsResults[circle.id].length > 0 && !isEditing && (
                      <div className="px-6 pb-4 border-b border-blue-50 bg-blue-50/10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-black text-blue-600 uppercase flex items-center gap-2">
                            <FiRss /> جلب الأخبار — {newsResults[circle.id].length} نتيجة
                          </p>
                          
                          {/* 🎛️ أدوات التحكم والفلترة */}
                          <div className="flex gap-2">
                            <Select 
                              value={newsSortOrder[circle.id] || 'relevance'} 
                              onValueChange={(val: any) => setNewsSortOrder({...newsSortOrder, [circle.id]: val})}
                            >
                              <SelectTrigger className="h-7 text-[10px] bg-white border-blue-100 min-w-[100px]">
                                <FiSliders className="mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="relevance">الأكثر صلة</SelectItem>
                                <SelectItem value="date">الأحداث أولاً</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select 
                              value={newsDateFilter[circle.id] || 'all'} 
                              onValueChange={(val: any) => setNewsDateFilter({...newsDateFilter, [circle.id]: val})}
                            >
                              <SelectTrigger className="h-7 text-[10px] bg-white border-blue-100 min-w-[100px]">
                                <FiClock className="mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">كل الأوقات</SelectItem>
                                <SelectItem value="today">اليوم</SelectItem>
                                <SelectItem value="week">هذا الأسبوع</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* 🌐 مصدر الأخبار */}
                            <Select 
                              value={newsSource[circle.id] || 'all'} 
                              onValueChange={(val: any) => setNewsSource({...newsSource, [circle.id]: val})}
                            >
                              <SelectTrigger className="h-7 text-[10px] bg-white border-blue-100 min-w-[100px]">
                                <FiSearch className="mr-1" />
                                <SelectValue placeholder="المصدر" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">كل المصادر</SelectItem>
                                <SelectItem value="google">Google News</SelectItem>
                                <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {newsResults[circle.id]
                            .filter((news: any) => {
                              const filter = newsDateFilter[circle.id] || 'all';
                              if (filter === 'all') return true;
                              const pubDate = new Date(news.pubDate);
                              const now = new Date();
                              if (filter === 'today') {
                                return pubDate.toDateString() === now.toDateString();
                              }
                              if (filter === 'week') {
                                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                                return pubDate >= weekAgo;
                              }
                              return true;
                            })
                            .sort((a, b) => {
                              if (newsSortOrder[circle.id] === 'date') return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
                              return b.relevance_score - a.relevance_score;
                            })
                            .map((news: any, idx: number) => {
                              const meta = articleMetas[news.link];
                              const isSelected = selectedNews[circle.id]?.link === news.link;

                              
                              return (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  key={idx}
                                  onClick={() => setSelectedNews(prev => ({ ...prev, [circle.id]: news }))}
                                  className={`group relative overflow-hidden rounded-xl border flex flex-col cursor-pointer transition-all duration-300 ${
                                    isSelected
                                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg bg-indigo-50/50'
                                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                  }`}
                                >
                                  {/* صورة الخبر */}
                                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                                    {(meta?.image || news.thumbnail) ? (
                                      <img 
                                        src={meta?.image || news.thumbnail} 
                                        alt="" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <FiLayout size={24} />
                                      </div>
                                    )}
                                    {/* شارة التاريخ والصلة */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                      <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] text-white font-black">
                                        {news.relevance_score * 10}% صلة
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                          <FiCheck size={20} />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* تفاصيل الخبر */}
                                  <div className="p-3 space-y-2 flex-1 flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <FiExternalLink className="text-[10px] text-blue-500" />
                                      <p className="text-[10px] font-black text-slate-500 uppercase truncate">
                                        {news.source || 'المصدر'} • {new Date(news.pubDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                      </p>
                                    </div>
                                    <h4 className={`text-xs font-black leading-snug line-clamp-2 ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                      {news.title}
                                    </h4>
                                    
                                    {news.reason && (
                                      <div className={`mt-auto p-1.5 rounded-lg text-[10px] font-bold ${isSelected ? 'bg-indigo-600/10 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        <span className="opacity-60">💡 {news.reason}</span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                        
                        {selectedNews[circle.id] && (
                          <div className="mt-4 p-4 bg-indigo-600 shadow-indigo-100 shadow-lg rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <FiCheck className="text-white" />
                              </div>
                              <div>
                                <p className="text-white font-black text-sm">تم تحديد الخبر بنجاح</p>
                                <p className="text-white/70 text-[10px] font-bold">جاهز للتوليد والمراجعة</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedNews(prev => { const n = {...prev}; delete n[circle.id]; return n; })}
                              className="text-white/60 hover:text-white text-xs font-bold"
                            >
                              إلغاء
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                      {isEditing ? (
                        <form id={`settings-form-${circle.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Column 1: Core Policy */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                <FiShield className="text-indigo-500" /> سياسة الغرفة (Room Policy)
                              </Label>
                              <Textarea 
                                value={editForm?.room_policy || ''}
                                onChange={(e) => setEditForm({...editForm, room_policy: e.target.value})}
                                placeholder="مثلاً: غرفة تركز على الجانب التاريخي والاجتماعي، النبرة هادئة ومحفزة..."
                                className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white transition-colors leading-relaxed"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                <FiTrendingUp className="text-emerald-500" /> هدف الأسبوع الحالي (Weekly Goal)
                              </Label>
                              <Input 
                                value={editForm?.active_goal || ''}
                                onChange={(e) => setEditForm({...editForm, active_goal: e.target.value})}
                                placeholder="مثلاً: زيادة الوعي بالمبادرة الجديدة..."
                                className="bg-slate-50 border-slate-200 focus:bg-white"
                              />
                            </div>

                            {/* 🔍 كلمات البحث */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                <FiSearch className="text-blue-500" /> كلمات البحث عن الأخبار
                              </Label>
                              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                                {/* العلامات الحالية */}
                                <div className="flex flex-wrap gap-2">
                                  {(editForm?.search_keywords || ['محرم بك', 'الإسكندرية']).map((kw: string, i: number) => (
                                    <span key={i} className="flex items-center gap-1 bg-white border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                      {kw}
                                      <button
                                        type="button"
                                        onClick={() => setEditForm({
                                          ...editForm,
                                          search_keywords: (editForm?.search_keywords || []).filter((_: string, idx: number) => idx !== i)
                                        })}
                                        className="text-blue-300 hover:text-red-500 transition-colors"
                                      >
                                        <FiX size={10} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                {/* إضافة كلمة جديدة */}
                                <div className="flex gap-2">
                                  <Input
                                    value={newKeywordInput}
                                    onChange={(e) => setNewKeywordInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newKeywordInput.trim()) {
                                        e.preventDefault();
                                        setEditForm({
                                          ...editForm,
                                          search_keywords: [...(editForm?.search_keywords || []), newKeywordInput.trim()]
                                        });
                                        setNewKeywordInput('');
                                      }
                                    }}
                                    placeholder="اكتب كلمة ثم اضغط Enter..."
                                    className="bg-white border-blue-200 focus:border-blue-400 text-sm flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (newKeywordInput.trim()) {
                                        setEditForm({
                                          ...editForm,
                                          search_keywords: [...(editForm?.search_keywords || []), newKeywordInput.trim()]
                                        });
                                        setNewKeywordInput('');
                                      }
                                    }}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    <FiPlus size={14} />
                                  </Button>
                                </div>
                                <p className="text-[10px] text-blue-400">هذه الكلمات ستُستخدم للبحث في Google News عند الضغط على "بحث عن أخبار"</p>
                              </div>
                            </div>

                            {/* 🎨 أسلوب المحتوى */}
                            <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                <FiMessageSquare className="text-purple-500" /> أسلوب كتابة المحتوى
                              </Label>
                              <Select
                                value={editForm?.content_style || 'motivational'}
                                onValueChange={(val) => setEditForm({...editForm, content_style: val})}
                              >
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder="اختر الأسلوب" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="motivational">تحفيزي وملهم 🔥</SelectItem>
                                  <SelectItem value="informative">إخباري وتوعوي 📰</SelectItem>
                                  <SelectItem value="story">قصصي وإنساني 📖</SelectItem>
                                  <SelectItem value="question">تفاعلي بالأسئلة ❓</SelectItem>
                                  <SelectItem value="mix">خليط ذكي 🎯</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>


                          {/* Column 2: Automation & Mix */}
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase">وضع النشر</Label>
                                <Select 
                                  value={editForm?.publish_mode} 
                                  onValueChange={(val) => setEditForm({...editForm, publish_mode: val})}
                                >
                                  <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="اختر الوضع" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manual">يدوي (Manual Approval)</SelectItem>
                                    <SelectItem value="auto_fallback">تلقائي مع مهلة (Fallback)</SelectItem>
                                    <SelectItem value="auto">تلقائي كامل (Full Auto)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase">مهلة التلقائي (ساعة)</Label>
                                <Input 
                                  type="number"
                                  value={editForm?.fallback_hours || 12}
                                  onChange={(e) => setEditForm({...editForm, fallback_hours: e.target.value})}
                                  className="bg-slate-50 border-slate-200 focus:bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                <FiSliders className="text-orange-500" /> خلطة المحتوى (Mix Preset)
                              </Label>
                              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-4">
                                <Select 
                                  value={editForm?.active_preset_name} 
                                  onValueChange={(val) => setEditForm({...editForm, active_preset_name: val})}
                                >
                                  <SelectTrigger className="bg-white border-orange-200">
                                    <SelectValue placeholder="اختر Preset" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">الوضع القياسي (Standard Balanced)</SelectItem>
                                    <SelectItem value="engagement_boost">تعزيز التفاعل (High Engagement)</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <div className="grid grid-cols-4 gap-2">
                                  {Object.entries(editForm?.presets?.[editForm?.active_preset_name] || {}).map(([type, val]: [any, any]) => (
                                    <div key={type} className="text-center p-2 bg-white border border-orange-100 rounded-lg shadow-sm">
                                      <p className="text-[8px] font-black text-orange-400 uppercase">{type}</p>
                                      <p className="text-sm font-black text-slate-800">{val}%</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                <FiShield />
                                <span className="text-xs font-black uppercase">السياسة المتبعة</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50 italic min-h-[80px]">
                                "{circleSettings.room_policy || 'لم يتم تحديد سياسة للغرفة بعد...'}"
                              </p>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <FiTarget />
                                <span className="text-xs font-black uppercase">الهدف الحالي</span>
                              </div>
                              <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 flex flex-col justify-center min-h-[80px]">
                                <h4 className="text-sm font-black text-slate-800">{circleSettings.active_goal || 'الترحيب والمشاركة'}</h4>
                                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">ACTIVE CAMPAIGN</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <FiSliders />
                                <span className="text-xs font-black uppercase">التحكم الآلي والخلطة</span>
                              </div>
                              <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/50 space-y-3 min-h-[80px]">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500 font-bold">وضع النشر:</span>
                                  <Badge className="bg-orange-100 text-orange-700 border-none font-black uppercase text-[9px]">
                                    {circleSettings.publish_mode}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500 font-bold">الخلطة:</span>
                                  <span className="text-slate-800 font-black">{circleSettings.active_preset_name}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* 📑 Jobs Tab */}
          <TabsContent value="jobs">
            <Card className="border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FiActivity className="text-blue-600" /> سجل عمليات توليد المحتوى
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase">
                      <th className="px-6 py-4">الغرفة</th>
                      <th className="px-6 py-4">عدد المنشورات</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {roomTranslations[job.zoon_rooms?.name] || job.zoon_rooms?.name || 'غرفة غير معروفة'}
                        </td>
                        <td className="px-6 py-4 font-black">{job.posts_generated || 0}</td>
                        <td className="px-6 py-4">
                          <Badge className={`
                            ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                              job.status === 'running' ? 'bg-blue-100 text-blue-700' : 
                              'bg-red-100 text-red-700'} 
                            border-none font-black text-[9px] uppercase
                          `}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                          {new Date(job.created_at).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                          لا توجد سجلات لعمليات سابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 🤖 AI Engine Setup Tab */}
          <TabsContent value="ai-setup">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-100">
                    <FiCpu size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">إعداد Gemini 2.5 Flash-Lite</h2>
                    <p className="text-slate-500 font-bold">المحرك المسؤول عن توليد المحتوى النفسي</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                       <FiCheck className="text-emerald-500" /> خطوات التشغيل العملي:
                    </h3>
                    <ol className="text-sm text-slate-600 space-y-3 font-medium list-decimal list-inside pr-4">
                      <li>اذهب إلى <a href="https://aistudio.google.com/" target="_blank" className="text-blue-600 underline">Google AI Studio</a></li>
                      <li>قم بإنشاء <b>API Key</b> مجاني لنموذج Gemini 2.5 Flash-Lite.</li>
                      <li>أضف المفتاح في ملف الـ <code>.env</code> تحت اسم: <br/>
                        <code className="bg-slate-200 p-1 rounded text-red-600 text-[10px] select-all">NEXT_PUBLIC_GEMINI_API_KEY</code>
                      </li>
                      <li>تأكد من ضبط "سياسة الغرفة" في تبويب الإعدادات لكل دائرة.</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
                    <FiShield className="text-amber-600 mt-1" size={20} />
                    <div className="text-xs text-amber-900 font-bold leading-relaxed">
                      نظام الأتمتة يعتمد على الهيكلية الهجينة (Hybrid Structure). يقوم Gemini Flash بدمج أخبار المنطقة مع سياسة الغرفة المحددة لإنتاج منشورات تشبه "أهل محرم بك".
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-2xl font-black text-lg gap-3"
                    onClick={async () => {
                      try {
                        toast.loading('جاري اختبار الاتصال بالمحرك...');
                        const testPrompt = "أعطني جملة ترحيبية قصيرة جداً بلهجة إسكندرية لأهل محرم بك بصيغة JSON: {\"reply\": \"...\"}";
                        const res = await advancedPsychologicalEngine.generateTextWithGemini(testPrompt);
                        toast.dismiss();
                        toast.success('تم الاتصال بنجاح! المحرك يعمل.');
                        console.log('Gemini Test:', res);
                      } catch (e: any) {
                        toast.dismiss();
                        toast.error('فشل الاتصال: ' + e.message);
                      }
                    }}
                  >
                    <FiZap /> فحص اتصال المحرك الذكي
                  </Button>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6 border-slate-200 bg-slate-900 text-white overflow-hidden relative">
                   <div className="relative z-10">
                      <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                        <FiMessageSquare className="text-blue-400" /> نموذج الـ Prompt الهجين
                      </h3>
                      <p className="text-xs text-slate-400 mb-4 font-bold">هذا ما يراه Gemini Flash عند التوليد</p>
                      <pre className="text-[10px] bg-black/50 p-4 rounded-xl font-mono text-blue-300 overflow-x-auto leading-relaxed border border-white/10">
{`أنت "مايسترو المحتوى" لنادي زوون في محرم بك.
[LAYER 1: IDENTITY] سكندري دافئ وأصيل.
[LAYER 2: POLICY] {سياسة الغرفة من الإعدادات}
[LAYER 3: GOAL] {الأهداف الحالية لنوع المنشور}
[NEWS] {أحدث أخبار محرم بك المجلوبة}

المطلوب: توليد منشور بلهجة طبيعية 
مع تحليل نفسي كامل (JSON Mode)`}
                      </pre>
                   </div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </Card>

                <Card className="p-6 border-slate-200">
                  <h3 className="text-slate-800 font-black mb-4 flex items-center gap-2">
                    <FiSliders className="text-indigo-600" /> منطق أتمتة النشر
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500 font-bold">وضع (Auto Fallback)</span>
                      <Badge className="bg-blue-100 text-blue-700">موصى به</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      في هذا الوضع، يقوم Gemini بتوليد المنشورات ووضعها في طابور المراجعة لمدة 12 ساعة (Auto Fallback). إذا لم يقم الأدمن بالرفض خلالها، يتم النشر تلقائياً.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ✏️ محرر المنشور قبل الحفظ */}
      <Dialog open={postEditorModal?.open} onOpenChange={(open) => !open && setPostEditorModal(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[90vh]">
            
            {/* 📝 جانب المحرر */}
            <div className="col-span-3 p-8 bg-white space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <FiEdit3 className="text-indigo-600" /> مراجعة وتعديل المنشور
                </DialogTitle>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">نص المنشور</Label>
                  <Textarea 
                    value={postEditorModal?.content}
                    onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="min-h-[250px] text-base leading-relaxed border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl"
                    placeholder="اكتب محتوى المنشور هنا..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">نشر في غرفة (Target Room)</Label>
                    <Select 
                      value={postEditorModal?.circleId} 
                      onValueChange={(val) => setPostEditorModal(prev => prev ? { ...prev, circleId: val } : null)}
                    >
                      <SelectTrigger className="text-xs h-9 border-slate-200">
                        <SelectValue placeholder="اختر الغرفة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {circles.map(room => (
                          <SelectItem key={room.id} value={room.id} className="text-xs">
                            {room.icon} {roomTranslations[room.name] || room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">رابط المصدر (Link)</Label>
                    <Input 
                      value={postEditorModal?.sourceLink || ''}
                      onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, sourceLink: e.target.value } : null)}
                      className="text-xs h-9 border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">رابط الصورة (AI أو المصدر)</Label>
                  <Input 
                    value={postEditorModal?.imageUrl || ''}
                    onChange={(e) => setPostEditorModal(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                    className="text-xs border-slate-200"
                  />
                </div>

                {/* 🔍 البحث عن صور إضافية */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                    <FiSearch /> هل تريد صورة أفضل؟ ابحث هنا:
                  </Label>
                  <div className="flex gap-2">
                    <Select value={imageSource} onValueChange={setImageSource}>
                      <SelectTrigger className="h-9 text-[10px] bg-white border-slate-200 min-w-[100px]">
                        <SelectValue placeholder="المصدر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المصادر</SelectItem>
                        <SelectItem value="pixabay">Pixabay</SelectItem>
                        <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="مثلاً: الإسكندرية، محرم بك، طعام، رياضة..."
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchSuggestedImages(imageSearchQuery)}
                      className="h-9 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => fetchSuggestedImages(imageSearchQuery)}
                      disabled={searchingImages}
                      className="bg-slate-800 hover:bg-black h-9 px-4"
                    >
                      {searchingImages ? <FiRefreshCcw className="animate-spin" /> : 'بحث'}
                    </Button>
                  </div>

                  {searchingImages ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                      <FiRefreshCcw className="animate-spin text-indigo-600 mb-2" />
                      <span className="text-[10px] text-slate-400 font-bold">جاري البحث في المصادر المختارة...</span>
                    </div>
                  ) : imageSearchResults.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 mt-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {imageSearchResults.map((img, i) => (
                        <div 
                          key={i} 
                          onClick={() => setPostEditorModal(prev => prev ? { ...prev, imageUrl: img.url } : null)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            postEditorModal?.imageUrl === img.url ? 'border-indigo-600 scale-95' : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={img.thumb} className="w-full h-full object-cover" alt="Search result" />
                        </div>
                      ))}
                    </div>
                  ) : imageSearchQuery && (
                    <div className="p-4 text-center bg-slate-100/50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">لم نجد صوراً لـ "{imageSearchQuery}". جرب كلمات أبسط.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  onClick={saveEditedPost}
                  disabled={!!generating}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100"
                >
                  {generating ? <span className="animate-spin mr-2">⏳</span> : <FiCheck className="mr-2" />}
                  حفظ في الطابور للموافقة
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setPostEditorModal(null)}
                  className="h-12 px-6 border-slate-200 font-bold rounded-xl"
                >
                  إلغاء
                </Button>
              </div>
            </div>

            {/* 🖼️ جانب المعاينة */}
            <div className="col-span-2 p-8 bg-slate-50 border-r border-slate-200 space-y-6 overflow-y-auto">
              <Label className="text-[10px] font-black text-slate-400 uppercase">معاينة المنشور (Preview)</Label>
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
                    Z
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">Zoon Club Admin</p>
                    <p className="text-[10px] text-slate-400 font-bold">الآن • عام</p>
                  </div>
                </div>

                {/* Image */}
                {postEditorModal?.imageUrl && (
                  <div className="aspect-[4/3] bg-slate-100 relative">
                    <img 
                      src={postEditorModal.imageUrl} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {postEditorModal?.content || 'نص المنشور سيظهر هنا...'}
                  </p>

                  {/* Link Preview */}
                  {postEditorModal?.sourceLink && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                        <FiExternalLink className="text-slate-400" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-800 truncate">{postEditorModal?.sourceTitle}</p>
                        <p className="text-[9px] text-slate-400 truncate text-ellipsis whitespace-nowrap overflow-hidden">{postEditorModal?.sourceLink}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Psychological Badges */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase">تحليل التأثير النفسي</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                    😊 إيجابي (Positive)
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                    🏠 شعور بالانتماء
                  </Badge>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
