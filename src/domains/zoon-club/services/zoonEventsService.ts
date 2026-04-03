import { supabase } from '@/lib/supabase';

export interface ZoonEvent {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  event_date: string;
  location_url?: string;
  organizer_id: string;
  organizer_name?: string;
  attendees_count: number;
  is_attending?: boolean; // For UI
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export const zoonEventsService = {
  
  /**
   * 📅 جلب الفعاليات
   */
  getEvents: async (circleId: string, currentUserId?: string): Promise<ZoonEvent[]> => {
    // 1. جلب الفعاليات
    const { data: events, error } = await supabase!
      .from('zoon_circle_events')
      .select(`
        *,
        organizer:organizer_id (full_name),
        attendees:zoon_event_attendees (count)
      `)
      .eq('circle_id', circleId)
      .order('event_date', { ascending: true });

    if (error) throw error;
    if (!events) return [];

    // 2. التحقق من الحضور
    let myAttendance: string[] = [];
    if (currentUserId) {
      const { data: att } = await supabase!
        .from('zoon_event_attendees')
        .select('event_id')
        .eq('user_id', currentUserId)
        .in('event_id', events.map(e => e.id));
      if (att) myAttendance = att.map(a => a.event_id);
    }

    // 3. التنسيق
    return events.map((e: any) => ({
      ...e,
      organizer_name: e.organizer?.full_name || 'المنظم',
      attendees_count: e.attendees?.[0]?.count || 0,
      is_attending: myAttendance.includes(e.id)
    }));
  },

  /**
   * ➕ إنشاء فعالية
   */
  createEvent: async (eventData: Partial<ZoonEvent>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * ✅ تسجيل الحضور
   */
  joinEvent: async (eventId: string, userId: string) => {
    // تحقق هل هو مسجل بالفعل؟
    const { data: exists } = await supabase!
        .from('zoon_event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
    
    if (exists) {
        // إلغاء الحضور
        await supabase!.from('zoon_event_attendees').delete().eq('id', exists.id);
    } else {
        // تسجيل الحضور
        await supabase!.from('zoon_event_attendees').insert({
            event_id: eventId, 
            user_id: userId,
            status: 'GOING'
        });
    }
  }
};
