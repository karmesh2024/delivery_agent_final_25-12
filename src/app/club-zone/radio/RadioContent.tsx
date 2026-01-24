'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { FiRadio, FiPlay, FiSquare, FiUsers, FiAward, FiCalendar, FiClock, FiTrendingUp, FiPlus, FiMapPin } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentStream, startLiveStream, stopLiveStream } from '@/domains/club-zone/store/clubZoneSlice';
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

// استيراد مكون الخريطة بشكل ديناميكي لتجنب مشاكل SSR
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

  useEffect(() => {
    loadCurrentStream();
    loadPartners();
    
    if (currentStream?.id) {
      loadListeners();
    }
    
    const interval = setInterval(() => {
      loadCurrentStream();
      if (currentStream?.id) {
        loadListeners();
      }
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStream?.id]);

  // تأخير عرض الخريطة لتجنب مشاكل DOM
  useEffect(() => {
    if (isLocationDialogOpen) {
      const timer = setTimeout(() => {
        setShouldRenderMap(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderMap(false);
    }
  }, [isLocationDialogOpen]);

  // تفعيل الخريطة العامة عند وجود مستمعين نشطين
  useEffect(() => {
    if (activeListeners.length > 0) {
      const timer = setTimeout(() => {
        setShouldRenderOverviewMap(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderOverviewMap(false);
    }
  }, [activeListeners.length]);

  // باقي الكود من صفحة الراديو...
  // سأنسخ باقي الكود من page.tsx

  const loadCurrentStream = async () => {
    try {
      await dispatch(fetchCurrentStream());
    } catch (error) {
      console.error('Error loading current stream:', error);
    }
  };

  const loadPartners = async () => {
    try {
      const data = await clubPartnersService.getAllPartners({ is_active: true });
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadListeners = async () => {
    if (!currentStream?.id) return;
    try {
      const count = await clubRadioService.getCurrentListeners(currentStream.id);
      setListeners(count);
      
      const listenersWithDetails = await clubRadioService.getActiveListenersWithDetails(currentStream.id);
      setActiveListeners(listenersWithDetails);
    } catch (error) {
      console.error('Error loading listeners:', error);
    }
  };

  // باقي الدوال من صفحة الراديو...
  // سأحتاج إلى نسخ جميع الدوال من page.tsx

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

      {/* باقي محتوى الراديو... */}
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  );
}
