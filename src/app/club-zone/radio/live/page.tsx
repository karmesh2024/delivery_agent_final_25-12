'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { FiRadio, FiPlay, FiSquare, FiUsers, FiAward, FiCalendar, FiClock, FiTrendingUp, FiPlus, FiMapPin, FiStar, FiBarChart2, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentStream, startLiveStream, stopLiveStream, updateStreamUrl } from '@/domains/club-zone/store/clubZoneSlice';
import { clubRadioService } from '@/domains/club-zone/services/clubRadioService';
import { RadioListenerWithDetails, RadioStreamFormData } from '@/domains/club-zone/types';
import { clubPartnersService } from '@/domains/club-zone/services/clubPartnersService';
import { ClubPartner } from '@/domains/club-zone/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { LocationPermissionDialog } from '@/components/LocationPermissionDialog';

const LeafletMap = dynamic(
  () => import('@/domains/mapping/components/LeafletMap').then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 rounded-lg p-6 text-center flex items-center justify-center h-[400px]">
        <p className="text-gray-500">جاري تحميل الخريطة...</p>
      </div>
    )
  }
);

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
function errCode(e: unknown): string | undefined {
  return (typeof e === 'object' && e !== null && 'code' in e) ? (e as { code?: string }).code : undefined;
}

