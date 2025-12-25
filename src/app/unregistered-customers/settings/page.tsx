"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Loader2, Save, Upload, Youtube, MessageSquare, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/shared/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ContactSettings {
  defaultVideoLink: string;
  defaultAppLink: string;
  defaultWhatsAppMessage: string;
}

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  file_size: number;
  duration?: number;
  thumbnail_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url?: string;
}

export default function UnregisteredCustomersSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const supabase = createClientComponentClient();
  const [settings, setSettings] = useState<ContactSettings>({
    defaultVideoLink: 'https://www.youtube.com/watch?v=example',
    defaultAppLink: 'https://play.google.com/store/apps/details?id=com.example.app',
    defaultWhatsAppMessage: `مرحباً {customerName}،\n\nنود دعوتك لتجربة تطبيقنا الجديد الذي سيساعدك في إدارة طلباتك بكل سهولة.\n\nفيديو توضيحي: {videoLink}\n\nرابط التحميل: {appLink}\n\nنتطلع للتواصل معك قريباً!`
  });

  // جلب الإعدادات عند تحميل الصفحة
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('customer_communication_settings')
          .select('*')
          .eq('key', 'unregistered_customers_contact')
          .maybeSingle();

        // PGRST116: "JSON object requested, multiple (or no) rows returned"
        // هذا يعني أن الجدول فارغ، وهذا أمر عادي - سنستخدم القيم الافتراضية
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
          return;
        }

        // إذا كانت هناك بيانات، استخدمها؛ وإلا استخدم القيم الافتراضية
        if (data && data.value) {
          setSettings(data.value as ContactSettings);
        }
        // إذا لم توجد بيانات، سنستخدم القيم الافتراضية المُعرّفة في useState
        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        if (data && data.value) {
          setSettings(data.value as ContactSettings);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    fetchVideos();
  }, []);

  // جلب قائمة الفيديوهات
  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_tutorial_videos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // جلب روابط الوصول للفيديوهات
        const videosWithUrls = await Promise.all(data.map(async (video) => {
          const { data: urlData } = await supabase
            .storage
            .from('customer_communication_files')
            .createSignedUrl(video.file_path, 60 * 60); // رابط صالح لمدة ساعة
            
          return {
            ...video,
            url: urlData?.signedUrl || ''
          };
        }));
        
        setVideos(videosWithUrls);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('customer_communication_settings')
        .upsert(
          {
            key: 'unregistered_customers_contact',
            value: settings,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) {
        throw error;
      }

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ إعدادات التواصل مع العملاء غير المسجلين',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم يتم حفظ الإعدادات، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // تحميل فيديو جديد
  const handleUploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);

    try {
      // 1. تحميل الملف إلى Storage
      const filePath = `videos/${Date.now()}_${file.name}`;
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('customer_communication_files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // إنشاء رابط عام للملف (اختياري)
      const { data: publicUrlData } = await supabase
        .storage
        .from('customer_communication_files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // رابط صالح لمدة سنة
      
      const publicUrl = publicUrlData?.signedUrl || '';
      
      // 2. إنشاء سجل في جدول customer_tutorial_videos
      const { data, error } = await supabase
        .from('customer_tutorial_videos')
        .insert({
          title: videoTitle || 'فيديو تعريفي جديد',
          description: videoDescription || 'فيديو تعريفي للعملاء غير المسجلين',
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          // duration: videoDuration, // يمكن إضافته لاحقاً
        });
      
      if (error) throw error;
      
      // 3. تحديث إعدادات التواصل مع رابط الفيديو الجديد
      if (publicUrl) {
        setSettings(prev => ({
          ...prev,
          defaultVideoLink: publicUrl
        }));
      }
      
      toast({
        title: 'تم التحميل بنجاح',
        description: 'تم تحميل الفيديو التعريفي بنجاح',
        variant: 'default',
      });
      
      // إعادة تعيين حقول النموذج
      setVideoTitle('');
      setVideoDescription('');
      
      // إعادة تحميل قائمة الفيديوهات
      fetchVideos();
      
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم يتم تحميل الفيديو، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // حذف فيديو
  const handleDeleteVideo = async (videoId: string, filePath: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      return;
    }
    
    try {
      // 1. حذف الملف من التخزين
      const { error: storageError } = await supabase
        .storage
        .from('customer_communication_files')
        .remove([filePath]);
        
      if (storageError) throw storageError;
      
      // 2. حذف السجل من قاعدة البيانات
      const { error: dbError } = await supabase
        .from('customer_tutorial_videos')
        .delete()
        .eq('id', videoId);
        
      if (dbError) throw dbError;
      
      // 3. تحديث القائمة
      fetchVideos();
      
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف الفيديو التعريفي',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم يتم حذف الفيديو، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout title="إعدادات التواصل مع العملاء غير المسجلين">
      <div className="space-y-4">
        {/* عنوان الصفحة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">إعدادات التواصل مع العملاء غير المسجلين</h1>
            <p className="text-muted-foreground">تخصيص طرق التواصل مع العملاء غير المسجلين</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="messages" className="text-right">
                <MessageSquare className="h-4 w-4 ml-2" />
                رسائل التواصل
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-right">
                <Youtube className="h-4 w-4 ml-2" />
                الفيديوهات التعريفية
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">رسائل التواصل الافتراضية</CardTitle>
                  <CardDescription>
                    تخصيص الرسائل التي سيتم إرسالها للعملاء غير المسجلين
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultWhatsAppMessage" className="block text-right">رسالة واتساب الافتراضية</Label>
                    <p className="text-sm text-gray-500 text-right mb-2">
                      يمكنك استخدام المتغيرات التالية: {'{customerName}'} لاسم العميل، {'{videoLink}'} لرابط الفيديو، {'{appLink}'} لرابط التطبيق
                    </p>
                    <Textarea 
                      id="defaultWhatsAppMessage" 
                      value={settings.defaultWhatsAppMessage} 
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultWhatsAppMessage: e.target.value }))} 
                      placeholder="أدخل رسالة واتساب الافتراضية..." 
                      className="min-h-[200px] text-right"
                      dir="rtl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultAppLink" className="block text-right">رابط التطبيق الافتراضي</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0"
                        onClick={() => window.open(settings.defaultAppLink, '_blank')}
                      >
                        <Download className="h-4 w-4 text-green-600" />
                      </Button>
                      <Input 
                        id="defaultAppLink" 
                        value={settings.defaultAppLink} 
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultAppLink: e.target.value }))} 
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="videos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الفيديوهات التعريفية</CardTitle>
                  <CardDescription>
                    إدارة الفيديوهات التعريفية للعملاء غير المسجلين
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultVideoLink" className="block text-right">رابط الفيديو الافتراضي</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0"
                        onClick={() => window.open(settings.defaultVideoLink, '_blank')}
                      >
                        <Youtube className="h-4 w-4 text-red-600" />
                      </Button>
                      <Input 
                        id="defaultVideoLink" 
                        value={settings.defaultVideoLink} 
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultVideoLink: e.target.value }))} 
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-4">
                      <Label htmlFor="videoTitle" className="block mb-1 text-right">عنوان الفيديو</Label>
                      <Input 
                        id="videoTitle" 
                        value={videoTitle} 
                        onChange={(e) => setVideoTitle(e.target.value)} 
                        className="text-right"
                        placeholder="أدخل عنوان الفيديو"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="videoDescription" className="block mb-1 text-right">وصف الفيديو</Label>
                      <Textarea 
                        id="videoDescription" 
                        value={videoDescription} 
                        onChange={(e) => setVideoDescription(e.target.value)} 
                        className="text-right min-h-[80px]"
                        placeholder="أدخل وصف الفيديو"
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type="file"
                        id="videoUpload"
                        accept="video/mp4,video/webm"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUploadVideo}
                        disabled={isUploading}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-2 h-32 flex flex-col items-center justify-center"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-8 w-8 mb-2 text-gray-400 animate-spin" />
                            <span className="text-sm text-gray-500">جاري التحميل...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mb-2 text-gray-400" />
                            <span className="text-sm text-gray-500">انقر لتحميل فيديو جديد</span>
                            <span className="text-xs text-gray-400 mt-1">MP4, WebM, أقصى حجم: 100MB</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {videos.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-right">الفيديوهات المحملة</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video) => (
                          <Card key={video.id} className="overflow-hidden">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                              {video.url ? (
                                <video 
                                  src={video.url} 
                                  controls 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Youtube className="h-12 w-12 text-gray-300" />
                              )}
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-medium text-right">{video.title}</h4>
                              <p className="text-sm text-gray-500 text-right mt-1">{video.description}</p>
                              <div className="flex justify-between items-center mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteVideo(video.id, video.file_path)}
                                >
                                  <Trash2 className="h-3 w-3 ml-1" />
                                  حذف
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    setSettings(prev => ({
                                      ...prev,
                                      defaultVideoLink: video.url || prev.defaultVideoLink
                                    }));
                                    toast({
                                      title: 'تم التعيين',
                                      description: 'تم تعيين الفيديو كفيديو افتراضي',
                                      variant: 'default',
                                    });
                                  }}
                                >
                                  تعيين كافتراضي
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {/* زر الحفظ */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
} 