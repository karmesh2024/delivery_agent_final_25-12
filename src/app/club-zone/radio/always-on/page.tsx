'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  FiRadio, 
  FiPlay, 
  FiSquare, 
  FiSettings,
  FiRefreshCw,
  FiActivity,
  FiArrowLeft,
  FiLink,
  FiCopy,
  FiCheck,
  FiUsers,
  FiClock,
  FiList,
  FiVideo
} from 'react-icons/fi';
import Link from 'next/link';
import { ContentLibrary } from '@/domains/club-zone/components/ContentLibrary';
import { TimelineEditor } from '@/domains/club-zone/components/TimelineEditor';
import { VisualAdsPlayer } from '@/domains/club-zone/components/VisualAdsPlayer';
import { autoSwitchService } from '@/domains/club-zone/services/autoSwitchService';
import { playlistEngineService } from '@/domains/club-zone/services/playlistEngineService';
import { toast } from 'react-toastify';

interface M3UUrls {
  playlist_api?: string;
  ads_api?: string;
  playlist_storage?: string;
  ads_storage?: string;
}

interface FullStatus {
  broadcast_status?: {
    is_running: boolean;
    stream_url?: string;
    started_at?: string;
  };
  listeners?: {
    current_count: number;
  };
  current_item?: {
    title: string;
    content_type: string;
    duration_seconds: number;
  };
  next_item?: {
    title: string;
  };
  m3u_urls?: M3UUrls;
  timeline_summary?: {
    total_items: number;
  };
}