export function RadioContent() {
  const dispatch = useAppDispatch();
  const { currentStream, loading: reduxLoading } = useAppSelector((state) => state.clubZone);
  const [listeners, setListeners] = useState(0);
  const [activeListeners, setActiveListeners] = useState<RadioListenerWithDetails[]>([]);
  const [selectedListenerLocation, setSelectedListenerLocation] = useState<{ lat: number; lng: number; name: string; address?: string; source?: 'gps' | 'district' | 'address' } | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [shouldRenderOverviewMap, setShouldRenderOverviewMap] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [sessionStartAt, setSessionStartAt] = useState<string | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  const [currentListeningMinutes, setCurrentListeningMinutes] = useState(0);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [isNearPoint, setIsNearPoint] = useState(false);
  const [userSessionId, setUserSessionId] = useState<string | null>(null);
  const [isCongratsOpen, setIsCongratsOpen] = useState(false);
  const [autoStopMinutes, setAutoStopMinutes] = useState(30);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);
  const broadcastAutoStopTimeoutRef = useRef<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [pendingStartListening, setPendingStartListening] = useState<{userId: string; activityId: string} | null>(null);
  
  // ✅ V1.5: عداد النقاط المتوقع صرفها
  const expectedPayout = useMemo(() => {
    if (activeListeners.length === 0) return 0;
    return activeListeners
      .filter(l => l.is_active)
      .reduce((sum, listener) => sum + (listener.points_earned || 0), 0);
  }, [activeListeners]);

  // ✅ V1.5: إحصائيات متقدمة
  const stats = useMemo(() => {
    const active = activeListeners.filter(l => l.is_active);
    const playing = active.filter(l => l.is_playing);
    const paused = active.filter(l => !l.is_playing);
    const totalPoints = active.reduce((sum, l) => sum + (l.points_earned || 0), 0);
    const avgDuration = active.length > 0
      ? Math.round(active.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / active.length)
      : 0;

    return {
      total: active.length,
      playing: playing.length,
      paused: paused.length,
      totalPoints,
      avgDuration,
    };
  }, [activeListeners]);
  
  const isStopLoading = isStopping;
  const [partners, setPartners] = useState<ClubPartner[]>([]);
  const [formData, setFormData] = useState<RadioStreamFormData>({
    title: 'راديو كارمش - البث المباشر',
    scheduled_at: new Date().toISOString(),
    partner_id: undefined,
    stream_url: '',
    listen_url: '',
    max_listeners: 1000,
    stream_type: 'mp3',
    description: '',
    points_per_minute: 1,
    planned_duration_minutes: 30,
  });

  // ✅ FIX 1: استخدام useMemo مع deep comparison
  const mapLocations = useMemo(() => {
    const validListeners = activeListeners.filter(
      listener => listener.location?.latitude && listener.location?.longitude
    );

    console.log('[Radio Map] Valid listeners with location:', validListeners.length, 'out of', activeListeners.length);
    if (validListeners.length > 0) {
      console.log('[Radio Map] Sample location:', {
        id: validListeners[0].id,
        latitude: validListeners[0].location?.latitude,
        longitude: validListeners[0].location?.longitude,
        location: validListeners[0].location,
      });
    }

    return validListeners
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((listener, index) => {
        // ✅ V1.5: تحديد status بناءً على is_playing
        // إذا كان is_playing = true → 'delivered' (أخضر)
        // إذا كان is_playing = false → 'pending' (أصفر)
        // إذا كان غير متصل → 'canceled' (أحمر)
        const isOnline = listener.last_active_at 
          ? (Date.now() - new Date(listener.last_active_at).getTime()) < 5 * 60 * 1000
          : false;
        
        let status: 'delivered' | 'pending' | 'canceled' = 'delivered';
        if (!isOnline) {
          status = 'canceled'; // غير متصل = أحمر
        } else if (!listener.is_playing) {
          status = 'pending'; // توقف مؤقت = أصفر
        } else {
          status = 'delivered'; // يستمع الآن = أخضر
        }

        return {
          id: listener.id,
          lat: listener.location!.latitude!,
          lng: listener.location!.longitude!,
          name: listener.user_name || 'مستخدم',
          address: listener.location!.address || 'عنوان',
          source: listener.location!.source,
          status, // ✅ V1.5: تمرير status بناءً على is_playing
          type: 'delivery' as const, // مطلوب من DeliveryLocation interface
          label: listener.user_name || `مستخدم ${index + 1}`, // مطلوب من DeliveryLocation interface
        };
      });
  }, [activeListeners]);

  // ✅ FIX 2: استخدام ref لتتبع القيمة السابقة
  const prevMapLocationsRef = useRef<string>('');
  const mapLocationsKey = useMemo(() => 
    JSON.stringify(mapLocations.map(loc => ({ id: loc.id, lat: loc.lat, lng: loc.lng }))),
    [mapLocations]
  );

  // ✅ FIX 3: تأخير أطول وشرط أكثر صرامة
  useEffect(() => {
    const hasValidData = mapLocations.length > 0;
    const dataChanged = mapLocationsKey !== prevMapLocationsRef.current;

    console.log('[Radio Map] useEffect triggered:', {
      hasValidData,
      dataChanged,
      mapLocationsLength: mapLocations.length,
      shouldRender: shouldRenderOverviewMap,
    });

    if (hasValidData && dataChanged) {
      prevMapLocationsRef.current = mapLocationsKey;
      
      const timer = setTimeout(() => {
        console.log('[Radio Map] Setting shouldRenderOverviewMap to true');
        setShouldRenderOverviewMap(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (!hasValidData) {
      console.log('[Radio Map] No valid data, hiding map', {
        activeListenersCount: activeListeners.length,
        listenersWithLocation: mapLocations.length,
        sampleListener: activeListeners.length > 0 ? {
          id: activeListeners[0].id,
          hasLocation: !!activeListeners[0].location,
          location: activeListeners[0].location,
        } : null,
      });
      setShouldRenderOverviewMap(false);
      prevMapLocationsRef.current = '';
    }
  }, [mapLocations.length, mapLocationsKey]);

  useEffect(() => {
    if (isLocationDialogOpen) {
      const timer = setTimeout(() => {
        setShouldRenderMap(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderMap(false);
    }
  }, [isLocationDialogOpen]);

  // ✅ V1.5.1: دالة مساعدة لتحديد حالة المستمع (10 دقائق مطابق لـ RPC)
  const getListenerStatus = useCallback((listener: RadioListenerWithDetails) => {
    const isOnline = listener.last_active_at 
      ? (Date.now() - new Date(listener.last_active_at).getTime()) < 10 * 60 * 1000 // ✅ 10 دقائق
      : false;

    if (!isOnline) {
      return { 
        text: '🔴 غير متصل', 
        className: 'text-red-500',
        icon: '🔴'
      };
    }

    // ✅ V1.5: استخدام is_playing من قاعدة البيانات
    if (listener.is_playing) {
      return { 
        text: '🟢 يستمع الآن', 
        className: 'text-green-500',
        icon: '🟢'
      };
    } else {
      return { 
        text: '🟠 توقف مؤقت', 
        className: 'text-orange-500',
        icon: '🟠'
      };
    }
  }, []);

  // ✅ FIX 4: تحسين loadListeners
  const loadListeners = useCallback(async () => {
    if (!currentStream?.id) return;

    try {
      const [count, listenersWithDetails] = await Promise.all([
        clubRadioService.getCurrentListeners(currentStream.id),
        clubRadioService.getActiveListenersWithDetails(currentStream.id)
      ]);

      setListeners(count);
      
      setActiveListeners((prev) => {
        const prevIds = prev.map(l => l.id).sort().join(',');
        const newIds = listenersWithDetails.map(l => l.id).sort().join(',');
        
        if (prevIds === newIds && prev.length === listenersWithDetails.length) {
          return prev;
        }
        
        return listenersWithDetails;
      });
    } catch (error: unknown) {
      console.warn('Error loading listeners:', errMessage(error));
    }
  }, [currentStream?.id]);

  useEffect(() => {
    loadCurrentStream();
    loadPartners();
    
    if (currentStream?.id) {
      loadListeners();
    }
    
    // ✅ V1.5.1: تقليل وقت polling إلى 5 ثواني لتحديث أسرع
    const interval = setInterval(() => {
      loadCurrentStream();
      if (currentStream?.id) {
        loadListeners();
      }
    }, 5000); // ✅ 5 ثواني بدلاً من 10

    return () => clearInterval(interval);
  }, [currentStream?.id, loadListeners]);

  // V1.4: Real-time updates للوقت المتوقع والنقاط من قاعدة البيانات
  // ✅ V1.5.1: Real-time subscription لتحديث رابط البث
  useEffect(() => {
    if (!currentStream?.id || !supabase) return;

    console.log('[Radio Stream] Setting up subscription for stream updates:', currentStream.id);

    const supabaseClient = supabase; // Store in local variable for cleanup
    const streamChannel = supabaseClient
      .channel(`radio_stream_${currentStream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'club_activities',
          filter: `id=eq.${currentStream.id}`,
        },
        (payload) => {
          const updatedStream = payload.new as any;
          const oldStream = payload.old as any;
          
          console.log('[Radio Stream] Stream updated:', {
            id: updatedStream.id,
            stream_url: updatedStream.stream_url,
            listen_url: updatedStream.listen_url,
            is_live: updatedStream.is_live,
            was_live: oldStream?.is_live,
          });

          // ✅ V1.5.1: معالجة إيقاف البث (is_live = false)
          if (oldStream?.is_live === true && updatedStream.is_live === false) {
            console.log('[Radio Stream] Stream stopped by admin - stopping playback');
            
            // إيقاف audio player في الداش بورد
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            
            // تحديث Redux store
            dispatch(fetchCurrentStream());
            
            // إعادة تحميل القائمة لإخفاء المستمعين
            loadListeners();
            
            toast.info('تم إيقاف البث من قبل الإدارة');
            return;
          }

          // تحديث رابط البث في Redux store
          dispatch(fetchCurrentStream());

          // تحديث رابط البث في audio player إذا كان يعمل
          if (audioRef.current && !audioRef.current.paused && updatedStream.listen_url) {
            const wasPlaying = !audioRef.current.paused;
            audioRef.current.src = updatedStream.listen_url;
            if (wasPlaying) {
              audioRef.current.play().catch((err) => {
                console.error('[Radio Stream] Error playing updated URL:', err);
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Radio Stream] Subscription status:', status);
      });

    return () => {
      console.log('[Radio Stream] Cleaning up subscription');
      supabaseClient.removeChannel(streamChannel);
    };
  }, [currentStream?.id, dispatch]);

  useEffect(() => {
    if (!currentStream?.id || !supabase) return;

    console.log('[Radio Realtime] Setting up subscription for activity:', currentStream.id);
    
    // ✅ V1.5.1: إعداد retry logic
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    // إنشاء Realtime subscription لتحديثات radio_listeners
    const channel = supabase
      .channel(`radio_listeners_${currentStream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'radio_listeners',
          filter: `activity_id=eq.${currentStream.id}`,
        },
        (payload) => {
          const updatedListener = payload.new as any;
          console.log('[Radio Realtime] Received update:', {
            id: updatedListener.id,
            is_playing: updatedListener.is_playing,
            duration_minutes: updatedListener.duration_minutes,
            points_earned: updatedListener.points_earned,
          });
          
          // تحديث القيم فقط للمستمع المحدد (بدون إعادة تحميل كامل)
          setActiveListeners((prev) => {
            const index = prev.findIndex((l) => l.id === updatedListener.id);
            
            if (index === -1) {
              // إذا لم يكن المستمع موجوداً، لا نفعل شيئاً
              return prev;
            }
            
            // ✅ V1.5: تحديث القيم (duration_minutes و points_earned و is_playing و last_active_at)
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              duration_minutes: updatedListener.duration_minutes || 0,
              points_earned: updatedListener.points_earned || 0,
              is_playing: updatedListener.is_playing ?? true,  // ✅ V1.5: حالة التشغيل اللحظية
              last_active_at: updatedListener.last_active_at,
              updated_at: updatedListener.updated_at,
            };
            
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'radio_listeners',
          filter: `activity_id=eq.${currentStream.id}`,
        },
        async (payload) => {
          const newListener = payload.new as any;
          console.log('[Radio Realtime] New listener added:', {
            id: newListener.id,
            user_id: newListener.user_id,
            activity_id: newListener.activity_id,
          });
          
          // ✅ V1.5.1: جلب بيانات المستمع الجديد مباشرة من RPC (أسرع من إعادة تحميل كامل)
          try {
            if (!supabase) {
              console.warn('[Radio Realtime] Supabase not available, falling back to full reload');
              loadListeners();
              return;
            }
            
            // استخدام RPC function مباشرة لجلب المستمع الجديد
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_active_radio_listeners', { p_activity_id: currentStream.id });
            
            if (rpcError) {
              console.warn('[Radio Realtime] RPC error, falling back to full reload:', rpcError);
              loadListeners();
              return;
            }
            
            // البحث عن المستمع الجديد في النتائج
            const addedListenerData = rpcData?.find((l: any) => l.id === newListener.id);
            
            if (addedListenerData) {
              // ✅ جلب بيانات إضافية (user_phone, location) إذا لزم الأمر
              let userPhone: string | undefined;
              let location: any = addedListenerData.location;
              
              if (newListener.user_id && supabase) {
                try {
                  const { data: profile } = await supabase
                    .from('new_profiles')
                    .select('phone_number')
                    .eq('id', newListener.user_id)
                    .maybeSingle();
                  
                  if (profile) {
                    userPhone = profile.phone_number;
                  }
                } catch (err) {
                  console.warn('[Radio Realtime] Error fetching user phone:', err);
                }
              }
              
              // بناء كائن المستمع الكامل
              const addedListener: RadioListenerWithDetails = {
                ...addedListenerData,
                user_name: addedListenerData.user_name || 'مستخدم',
                user_phone: userPhone,
                location: location,
              };
              
              // إضافة المستمع الجديد مباشرة إلى القائمة
              setActiveListeners((prev) => {
                // التحقق من عدم وجود المستمع مسبقاً
                if (prev.some(l => l.id === addedListener.id)) {
                  return prev;
                }
                
                // إضافة المستمع الجديد في بداية القائمة
                return [addedListener, ...prev];
              });
              
              // تحديث عدد المستمعين
              setListeners((prev) => prev + 1);
              
              console.log('[Radio Realtime] New listener added instantly:', addedListener.user_name);
            } else {
              // إذا لم يتم العثور على المستمع (قد يكون خارج الفترة الزمنية)، إعادة تحميل كامل
              console.warn('[Radio Realtime] New listener not found in active list, reloading...');
              loadListeners();
            }
          } catch (error: unknown) {
            console.error('[Radio Realtime] Error fetching new listener details:', errMessage(error));
            // في حالة الخطأ، إعادة تحميل كامل كـ fallback
            loadListeners();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'radio_listeners',
          filter: `activity_id=eq.${currentStream.id}`,
        },
        (payload) => {
          console.log('[Radio Realtime] Listener removed:', payload);
          // ✅ V1.5.1: إزالة المستمع من القائمة وتحديث العدد
          setActiveListeners((prev) => {
            const filtered = prev.filter((l) => l.id !== payload.old.id);
            // تحديث عدد المستمعين
            setListeners(filtered.length);
            return filtered;
          });
        }
      )
      .subscribe((status) => {
        console.log('[Radio Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Radio Realtime] ✅ Successfully subscribed to radio_listeners updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Radio Realtime] ❌ Channel error - Real-time may not work');
          // إعادة المحاولة بعد 3 ثواني
          setTimeout(() => {
            console.log('[Radio Realtime] Retrying subscription...');
            loadListeners();
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          console.warn('[Radio Realtime] ⚠️ Subscription timed out - falling back to polling');
          retryCount++;
          
          // ✅ V1.5.1: إعادة المحاولة (حتى 3 مرات)
          if (retryCount <= maxRetries) {
            console.log(`[Radio Realtime] Retrying subscription (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              // إعادة تحميل القائمة كـ fallback
              loadListeners();
            }, 5000 * retryCount); // زيادة وقت الانتظار مع كل محاولة
          } else {
            console.error('[Radio Realtime] ❌ Max retries reached - using polling only');
          }
        } else if (status === 'CLOSED') {
          console.warn('[Radio Realtime] ⚠️ Subscription closed - will retry on next load');
        }
      });

    const supabaseClient = supabase; // Store in local variable for cleanup
    return () => {
      console.log('[Radio Realtime] Cleaning up subscription');
      if (supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [currentStream?.id, loadListeners]);

  useEffect(() => {
    if (currentStream?.planned_duration_minutes && currentStream.planned_duration_minutes > 0) {
      setAutoStopMinutes(currentStream.planned_duration_minutes);
    }
  }, [currentStream?.planned_duration_minutes]);

  const clearBroadcastAutoStopTimer = () => {
    if (broadcastAutoStopTimeoutRef.current) {
      window.clearTimeout(broadcastAutoStopTimeoutRef.current);
      broadcastAutoStopTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearBroadcastAutoStopTimer();
    if (!currentStream?.is_live) return;
    const mins = currentStream.planned_duration_minutes;
    if (!mins || mins <= 0) return;

    broadcastAutoStopTimeoutRef.current = window.setTimeout(() => {
      toast.info(`انتهت مدة البث المحددة (${mins} دقيقة) وسيتم إيقاف البث تلقائياً.`);
      handleStopStream();
    }, mins * 60 * 1000);

    return () => clearBroadcastAutoStopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStream?.id, currentStream?.is_live, currentStream?.planned_duration_minutes]);

  useEffect(() => {
    if (!sessionStartAt || !isPlaying) {
      setEstimatedPoints(0);
      setAnimatedPoints(0);
      setCurrentListeningMinutes(0);
      setIsNearPoint(false);
      return;
    }

    let lastSavedMinute = -1; // لتتبع آخر دقيقة تم حفظها

    const updateEstimatedPoints = () => {
      const now = new Date();
      const start = new Date(sessionStartAt);
      const diffMs = now.getTime() - start.getTime();
      const diffSeconds = diffMs / 1000;
      const diffMinutes = diffSeconds / 60;
      const currentMinute = Math.floor(diffMinutes);
      setCurrentListeningMinutes(currentMinute);
      
      const pointsRate = currentStream?.points_per_minute || 1;
      const estimated = diffMinutes * pointsRate;
      setEstimatedPoints(estimated);
      
      const nextPoint = Math.ceil(estimated);
      const distanceToNextPoint = nextPoint - estimated;
      const secondsToNextPoint = distanceToNextPoint * 60 / pointsRate;
      setIsNearPoint(secondsToNextPoint <= 10 && secondsToNextPoint > 0);

      // تحديث estimated_points في قاعدة البيانات كل دقيقة (مرجع تاريخي)
      if (currentMinute > lastSavedMinute && userSessionId) {
        lastSavedMinute = currentMinute;
        // تحديث قاعدة البيانات بشكل غير متزامن (لا ننتظر النتيجة)
        clubRadioService.updateEstimatedPoints(userSessionId, estimated).catch((err) => {
          console.warn('[Radio] Failed to update estimated_points:', err);
        });
      }
    };

    updateEstimatedPoints();
    const interval = setInterval(updateEstimatedPoints, 1000);

    return () => clearInterval(interval);
  }, [sessionStartAt, isPlaying, currentStream?.points_per_minute, userSessionId]);

  useEffect(() => {
    if (!isPlaying || !sessionStartAt) {
      setAnimatedPoints(0);
      return;
    }

    const animate = () => {
      setAnimatedPoints((current) => {
        const targetPoints = estimatedPoints;
        const diff = targetPoints - current;
        
        if (Math.abs(diff) < 0.01) {
          return targetPoints;
        }

        const step = diff * 0.2;
        return current + step;
      });
    };

    const interval = setInterval(animate, 100);
    return () => clearInterval(interval);
  }, [estimatedPoints, isPlaying, sessionStartAt]);

  const clearAutoStopTimer = () => {
    if (autoStopTimeoutRef.current) {
      window.clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };

  const stopListeningAndShowSummary = async (reason: 'manual' | 'auto' = 'manual') => {
    clearAutoStopTimer();
    if (!currentStream?.id || !supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const profileId = user.id;
      await clubRadioService.stopListening(profileId, currentStream.id);

      if (userSessionId) {
        try {
          const res = await clubRadioService.stopUserListeningSessionAndAward({
            sessionId: userSessionId,
            userId: profileId,
            activityId: currentStream.id,
          });
          setSessionStartAt(sessionStartAt);
          setSessionPoints(res.pointsEarned);
          setUserPoints(res.pointsEarned);
          setIsCongratsOpen(true);
          setUserSessionId(null);
        } catch (sessionError: unknown) {
          console.error('[Radio V1.3] Error closing session:', sessionError);
          setSessionPoints(0);
          setIsCongratsOpen(true);
          setUserSessionId(null);
        }
      } else {
        setSessionPoints(0);
        setIsCongratsOpen(true);
      }

      if (reason === 'auto') {
        toast.info('انتهت مدة الاستماع المحددة وتم إيقاف التشغيل تلقائياً.');
      }
    } catch (e: unknown) {
      console.warn('[Radio Points] stopListeningAndShowSummary failed:', errMessage(e));
    }
  };

  const loadPartners = async () => {
    try {
      const { data } = await clubPartnersService.getPartners({ is_active: true });
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadCurrentStream = async () => {
    try {
      await dispatch(fetchCurrentStream()).unwrap();
    } catch (error: unknown) {
      const code = errCode(error);
      const msg = errMessage(error);
      const isIgnorableError =
        code === 'PGRST116' ||
        code === 'PGRST406' ||
        msg.includes('No rows') ||
        msg.includes('406');

      if (!isIgnorableError) {
        console.error('Error loading stream:', error);
      }
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      title: 'راديو كارمش - البث المباشر',
      scheduled_at: new Date().toISOString(),
      partner_id: undefined,
      stream_url: '',
      listen_url: '',
      max_listeners: 1000,
      stream_type: 'mp3',
      description: '',
      points_per_minute: 1,
      planned_duration_minutes: 30,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === 'undefined' || value === '' ? undefined : value,
    }));
  };

  const handleStartStream = async () => {
    if (!formData.title || !formData.stream_url) {
      toast.error('الرجاء ملء العنوان ورابط البث');
      return;
    }

    try {
      const activity = await clubRadioService.createStream(formData);
      await dispatch(startLiveStream(activity.id)).unwrap();
      
      toast.success('تم بدء البث بنجاح');
      setIsDialogOpen(false);
      loadCurrentStream();
    } catch (error: unknown) {
      console.error('Error starting stream:', error);
      toast.error(errMessage(error) || 'حدث خطأ أثناء بدء البث');
    }
  };

  const handleStopStream = async () => {
    if (!currentStream) {
      toast.error('لا يوجد بث لإيقافه');
      return;
    }
    
    if (isStopping) return;
    
    setIsStopping(true);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = '';
          }
        }, 100);
      }
      
      await dispatch(stopLiveStream(currentStream.id)).unwrap();
      
      setListeners(0);
      toast.success('تم إيقاف البث بنجاح');
      await loadCurrentStream();
    } catch (error: unknown) {
      console.error('Error stopping stream:', error);
      toast.error(errMessage(error) || 'حدث خطأ أثناء إيقاف البث');
    } finally {
      setIsStopping(false);
    }
  };

  const handlePlayPause = async () => {
    if (!currentStream?.listen_url || !audioRef.current) return;

    const audio = audioRef.current;
    
    if (audio.paused) {
      if (audio.src !== currentStream.listen_url) {
        audio.src = currentStream.listen_url;
      }
      
      try {
        await audio.play();
        setIsPlaying(true);
        clearAutoStopTimer();
        if (autoStopMinutes > 0) {
          autoStopTimeoutRef.current = window.setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            setIsPlaying(false);
            stopListeningAndShowSummary('auto');
          }, autoStopMinutes * 60 * 1000);
        }
        
        if (currentStream?.id && supabase) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              let profileId: string | null = null;
              
              try {
                const { data: profile } = await supabase
                  .from('new_profiles')
                  .select('id')
                  .eq('id', user.id)
                  .maybeSingle();
                
                if (profile?.id) {
                  profileId = profile.id;
                }
              } catch {
                // تجاهل
              }
              
              if (!profileId) {
                profileId = user.id;
              }
              
              setPendingStartListening({
                userId: profileId,
                activityId: currentStream.id,
              });
              setShowLocationDialog(true);
            }
          } catch (listenError: unknown) {
            if (errCode(listenError) !== '23503') {
              console.warn('Could not prepare listening start:', listenError);
            }
          }
        }
      } catch (error: unknown) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        const errorMsg = errMessage(error) || 'حدث خطأ أثناء تشغيل البث.';
        setAudioError(errorMsg);
        toast.error(errorMsg);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      clearAutoStopTimer();
      
      if (currentStream?.id && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            let profileId: string | null = null;
            
            try {
              const { data: profile } = await supabase
                .from('new_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();
              
              if (profile?.id) {
                profileId = profile.id;
              }
            } catch {
              // تجاهل
            }
            
            if (!profileId) {
              profileId = user.id;
            }
            
            await clubRadioService.stopListening(profileId, currentStream.id);
            await stopListeningAndShowSummary('manual');
          }
        } catch (listenError: unknown) {
          if (errCode(listenError) !== '23503') {
            console.warn('Could not record listening stop:', listenError);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (audioRef.current && currentStream?.listen_url) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = currentStream.listen_url;
      setAudioError(null);
      if (wasPlaying && currentStream.is_live) {
        audioRef.current.play().catch((err) => {
          console.error('Error auto-playing:', err);
          setAudioError('لا يمكن تشغيل البث تلقائياً.');
        });
      }
    }
  }, [currentStream?.listen_url, currentStream?.is_live]);

  const handleOpenInNewTab = () => {
    if (currentStream?.listen_url) {
      window.open(currentStream.listen_url, '_blank');
    }
  };

  const handleLocationGranted = async (location: {
    lat: number;
    lng: number;
    accuracy?: number;
    source: 'gps' | 'district' | 'address';
    districtId?: string;
  }) => {
    if (!pendingStartListening) return;

    try {
      await clubRadioService.startListening(
        pendingStartListening.userId,
        pendingStartListening.activityId,
        location
      );
      try {
        const { sessionId } = await clubRadioService.startUserListeningSession({
          userId: pendingStartListening.userId,
          activityId: pendingStartListening.activityId,
        });
        setUserSessionId(sessionId);
      } catch (e: unknown) {
        console.warn('[Radio] Could not create session:', errMessage(e));
      }
      setSessionStartAt(new Date().toISOString());
    } catch (error) {
      console.error('[Radio] Error saving location:', error);
    }

    setPendingStartListening(null);
    setShowLocationDialog(false);
  };

  const handleLocationDenied = async () => {
    if (!pendingStartListening) return;

    try {
      await clubRadioService.startListening(
        pendingStartListening.userId,
        pendingStartListening.activityId
      );
      try {
        const { sessionId } = await clubRadioService.startUserListeningSession({
          userId: pendingStartListening.userId,
          activityId: pendingStartListening.activityId,
        });
        setUserSessionId(sessionId);
      } catch (e: unknown) {
        console.warn('[Radio] Could not create session:', errMessage(e));
      }
      setSessionStartAt(new Date().toISOString());
    } catch (error) {
      console.warn('Could not record listening start:', error);
    }

    setPendingStartListening(null);
    setShowLocationDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiRadio className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">راديو كارمش</h1>
        </div>
        {currentStream?.is_live && (
          <Badge variant="destructive" className="px-4 py-2 text-lg animate-pulse">
            🔴 بث مباشر
          </Badge>
        )}
      </div>

      {currentStream ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentStream.title}</span>
                  <div className="flex items-center gap-2">
                    {currentStream.is_live && (
                      <Button
                        onClick={async () => {
                          const newStreamUrl = window.prompt('أدخل رابط البث الجديد:', currentStream.stream_url);
                          if (newStreamUrl && newStreamUrl !== currentStream.stream_url) {
                            const newListenUrl = window.prompt('أدخل رابط الاستماع الجديد (أو اتركه فارغاً لاستخدام رابط البث):', currentStream.listen_url) || newStreamUrl;
                            try {
                              await dispatch(updateStreamUrl({
                                activityId: currentStream.id,
                                streamUrl: newStreamUrl,
                                listenUrl: newListenUrl !== newStreamUrl ? newListenUrl : undefined,
                              })).unwrap();
                              toast.success('تم تحديث رابط البث بنجاح');
                              loadCurrentStream();
                            } catch (error: unknown) {
                              toast.error(errMessage(error) || 'حدث خطأ أثناء تحديث رابط البث');
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        title="تحديث رابط البث"
                      >
                        <FiRefreshCw className="mr-2" />
                        تحديث الرابط
                      </Button>
                    )}
                    {currentStream.is_live ? (
                      <Button
                        onClick={handleStopStream}
                        disabled={isStopLoading}
                        variant="destructive"
                      >
                        <FiSquare className="mr-2" />
                        {isStopping ? 'جاري الإيقاف...' : 'إيقاف البث'}
                      </Button>
                    ) : (
                      <Button onClick={handleOpenDialog} disabled={reduxLoading}>
                        <FiPlay className="mr-2" />
                        بدء البث
                      </Button>
                    )}
                  </div>
                </CardTitle>
                {currentStream.partner_name && (
                  <CardDescription>برعاية: {currentStream.partner_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">المستمعون:</span>
                    <span className="font-bold">{listeners}/{currentStream.max_listeners}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">بدء البث:</span>
                    <span className="font-bold">
                      {currentStream.started_at 
                        ? format(new Date(currentStream.started_at), 'PPp', { locale: ar })
                        : 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAward className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">النقاط:</span>
                    <span className="font-bold">نقطة/دقيقة</span>
                  </div>
                </div>

                {currentStream.listen_url && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handlePlayPause}
                        className="flex items-center gap-2 px-6 py-6 text-lg"
                        variant={isPlaying ? 'destructive' : 'default'}
                        size="lg"
                      >
                        {isPlaying ? (
                          <>
                            <FiSquare className="w-5 h-5" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <FiPlay className="w-5 h-5" />
                            تشغيل
                          </>
                        )}
                      </Button>
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {isPlaying ? '🔴 جاري التشغيل...' : '⏸ جاهز للاستماع'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {currentStream.listen_url}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <audio 
                        ref={audioRef}
                        controls
                        className="w-full"
                        preload="none"
                        onPlay={() => {
                          setIsPlaying(true);
                          setAudioError(null);
                        }}
                        onPause={() => {
                          if (isPlaying) {
                            setIsPlaying(false);
                            stopListeningAndShowSummary('manual');
                          } else {
                            setIsPlaying(false);
                          }
                        }}
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={() => setAudioError(null)}
                        onError={(e) => {
                          const audio = e.currentTarget;
                          let errorMessage = 'حدث خطأ أثناء تحميل البث.';
                          
                          try {
                            if (audio.error) {
                              switch (audio.error.code) {
                                case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                  errorMessage = 'الرابط غير مدعوم. تأكد من صحة الرابط.';
                                  break;
                                default:
                                  errorMessage = `خطأ (Code: ${audio.error.code})`;
                              }
                            }
                          } catch {
                            // تجاهل
                          }
                          
                          setAudioError(errorMessage);
                          setIsPlaying(false);
                        }}
                      >
                        متصفحك لا يدعم تشغيل الصوت.
                      </audio>

                      {audioError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 p-3 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200 mb-2">⚠️ {audioError}</p>
                          <Button onClick={handleOpenInNewTab} variant="outline" size="sm" className="w-full">
                            🔊 فتح الرابط في تبويب جديد
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        💡 يمكنك استخدام المشغل أو زر التشغيل/الإيقاف
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span>مدة الاستماع:</span>
                        <Input
                          type="number"
                          value={autoStopMinutes}
                          readOnly
                          disabled
                          className="w-20 h-8 bg-muted"
                        />
                        <span className="text-amber-600">⚠️ الإيقاف يوقف النقاط</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ V1.5: عداد النقاط المتوقع صرفها */}
            {currentStream && activeListeners.filter(l => l.is_active).length > 0 && (
              <Card className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-900/20 dark:to-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">النقاط المتوقع صرفها</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {expectedPayout.toLocaleString('ar-EG')} نقطة
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        من {activeListeners.filter(l => l.is_active).length} مستمع نشط
                      </p>
                    </div>
                    <div className="text-5xl">💰</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">المستمعون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{listeners}</div>
                  <p className="text-xs text-muted-foreground mt-1">من {currentStream.max_listeners}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">مدة البث</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    <FiClock className="w-5 h-5" />
                    {currentStream.started_at 
                      ? format(new Date(Date.now() - new Date(currentStream.started_at).getTime()), 'mm:ss')
                      : '00:00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">منذ البدء</p>
                </CardContent>
              </Card>

              <Card className={isNearPoint ? 'border-green-400 bg-green-50 animate-pulse' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {isPlaying && sessionStartAt ? 'النقاط المتوقعة' : 'نقاطك'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold flex items-center gap-2 ${isNearPoint ? 'text-green-600' : ''}`}>
                    <FiTrendingUp className="w-6 h-6 text-green-500" />
                    <span>
                      {isPlaying && sessionStartAt 
                        ? animatedPoints.toFixed(1)
                        : userPoints.toFixed(0)}
                    </span>
                    {isNearPoint && <span className="text-lg animate-pulse">⚡</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isPlaying && sessionStartAt ? (
                      <>
                        بعد {currentListeningMinutes} دقيقة
                        {isNearPoint && <span className="block text-green-600 font-semibold">🎯 قريب من نقطة!</span>}
                        <span className="text-amber-600 block mt-1">⚠️ تُمنح عند الإيقاف</span>
                      </>
                    ) : (
                      'النقاط المكتسبة'
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {currentStream.is_live && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiUsers className="w-5 h-5" />
                    المستمعون ({activeListeners.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeListeners.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا يوجد مستمعون
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {activeListeners.map((listener) => {
                        // ✅ V1.5: قراءة مباشرة من قاعدة البيانات (يتم تحديثها من الموبايل كل 60 ثانية)
                        // الموبايل يحسب duration_minutes (صافية) و points_earned (مستحقة) و is_playing (حالة التشغيل)
                        const durationMinutes = listener.duration_minutes || 0;
                        const estimatedPoints = listener.points_earned || 0;
                        const status = getListenerStatus(listener);
                        
                        return (
                          <div key={listener.id} className="p-3 border rounded-lg hover:bg-muted transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-medium text-sm truncate">
                                    {listener.user_name || 'مستخدم'}
                                  </p>
                                  
                                  {/* ✅ V1.5: عرض حالة التشغيل */}
                                  <span 
                                    key={`status-${listener.id}-${listener.is_playing}`}
                                    className={`text-xs font-semibold transition-all duration-300 ${status.className}`}
                                  >
                                    {status.text}
                                  </span>

                                  {/* V1.5: عرض النقاط المستحقة (محدثة من الموبايل) */}
                                  {listener.is_active && (
                                    <span 
                                      key={`points-${listener.id}-${estimatedPoints}`}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                                        estimatedPoints > 0 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      <FiStar className={`w-3 h-3 ${estimatedPoints > 0 ? 'text-green-500' : 'text-gray-500'}`} />
                                      ⚡ {estimatedPoints}
                                      <span className="text-[10px] opacity-75">(متوقع)</span>
                                    </span>
                                  )}
                                </div>
                                {listener.location && (
                                  <span className="text-xs text-muted-foreground">
                                    {listener.location.city || listener.location.area || 'موقع غير محدد'}
                                  </span>
                                )}
                                {/* ✅ V1.5: عرض الدقائق الصافية */}
                                {listener.is_active && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span 
                                      key={`duration-${listener.id}-${durationMinutes}`}
                                      className="text-xs text-muted-foreground transition-all duration-300"
                                    >
                                      {durationMinutes > 0 ? (
                                        <>
                                          <span className="font-semibold">{durationMinutes}</span> دقيقة صافية
                                          <span className="text-[10px] opacity-75 mr-1">(بعد خصم أوقات التوقف)</span>
                                        </>
                                      ) : 'بدأ للتو'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {listener.location?.latitude && listener.location?.longitude && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedListenerLocation({
                                      lat: listener.location!.latitude!,
                                      lng: listener.location!.longitude!,
                                      name: listener.user_name || 'مستخدم',
                                      address: listener.location!.address || 'عنوان',
                                      source: listener.location!.source,
                                    });
                                    setMapKey(prev => prev + 1);
                                    setIsLocationDialogOpen(true);
                                  }}
                                >
                                  <FiMapPin className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ✅ V1.5: إحصائيات متقدمة */}
              {currentStream && activeListeners.filter(l => l.is_active).length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiBarChart2 className="w-5 h-5" />
                      إحصائيات البث المباشر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">إجمالي المستمعين</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-sm text-muted-foreground mb-1">🟢 يستمعون الآن</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.playing}</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <p className="text-sm text-muted-foreground mb-1">🟠 متوقفون مؤقتاً</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.paused}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">متوسط وقت الاستماع</p>
                        <p className="text-2xl font-bold">{stats.avgDuration} دقيقة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {shouldRenderOverviewMap && mapLocations.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiMapPin className="w-5 h-5" />
                      الخريطة ({mapLocations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[400px] rounded-lg overflow-hidden border relative">
                      <LeafletMap
                        key="listeners-overview-map-stable"
                        center={[31.2000, 29.9000]}
                        zoom={12}
                        agents={[]}
                        locations={mapLocations}
                        mapId="listeners-overview-map"
                        className="w-full h-full"
                        showLocationsOnly={true}
                        onLocationClick={(location) => {
                          const listener = activeListeners.find(l => l.id === location.id);
                          if (listener?.location) {
                            setSelectedListenerLocation({
                              lat: listener.location.latitude!,
                              lng: listener.location.longitude!,
                              name: listener.user_name || 'مستخدم',
                              address: listener.location.address || 'عنوان',
                              source: listener.location.source,
                            });
                            setIsLocationDialogOpen(true);
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 text-xs bg-white/90 px-2 py-1 rounded z-[1000]">
                        {mapLocations.length} مستمع
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FiRadio className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">لا يوجد بث حالياً</p>
            <Button onClick={handleOpenDialog} className="mt-4">
              <FiPlus className="mr-2" />
              بدء بث جديد
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog: بدء بث جديد */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>بدء بث جديد</DialogTitle>
            <DialogDescription>املأ البيانات لبدء البث</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">عنوان البث *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="راديو كارمش - البث المباشر"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="وصف البث..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stream_url">رابط البث *</Label>
                <Input
                  id="stream_url"
                  name="stream_url"
                  value={formData.stream_url}
                  onChange={handleChange}
                  placeholder="http://..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="listen_url">رابط الاستماع *</Label>
                <Input
                  id="listen_url"
                  name="listen_url"
                  value={formData.listen_url || formData.stream_url}
                  onChange={handleChange}
                  placeholder="http://..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stream_type">نوع البث</Label>
                <Select
                  value={formData.stream_type || 'mp3'}
                  onValueChange={(value) => handleSelectChange('stream_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="aac">AAC</SelectItem>
                    <SelectItem value="ogg">OGG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_listeners">الحد الأقصى</Label>
                <Input
                  id="max_listeners"
                  name="max_listeners"
                  type="number"
                  value={formData.max_listeners}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="partner_id">الراعي</Label>
              <Select
                value={formData.partner_id || 'none'}
                onValueChange={(value) => handleSelectChange('partner_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختياري" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">لا يوجد</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points_per_minute">النقاط/دقيقة</Label>
              <Input
                id="points_per_minute"
                name="points_per_minute"
                type="number"
                value={formData.points_per_minute}
                onChange={handleChange}
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="planned_duration_minutes">المدة (دقائق)</Label>
              <Input
                id="planned_duration_minutes"
                name="planned_duration_minutes"
                type="number"
                value={formData.planned_duration_minutes ?? 0}
                onChange={handleChange}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
            <Button onClick={handleStartStream} disabled={reduxLoading}>
              <FiPlay className="mr-2" />
              بدء البث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ملخص النقاط */}
      <Dialog open={isCongratsOpen} onOpenChange={setIsCongratsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مبروك!</DialogTitle>
            <DialogDescription>ملخص النقاط</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">النقاط:</span>
              <span className="text-xl font-bold">{sessionPoints}</span>
            </div>
            {sessionStartAt && (
              <div className="text-xs text-muted-foreground">
                بدأت: {format(new Date(sessionStartAt), 'PPp', { locale: ar })}
              </div>
            )}
            <div className="bg-muted p-3 rounded text-sm">
              تم إضافة النقاط تلقائياً
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCongratsOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: موقع المستمع */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>موقع: {selectedListenerLocation?.name}</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div>{selectedListenerLocation?.address}</div>
                {selectedListenerLocation?.source === 'gps' && (
                  <span className="block text-xs text-green-600 mt-1">✅ GPS مباشر</span>
                )}
                {selectedListenerLocation?.source === 'district' && (
                  <span className="block text-xs text-blue-600 mt-1">📍 من الحي</span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          {selectedListenerLocation?.lat && selectedListenerLocation?.lng ? (
            <div className="w-full h-[500px] rounded-lg overflow-hidden border relative">
              {shouldRenderMap ? (
                <>
                  <LeafletMap
                    key={`listener-map-${mapKey}`}
                    center={[selectedListenerLocation.lat, selectedListenerLocation.lng]}
                    zoom={15}
                    agents={[]}
                    locations={[
                      {
                        id: 'listener-location',
                        lat: selectedListenerLocation.lat,
                        lng: selectedListenerLocation.lng,
                        address: selectedListenerLocation.address || selectedListenerLocation.name,
                        status: 'delivered',
                        type: 'delivery',
                        label: selectedListenerLocation.name,
                      },
                    ]}
                    mapId={`listener-map-${mapKey}`}
                    className="w-full h-full"
                  />
                  <div className="absolute bottom-2 right-2 text-xs bg-white/90 px-2 py-1 rounded z-[1000]">
                    OpenStreetMap
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[500px] flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <FiMapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">الموقع غير متاح</h3>
                <p className="text-sm text-gray-500">لم يسجل المستمع موقعاً</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsLocationDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إذن الموقع */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onClose={() => {
          setShowLocationDialog(false);
          handleLocationDenied();
        }}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
      />
    </div>
  );
}

export default function ClubRadioLivePage() {
  return (
    <DashboardLayout title="راديو كارمش">
      <div className="p-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/club-zone/radio">
            <FiArrowLeft className="mr-2" />
            العودة إلى راديو كارمش
          </Link>
        </Button>
        <RadioContent />
      </div>
    </DashboardLayout>
  );
}