/**
 * Club Radio Service
 * إدارة البث الصوتي
 */

import { supabase } from '@/lib/supabase';
import { ClubActivity, RadioStream, RadioListener, RadioListenerWithDetails, RadioSession, RadioStreamFormData } from '../types';

export const clubRadioService = {
  /**
   * الحصول على البث الحالي
   */
  async getCurrentStream(): Promise<RadioStream | null> {
    try {
      // محاولة 1: استخدام الطريقة العادية مع maybeSingle (يسمح بـ null)
      let { data, error } = await supabase
        .from('club_activities')
        .select('*')
        .eq('activity_type', 'radio_stream')
        .eq('is_active', true)
        .eq('is_live', true)
        .maybeSingle(); // ✅ يسمح بـ null إذا لم يجد نتائج

      // إذا فشل بسبب schema cache (PGRST116) أو RLS (PGRST406)
      if (error && (error.code === 'PGRST116' || error.code === 'PGRST406')) {
        console.log('[Radio] Falling back to RPC function due to schema cache issue...');
        
        // محاولة 2: استخدام RPC function كـ backup
        const rpcResult = await supabase
          .rpc('get_active_radio_stream')
          .maybeSingle();
        
        if (rpcResult.error) {
          console.warn('[Radio] RPC fallback also failed:', rpcResult.error);
          return null;
        }
        
        data = rpcResult.data;
        error = rpcResult.error;
      }

      // إذا لم تكن هناك بيانات، هذا طبيعي (لا يوجد بث نشط)
      if (!data) {
        return null;
      }

      // إذا كان هناك خطأ حقيقي (وليس null أو undefined)
      if (error) {
        // تجاهل الأخطاء الشائعة (لا توجد بيانات)
        if (
          error.code === 'PGRST116' || 
          error.code === 'PGRST406' ||
          error.message?.includes('No rows') ||
          error.message?.includes('406')
        ) {
          // لا نرمي خطأ - نرجع null بدلاً من ذلك
          // هذا طبيعي عندما لا يكون هناك بث نشط أو مشكلة RLS
          return null;
        }
        
        // فقط رمي الأخطاء الحقيقية الأخرى
        throw error;
      }

      // جلب بيانات الشريك بشكل منفصل إذا كان هناك partner_id
      let partner = null;
      if (data.partner_id) {
        try {
          const { data: partnerData, error: partnerError } = await supabase
            .from('club_partners')
            .select('id, company_name, logo_url')
            .eq('id', data.partner_id)
            .maybeSingle(); // استخدام maybeSingle لتجنب الأخطاء
          
          if (!partnerError && partnerData) {
            partner = partnerData;
          }
        } catch (partnerErr) {
          // تجاهل أخطاء جلب بيانات الشريك - ليست حرجة
          console.warn('[Radio] Could not fetch partner data:', partnerErr);
        }
      }

    return {
      id: data.id,
      title: data.title || 'راديو كارمش',
      stream_url: data.stream_url || '',
      listen_url: data.listen_url || data.stream_url || '',
      current_listeners: data.current_listeners || 0,
      max_listeners: data.max_listeners || 1000,
      is_live: data.is_live || false,
      partner_id: data.partner_id,
      started_at: data.scheduled_at,
      stream_type: data.stream_type || 'mp3',
      partner_name: partner?.company_name,
      partner_logo: partner?.logo_url,
      points_per_minute: data.points_reward || 1,
      planned_duration_minutes: data.planned_duration_minutes || undefined,
      description: data.description || undefined,
      broadcast_mode: (data.broadcast_mode as 'live_event' | 'always_on') || 'live_event',
      playlist_engine_url: data.playlist_engine_url || undefined,
      auto_switch_enabled: data.auto_switch_enabled ?? true,
    };
    } catch (err: any) {
      // تحسين معالجة الأخطاء - لا نطبع null
      if (err) {
        console.error('[Radio] Error fetching current stream:', err);
      } else {
        console.warn('[Radio] Unknown error occurred while fetching current stream');
      }
      // دائماً نرجع null بدلاً من رمي الخطأ
      return null;
    }
  },

  /**
   * الحصول على جميع البثود (المباشرة والمجدولة)
   */
  async getAllStreams(filters?: {
    is_live?: boolean;
    is_active?: boolean;
    limit?: number;
  }): Promise<ClubActivity[]> {
    // تبسيط الـ query لتجنب 406
    let query = supabase
      .from('club_activities')
      .select('*')
      .eq('activity_type', 'radio_stream')
      .order('scheduled_at', { ascending: false });

    if (filters?.is_live !== undefined) {
      query = query.eq('is_live', filters.is_live);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.broadcast_mode) {
      query = query.eq('broadcast_mode', filters.broadcast_mode);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      // تجاهل 406 errors بشكل صحيح
      if (error.code === 'PGRST406') {
        console.warn('406 Error fetching streams - RLS or query issue:', error.message);
        return [];
      }
      throw error;
    }
    
    return (data || []) as ClubActivity[];
  },

  /**
   * بدء الاستماع (لتتبع النقاط) مع الموقع
   */
  async startListening(
    userId: string, 
    activityId: string,
    location?: {
      lat: number;
      lng: number;
      accuracy?: number;
      source: 'gps' | 'district' | 'address';
      districtId?: string; // إذا كان source = 'district'
    }
  ): Promise<void> {
    const listenerData: any = {
      user_id: userId,
      activity_id: activityId,
      started_listening_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      is_active: true,
    };

    // إضافة الموقع إذا كان متاحاً
    if (location) {
      listenerData.current_latitude = location.lat;
      listenerData.current_longitude = location.lng;
      listenerData.location_updated_at = new Date().toISOString();
      listenerData.location_source = location.source;
      if (location.accuracy) {
        listenerData.location_accuracy = location.accuracy;
      }
    }

    const { error } = await supabase
      .from('radio_listeners')
      .upsert(listenerData, {
        onConflict: 'user_id,activity_id',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    // تحديث عدد المستمعين
    await supabase.rpc('update_radio_listeners_count', {
      p_activity_id: activityId,
    });
  },

  /**
   * تحديث نشاط المستمع (heartbeat)
   */
  async updateListenerActivity(userId: string, activityId: string): Promise<void> {
    const { error } = await supabase
      .from('radio_listeners')
      .update({ 
        last_active_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('user_id', userId)
      .eq('activity_id', activityId);

    if (error) throw error;

    // تحديث عدد المستمعين
    await supabase.rpc('update_radio_listeners_count', {
      p_activity_id: activityId,
    });
  },

  /**
   * تحديث النقاط المتوقعة في قاعدة البيانات (مرجع تاريخي)
   * يتم استدعاؤها كل دقيقة أثناء الاستماع
   */
  async updateEstimatedPoints(
    sessionId: string,
    estimatedPoints: number
  ): Promise<void> {
    const { error } = await supabase
      .from('radio_user_sessions')
      .update({
        estimated_points: estimatedPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('status', 'active');

    if (error) throw error;
  },

  /**
   * إيقاف الاستماع
   */
  async stopListening(userId: string, activityId: string): Promise<void> {
    const { data: listener } = await supabase
      .from('radio_listeners')
      .select('started_listening_at, points_earned')
      .eq('user_id', userId)
      .eq('activity_id', activityId)
      .single();

    if (!listener) return;

    // حساب المدة بالدقائق
    const durationMinutes = Math.floor(
      (new Date().getTime() - new Date(listener.started_listening_at).getTime()) / 60000
    );

    // حساب النقاط المستحقة (نقطة لكل دقيقة)
    const pointsToAward = durationMinutes - (listener.points_earned || 0);

    // تحديث السجل
    const { error: updateError } = await supabase
      .from('radio_listeners')
      .update({ 
        is_active: false,
        duration_minutes: durationMinutes,
        points_earned: durationMinutes,
      })
      .eq('user_id', userId)
      .eq('activity_id', activityId);

    if (updateError) throw updateError;

    // منح النقاط (إذا كان هناك نقاط مستحقة)
    if (pointsToAward > 0) {
      await supabase.rpc('update_club_points_wallet', {
        p_user_id: userId,
        p_points: pointsToAward,
        p_transaction_type: 'EARNED',
        p_reason: 'radio_listening',
        p_source: 'radio_stream',
        p_description: `نقاط الاستماع للراديو - ${durationMinutes} دقيقة`,
      });
    }

    // تحديث عدد المستمعين
    await supabase.rpc('update_radio_listeners_count', {
      p_activity_id: activityId,
    });
  },

  /**
   * الحصول على عدد المستمعين الحاليين
   * ✅ V1.5.1: توحيد الفترة الزمنية مع RPC function (10 دقائق)
   */
  async getCurrentListeners(activityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('radio_listeners')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .eq('is_active', true)
      .gt('last_active_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // ✅ نشط آخر 10 دقائق (مطابق لـ RPC)

    if (error) throw error;
    return count || 0;
  },

  /**
   * الحصول على المستمعين النشطين مع بياناتهم (الاسم والموقع)
   */
  async getActiveListenersWithDetails(activityId: string): Promise<RadioListenerWithDetails[]> {
    try {
      console.log('[Radio Listeners] Fetching active listeners for activity:', activityId);
      
      if (!activityId) {
        console.warn('[Radio Listeners] No activity ID provided');
        return [];
      }
      
      // محاولة 1: استخدام RPC function (لتجاوز RLS)
      let listeners: any[] | null = null;
      let listenersError: any = null;
      
      try {
        const rpcResult = await supabase
          .rpc('get_active_radio_listeners', { p_activity_id: activityId });
        
        if (rpcResult.error) {
          console.warn('[Radio Listeners] RPC function failed:', {
            error: rpcResult.error,
            code: rpcResult.error?.code,
            message: rpcResult.error?.message,
            details: rpcResult.error?.details,
            hint: rpcResult.error?.hint,
          });
          listenersError = rpcResult.error;
        } else {
          listeners = rpcResult.data || [];
          console.log(`[Radio Listeners] RPC returned ${listeners.length} listeners`);
        }
      } catch (rpcErr: any) {
        console.warn('[Radio Listeners] RPC function exception:', {
          error: rpcErr,
          message: rpcErr?.message,
          stack: rpcErr?.stack,
        });
        listenersError = rpcErr;
      }

      // محاولة 2: استخدام الطريقة العادية (إذا فشلت RPC)
      if (!listeners && listenersError) {
        console.log('[Radio Listeners] Trying direct query as fallback...');
        try {
          const { data, error } = await supabase
            .from('radio_listeners')
            .select('*')
            .eq('activity_id', activityId)
            .eq('is_active', true)
            .gt('last_active_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // ✅ 10 دقائق (مطابق لـ RPC)
            .order('started_listening_at', { ascending: false });

          if (error) {
            console.error('[Radio Listeners] Direct query also failed:', {
              error,
              code: error?.code,
              message: error?.message,
              details: error?.details,
              hint: error?.hint,
            });
            return [];
          }

          listeners = data || [];
          console.log(`[Radio Listeners] Direct query returned ${listeners.length} listeners`);
        } catch (directErr: any) {
          console.error('[Radio Listeners] Direct query exception:', {
            error: directErr,
            message: directErr?.message,
            stack: directErr?.stack,
          });
          return [];
        }
      }

      if (listenersError && !listeners) {
        console.error('[Radio Listeners] All methods failed. Last error:', {
          error: listenersError,
          code: listenersError?.code,
          message: listenersError?.message,
          details: listenersError?.details,
          hint: listenersError?.hint,
        });
        // إرجاع مصفوفة فارغة بدلاً من throw error
        return [];
      }

      if (!listeners || listeners.length === 0) {
        console.log('[Radio Listeners] No active listeners found for activity:', activityId);
        return [];
      }

      console.log(`[Radio Listeners] Found ${listeners.length} active listeners`);
      
      // Debug: طباعة بيانات المستمعين القادمة من RPC
      if (listeners.length > 0) {
        console.log('[Radio Listeners] Sample listener data:', {
          id: listeners[0].id,
          user_id: listeners[0].user_id,
          started_listening_at: listeners[0].started_listening_at,
          duration_minutes: listeners[0].duration_minutes,
          points_earned: listeners[0].points_earned,
          is_playing: listeners[0].is_playing,  // ✅ V1.5
          is_active: listeners[0].is_active,
          last_active_at: listeners[0].last_active_at,
          allKeys: Object.keys(listeners[0]),  // ✅ Debug: عرض جميع المفاتيح
        });
      }

      // ✅ V1.5.1: جلب بيانات المستخدمين والعناوين
      // ملاحظة: user_name الآن يأتي مباشرة من RPC function، لكن نحتاج لجلب user_phone و location
      const listenersWithDetails: RadioListenerWithDetails[] = await Promise.all(
        listeners.map(async (listener) => {
          const details: RadioListenerWithDetails = {
            ...listener,
            // ✅ V1.5.1: user_name يأتي مباشرة من RPC function
            user_name: (listener as any).user_name || listener.user_name || 'مستخدم',
            user_phone: undefined,
            location: undefined,
          };

          try {
            // ✅ V1.5.1: جلب user_phone فقط إذا كان user_id موجوداً
            if (listener.user_id) {
              // جلب رقم الهاتف من new_profiles (اختياري - إذا لم يكن موجوداً في RPC)
              const { data: profile } = await supabase
                .from('new_profiles')
                .select('phone_number')
                .eq('id', listener.user_id)
                .maybeSingle();

              if (profile) {
                details.user_phone = profile.phone_number;
              }
            }

            // استخدام الموقع من radio_listeners أولاً (GPS أو الحي)
            // دعم كلا الشكلين: location JSONB (الجديد) والحقول المنفصلة (القديم)
            let locationData: any = null;
            
            // الشكل الجديد: location JSONB
            if (listener.location && typeof listener.location === 'object') {
              const loc = listener.location as any;
              if (loc.latitude && loc.longitude) {
                locationData = {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  address: loc.address || loc.district || 'موقع غير محدد',
                  city: loc.city || 'الإسكندرية',
                  area: loc.district || loc.area,
                  source: loc.source || 'gps',
                };
              }
            }
            
            // الشكل القديم: حقول منفصلة (للتوافق)
            if (!locationData && listener.current_latitude && listener.current_longitude) {
              let addressText = 'موقع غير محدد';
              if (listener.location_source === 'gps') {
                addressText = 'موقع GPS مباشر';
              } else if (listener.location_source === 'district') {
                addressText = 'موقع تقريبي من الحي';
              } else if (listener.location_source === 'address') {
                addressText = 'عنوان افتراضي';
              }

              locationData = {
                latitude: listener.current_latitude,
                longitude: listener.current_longitude,
                address: addressText,
                city: 'الإسكندرية',
                area: listener.location_source === 'district' ? 'من الحي المختار' : undefined,
                source: listener.location_source,
              };
            }
            
            if (locationData) {
              details.location = locationData;
            } else if (listener.user_id) {
              // Fallback: استخدام العنوان الافتراضي من customer_addresses
              const { data: address } = await supabase
                .from('customer_addresses')
                .select('latitude, longitude, address_line, city, area')
                .eq('profile_id', listener.user_id)
                .eq('is_default', true)
                .maybeSingle();

              if (address && address.latitude && address.longitude) {
                details.location = {
                  latitude: address.latitude,
                  longitude: address.longitude,
                  address: address.address_line,
                  city: address.city || undefined,
                  area: address.area || undefined,
                };
              }
            }
          } catch (err) {
            console.warn(`[Radio] Error fetching details for listener ${listener.id}:`, err);
          }

          return details;
        })
      );

      return listenersWithDetails;
    } catch (error: any) {
      console.error('[Radio] Error fetching active listeners with details:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });
      return [];
    }
  },

  /**
   * منح نقاط للمستمعين (Background Job)
   *
   * V1.3: هذا الأسلوب تم إيقافه لصالح Session-based awarding مرة واحدة عند الإيقاف.
   * سيتم الإبقاء على الدالة مؤقتاً للتوافق، لكنها لا تقوم بأي عمل.
   */
  async awardPointsToListeners(activityId: string, pointsPerMinute: number = 1): Promise<void> {
    console.log('[Radio V1.3] awardPointsToListeners disabled (session-based awarding).', {
      activityId,
      pointsPerMinute,
    });
    return;
  },

  /**
   * V1.3: بدء جلسة استماع للمستخدم (radio_user_sessions)
   */
  async startUserListeningSession(params: { userId: string; activityId: string }): Promise<{ sessionId: string }> {
    const { data, error } = await supabase
      .from('radio_user_sessions')
      .insert([
        {
          user_id: params.userId,
          activity_id: params.activityId,
          start_time: new Date().toISOString(),
          status: 'active',
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return { sessionId: data.id };
  },

  /**
   * V1.3: إيقاف جلسة الاستماع وحساب النقاط مرة واحدة
   */
  async stopUserListeningSessionAndAward(params: {
    sessionId: string;
    userId: string;
    activityId: string;
  }): Promise<{ minutesListened: number; pointsEarned: number }> {
    // Load session
    const { data: session, error: sessionErr } = await supabase
      .from('radio_user_sessions')
      .select('id,start_time,stop_time,status')
      .eq('id', params.sessionId)
      .single();
    if (sessionErr) throw sessionErr;
    if (!session) throw new Error('جلسة الراديو غير موجودة');
    if (session.status !== 'active') throw new Error('الجلسة ليست نشطة');

    const start = new Date(session.start_time).getTime();
    const stop = Date.now();
    const minutes = Math.max(0, Math.floor((stop - start) / 60000));

    // Calculate points
    const { data: pointsData, error: calcErr } = await supabase.rpc('calculate_service_points', {
      p_service_name: 'radio_stream',
      p_minutes: minutes,
    });
    if (calcErr) throw calcErr;
    const pointsEarned = Number(pointsData || 0);

    // Mark session closed
    const { error: updErr } = await supabase
      .from('radio_user_sessions')
      .update({
        stop_time: new Date(stop).toISOString(),
        duration_minutes: minutes,
        points_earned: pointsEarned,
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.sessionId);
    if (updErr) throw updErr;

    // Award points once (EARNED -> pending in V1.3)
    if (pointsEarned > 0) {
      const { error: awardErr } = await supabase.rpc('update_club_points_wallet', {
        p_user_id: params.userId,
        p_points: pointsEarned,
        p_transaction_type: 'EARNED',
        p_reason: 'radio_listening',
        p_source: 'radio_stream',
        p_description: `نقاط الاستماع للراديو - ${minutes} دقيقة`,
        p_created_by: null,
      });
      if (awardErr) throw awardErr;
    }

    return { minutesListened: minutes, pointsEarned };
  },

  /**
   * إنشاء/بدء بث جديد
   */
  async createStream(streamData: RadioStreamFormData): Promise<ClubActivity> {
    const { data, error } = await supabase
      .from('club_activities')
      .insert([{
        activity_type: 'radio_stream',
        title: streamData.title,
        scheduled_at: streamData.scheduled_at,
        partner_id: streamData.partner_id,
        stream_url: streamData.stream_url,
        listen_url: streamData.listen_url,
        max_listeners: streamData.max_listeners || 1000,
        stream_type: streamData.stream_type || 'mp3',
        description: streamData.description,
        points_reward: streamData.points_per_minute || 1,
        planned_duration_minutes: streamData.planned_duration_minutes || null,
        is_active: true,
        is_live: false, // سيتم تفعيله يدوياً
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ClubActivity;
  },

  /**
   * تفعيل البث المباشر
   * يدعم broadcast_mode: 'live_event' أو 'always_on'
   */
  async startLiveStream(activityId: string, broadcastMode?: 'live_event' | 'always_on'): Promise<void> {
    // إذا لم يتم تحديد broadcast_mode، نستخدم القيمة الحالية من قاعدة البيانات
    let updateData: any = {
      is_live: true,
      current_listeners: 0,
    };

    if (broadcastMode) {
      updateData.broadcast_mode = broadcastMode;
    }

    const { error } = await supabase
      .from('club_activities')
      .update(updateData)
      .eq('id', activityId);

    if (error) {
      console.error('[Radio] Error starting live stream:', error);
      throw error;
    }

    console.log('[Radio] ✅ Stream started successfully:', {
      activityId,
      is_live: updateData.is_live,
      broadcast_mode: updateData.broadcast_mode || 'live_event',
    });

    // إنشاء سجل للبث (فقط للـ Live Event)
    const activity = await supabase
      .from('club_activities')
      .select('broadcast_mode')
      .eq('id', activityId)
      .single();

    const mode = broadcastMode || activity.data?.broadcast_mode || 'live_event';
    
    if (mode === 'live_event') {
      await supabase
        .from('radio_sessions')
        .insert([{
          activity_id: activityId,
          status: 'active',
          started_at: new Date().toISOString(),
        }]);
    }
  },

  /**
   * ✅ V1.5.1: تحديث رابط البث أثناء البث المباشر
   */
  async updateStreamUrl(activityId: string, streamUrl: string, listenUrl?: string): Promise<void> {
    const updateData: any = {
      stream_url: streamUrl,
      updated_at: new Date().toISOString(),
    };

    // إذا تم توفير listen_url، استخدمه، وإلا استخدم stream_url
    if (listenUrl) {
      updateData.listen_url = listenUrl;
    } else {
      updateData.listen_url = streamUrl;
    }

    const { error } = await supabase
      .from('club_activities')
      .update(updateData)
      .eq('id', activityId)
      .eq('is_live', true)
      .eq('is_active', true);

    if (error) {
      console.error('[Radio] Error updating stream URL:', error);
      throw error;
    }

    console.log('[Radio] Stream URL updated successfully:', {
      activityId,
      streamUrl,
      listenUrl: updateData.listen_url,
    });
  },

  /**
   * إيقاف البث المباشر
   * يدعم broadcast_mode: 'live_event' أو 'always_on'
   */
  async stopLiveStream(activityId: string): Promise<void> {
    // التحقق من broadcast_mode قبل الإيقاف
    const { data: activity } = await supabase
      .from('club_activities')
      .select('broadcast_mode')
      .eq('id', activityId)
      .single();

    // تحديث حالة البث
    const { error } = await supabase
      .from('club_activities')
      .update({ 
        is_live: false,
      })
      .eq('id', activityId);

    if (error) throw error;

    // إنهاء سجل البث (فقط للـ Live Event)
    if (activity?.broadcast_mode === 'live_event') {
      const { data: session } = await supabase
        .from('radio_sessions')
        .select('id, started_at')
        .eq('activity_id', activityId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        const durationMinutes = Math.floor(
          (new Date().getTime() - new Date(session.started_at).getTime()) / 60000
        );

        // الحصول على عدد المستمعين النهائي
        const listenersCount = await this.getCurrentListeners(activityId);

        await supabase
          .from('radio_sessions')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
            total_duration_minutes: durationMinutes,
            total_listeners: listenersCount,
            peak_listeners: listenersCount, // TODO: تتبع Peak أثناء البث
          })
          .eq('id', session.id);
      }
    }
  },

  /**
   * الحصول على سجلات البث
   */
  async getSessions(filters?: {
    activity_id?: string;
    status?: 'active' | 'completed' | 'cancelled';
    limit?: number;
  }): Promise<RadioSession[]> {
    let query = supabase
      .from('radio_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (filters?.activity_id) {
      query = query.eq('activity_id', filters.activity_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as RadioSession[];
  },

  /**
   * الحصول على قائمة أحياء الإسكندرية
   */
  async getAlexandriaDistricts(): Promise<Array<{id: string; name_ar: string; name_en?: string}>> {
    const { data, error } = await supabase
      .from('alexandria_districts')
      .select('id, name_ar, name_en')
      .eq('is_active', true)
      .order('name_ar');

    if (error) throw error;
    return data || [];
  },

  /**
   * الحصول على نقطة عشوائية داخل الحي
   */
  async getRandomPointInDistrict(districtId: string): Promise<{lat: number; lng: number}> {
    const { data, error } = await supabase.rpc('get_random_point_in_district', {
      district_id: districtId,
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('فشل في الحصول على موقع عشوائي');
    }

    return {
      lat: data[0].latitude,
      lng: data[0].longitude,
    };
  },
};