export default function AlwaysOnPage() {
  const [status, setStatus] = useState<any>(null);
  const [fullStatus, setFullStatus] = useState<FullStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isGeneratingM3U, setIsGeneratingM3U] = useState(false);
  const [icecastUrl, setIcecastUrl] = useState('http://radio.karmesh.eg:8000/stream');
  const [activityId, setActivityId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showVisualAdsPlayer, setShowVisualAdsPlayer] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // تحديث كل 5 ثواني
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const broadcastStatus = await autoSwitchService.getBroadcastStatus();
      setStatus(broadcastStatus);

      // جلب Always-On Activity ID
      if (broadcastStatus.always_on_id) {
        setActivityId(broadcastStatus.always_on_id);
        const engineStatus = await playlistEngineService.getEngineStatus(broadcastStatus.always_on_id);
        setStatus((prev: any) => ({ ...prev, engine: engineStatus }));
      }

      // جلب الحالة الكاملة من API
      try {
        const response = await fetch('/api/playlist-engine/status');
        if (response.ok) {
          const result = await response.json();
          setFullStatus(result.data);
        }
      } catch (apiError) {
        console.warn('Could not fetch full status:', apiError);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateM3U = async () => {
    try {
      setIsGeneratingM3U(true);
      const result = await playlistEngineService.generateM3UPlaylist();
      if (result.success) {
        toast.success(`تم توليد M3U بنجاح (${result.items_count} عنصر)`);
        loadStatus();
      } else {
        toast.error(result.error || 'فشل في توليد M3U');
      }
    } catch (error) {
      console.error('Error generating M3U:', error);
      toast.error('حدث خطأ أثناء توليد M3U');
    } finally {
      setIsGeneratingM3U(false);
    }
  };

  const copyToClipboard = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success(`تم نسخ ${label}`);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error('فشل في النسخ');
    }
  };

  const handleStart = async () => {
    if (!icecastUrl) {
      toast.error('يرجى إدخال رابط Icecast');
      return;
    }

    try {
      setIsStarting(true);

      // إنشاء Always-On Activity إذا لم يكن موجوداً
      let currentActivityId = activityId;
      if (!currentActivityId) {
        currentActivityId = await autoSwitchService.createAlwaysOnActivity({
          title: 'البث العام المستمر',
          playlist_engine_url: icecastUrl,
          description: 'بث عام مستمر 24/7',
        });
        setActivityId(currentActivityId);
      }

      // بدء Playlist Engine
      await playlistEngineService.startEngine(currentActivityId, icecastUrl);

      toast.success('تم بدء البث العام المستمر بنجاح');
      loadStatus();
    } catch (error: any) {
      console.error('Error starting Always-On:', error);
      toast.error(error.message || 'حدث خطأ أثناء بدء البث');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!activityId) {
      toast.error('لا يوجد بث نشط');
      return;
    }

    try {
      setIsStopping(true);
      await playlistEngineService.stopEngine(activityId);
      toast.success('تم إيقاف البث العام المستمر');
      loadStatus();
    } catch (error: any) {
      console.error('Error stopping Always-On:', error);
      toast.error(error.message || 'حدث خطأ أثناء إيقاف البث');
    } finally {
      setIsStopping(false);
    }
  };

  const isRunning = status?.current_mode === 'always_on' && status?.is_live;

  return (
    <DashboardLayout title="البث العام">
      <div className="space-y-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/club-zone/radio">
            <FiArrowLeft className="mr-2" />
            العودة إلى راديو كارمش
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">البث العام المستمر</h1>
            <p className="text-gray-500">إدارة البث المستمر 24/7</p>
          </div>
          <Button
            onClick={() => setShowVisualAdsPlayer(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FiVideo className="w-4 h-4" />
            عرض إعلان مرئي
          </Button>
        </div>

        {/* Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiActivity className="w-5 h-5" />
              حالة البث
            </CardTitle>
            <CardDescription>
              حالة البث العام المستمر والتحكم فيه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <Badge
                variant={isRunning ? 'default' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                {isRunning ? (
                  <>
                    <FiRadio className="w-4 h-4 mr-2 animate-pulse" />
                    البث نشط
                  </>
                ) : (
                  <>
                    <FiSquare className="w-4 h-4 mr-2" />
                    البث متوقف
                  </>
                )}
              </Badge>
              {status?.engine && (
                <div className="text-sm text-gray-500">
                  المستمعون: {status.engine.listeners_count || 0}
                </div>
              )}
            </div>

            {/* Icecast URL */}
            <div>
              <Label>رابط Icecast Server</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={icecastUrl}
                  onChange={(e) => setIcecastUrl(e.target.value)}
                  placeholder="http://radio.karmesh.eg:8000/stream"
                  disabled={isRunning}
                />
                <Button
                  variant="outline"
                  onClick={loadStatus}
                  disabled={loading}
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={isStarting || !icecastUrl}
                  className="flex items-center gap-2"
                >
                  <FiPlay className="w-4 h-4" />
                  {isStarting ? 'جاري البدء...' : 'بدء البث'}
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  disabled={isStopping}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <FiSquare className="w-4 h-4" />
                  {isStopping ? 'جاري الإيقاف...' : 'إيقاف البث'}
                </Button>
              )}
            </div>

            {/* Current/Next Item Info */}
            {isRunning && status?.engine && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-gray-500">المحتوى الحالي</Label>
                  <p className="font-semibold">
                    {status.engine.current_item?.content?.title || fullStatus?.current_item?.title || 'لا يوجد'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">المحتوى التالي</Label>
                  <p className="font-semibold">
                    {status.engine.next_item?.content?.title || fullStatus?.next_item?.title || 'لا يوجد'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* M3U URLs & Stream Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiLink className="w-5 h-5" />
              روابط M3U والبث
            </CardTitle>
            <CardDescription>
              روابط ملفات M3U لـ Liquidsoap والتحكم في توليدها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generate M3U Button */}
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateM3U}
                disabled={isGeneratingM3U}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiList className="w-4 h-4" />
                {isGeneratingM3U ? 'جاري التوليد...' : 'توليد M3U الآن'}
              </Button>
              <div className="text-sm text-gray-500 flex items-center">
                <FiClock className="w-4 h-4 mr-1" />
                يتم التحديث تلقائياً كل دقيقة
              </div>
            </div>

            {/* M3U URLs */}
            <div className="space-y-3">
              {/* Playlist M3U */}
              {fullStatus?.m3u_urls?.playlist_storage && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Playlist M3U</Label>
                    <p className="text-sm font-mono truncate">
                      {fullStatus.m3u_urls.playlist_storage}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(fullStatus.m3u_urls!.playlist_storage!, 'رابط Playlist')}
                  >
                    {copiedUrl === fullStatus.m3u_urls.playlist_storage ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Ads M3U */}
              {fullStatus?.m3u_urls?.ads_storage && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Scheduled Ads M3U</Label>
                    <p className="text-sm font-mono truncate">
                      {fullStatus.m3u_urls.ads_storage}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(fullStatus.m3u_urls!.ads_storage!, 'رابط الإعلانات')}
                  >
                    {copiedUrl === fullStatus.m3u_urls.ads_storage ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Stream URL */}
              {icecastUrl && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs text-blue-600">Stream URL (للمستمعين)</Label>
                    <p className="text-sm font-mono truncate">
                      {icecastUrl}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(icecastUrl, 'رابط البث')}
                  >
                    {copiedUrl === icecastUrl ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FiUsers className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{fullStatus?.listeners?.current_count || 0}</p>
                <p className="text-xs text-gray-500">مستمعين</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FiList className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{fullStatus?.timeline_summary?.total_items || 0}</p>
                <p className="text-xs text-gray-500">عناصر في Timeline</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FiClock className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <p className="text-2xl font-bold">
                  {fullStatus?.current_item?.duration_seconds 
                    ? `${Math.floor(fullStatus.current_item.duration_seconds / 60)}:${String(fullStatus.current_item.duration_seconds % 60).padStart(2, '0')}`
                    : '--:--'
                  }
                </p>
                <p className="text-xs text-gray-500">مدة المحتوى الحالي</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">مكتبة المحتوى</TabsTrigger>
            <TabsTrigger value="timeline">الجدولة</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <Card>
              <CardContent className="pt-6">
                <ContentLibrary />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <TimelineEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات البث العام المستمر</CardTitle>
                <CardDescription>
                  إعدادات التبديل التلقائي والإعدادات الأخرى
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>التبديل التلقائي</Label>
                    <p className="text-sm text-gray-500">
                      التبديل التلقائي بين Always-On و Live Event
                    </p>
                  </div>
                  <Badge variant={status?.auto_switch_enabled ? 'default' : 'secondary'}>
                    {status?.auto_switch_enabled ? 'مفعل' : 'معطل'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  <p>عند بدء Live Event، سيتم إيقاف Always-On تلقائياً</p>
                  <p>عند انتهاء Live Event، سيتم إعادة تشغيل Always-On تلقائياً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Visual Ads Player */}
      <VisualAdsPlayer
        isVisible={showVisualAdsPlayer}
        onClose={() => setShowVisualAdsPlayer(false)}
        onAdComplete={(ad) => {
          console.log('Ad completed:', ad.title);
          // يمكن إضافة منطق إضافي هنا
        }}
        onAdInteract={(ad, interaction) => {
          console.log('Ad interaction:', ad.title, interaction);
          // يمكن إضافة منطق إضافي هنا
        }}
      />
    </DashboardLayout>
  );
}
