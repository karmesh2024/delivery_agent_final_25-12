/**
 * واجهة برمجة التطبيقات (API) للرحلات
 * تتعامل مع عمليات الرحلات CRUD وتدعم عمليات التصفية والبحث
 * ملاحظة: يستخدم بيانات وهمية حالياً حتى يتم إضافة جدول trips إلى قاعدة البيانات
 */

import { supabase } from "@/lib/supabase";
import { 
  Trip, 
  TripCreationData, 
  TripFilters, 
  TripStats,
  TripEvent,
  TripRoute 
} from "../types";
// دالة مساعدة لإنشاء معرفات فريدة بدون استخدام حزمة uuid
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// بيانات وهمية للرحلات (سيتم استبدالها بالبيانات الفعلية من قاعدة البيانات)
const mockTrips: Trip[] = [
  {
    id: "trip-001",
    title: "جمع النفايات من المنطقة الشرقية",
    description: "جمع النفايات الورقية والبلاستيكية من المنطقة الشرقية",
    agentId: "agent-001",
    agentName: "أحمد محمد",
    status: "scheduled",
    priority: "high",
    startTime: "2025-04-12T08:00:00Z",
    endTime: "2025-04-12T16:00:00Z",
    startLocation: {
      address: "شارع المطار، المنطقة الشرقية",
      lat: 24.7136,
      lng: 46.6753
    },
    endLocation: {
      address: "المحطة المركزية، المنطقة الشرقية",
      lat: 24.7241,
      lng: 46.6938
    },
    distance: 12.5,
    duration: 480,
    orderIds: ["order-001", "order-002", "order-003"],
    vehicleId: "vehicle-001",
    vehicleType: "truck",
    notes: "يجب التواصل مع العملاء قبل الوصول",
    createdAt: "2025-04-10T12:00:00Z",
    updatedAt: "2025-04-10T12:00:00Z"
  },
  {
    id: "trip-002",
    title: "جمع النفايات من المنطقة الغربية",
    description: "جمع النفايات المعدنية من المنطقة الغربية",
    agentId: "agent-002",
    agentName: "محمود أحمد",
    status: "in_progress",
    priority: "medium",
    startTime: "2025-04-13T09:00:00Z",
    startLocation: {
      address: "شارع الملك فهد، المنطقة الغربية",
      lat: 24.6889,
      lng: 46.7218
    },
    distance: 8.3,
    duration: 360,
    orderIds: ["order-004", "order-005"],
    vehicleId: "vehicle-002",
    vehicleType: "truck",
    notes: "",
    createdAt: "2025-04-10T13:30:00Z",
    updatedAt: "2025-04-11T09:15:00Z"
  },
  {
    id: "trip-003",
    title: "جمع النفايات من المنطقة الشمالية",
    description: "جمع النفايات العضوية من المنطقة الشمالية",
    agentId: "agent-003",
    agentName: "علي عبدالله",
    status: "completed",
    priority: "low",
    startTime: "2025-04-11T07:30:00Z",
    endTime: "2025-04-11T13:45:00Z",
    startLocation: {
      address: "شارع العليا، المنطقة الشمالية",
      lat: 24.7512,
      lng: 46.6946
    },
    endLocation: {
      address: "المحطة المركزية، المنطقة الشرقية",
      lat: 24.7241,
      lng: 46.6938
    },
    distance: 15.7,
    duration: 375,
    orderIds: ["order-006", "order-007", "order-008", "order-009"],
    vehicleId: "vehicle-003",
    vehicleType: "truck",
    notes: "تم إكمال المهمة بنجاح",
    createdAt: "2025-04-09T10:00:00Z",
    updatedAt: "2025-04-11T13:45:00Z"
  }
];

// بيانات وهمية لأحداث الرحلات
const mockTripEvents: TripEvent[] = [
  {
    id: "event-001",
    tripId: "trip-001",
    eventType: "status_change",
    description: "تم جدولة الرحلة",
    timestamp: "2025-04-10T12:00:00Z",
    metadata: { oldStatus: null, newStatus: "scheduled" }
  },
  {
    id: "event-002",
    tripId: "trip-002",
    eventType: "status_change",
    description: "تم بدء الرحلة",
    timestamp: "2025-04-11T09:00:00Z",
    metadata: { oldStatus: "scheduled", newStatus: "in_progress" }
  },
  {
    id: "event-003",
    tripId: "trip-003",
    eventType: "status_change",
    description: "تم إكمال الرحلة",
    timestamp: "2025-04-11T13:45:00Z",
    metadata: { oldStatus: "in_progress", newStatus: "completed" }
  }
];

// بيانات وهمية لمسارات الرحلات
const mockTripRoutes: TripRoute[] = [
  {
    tripId: "trip-001",
    waypoints: [
      { lat: 24.7136, lng: 46.6753, timestamp: "2025-04-12T08:00:00Z", address: "شارع المطار، المنطقة الشرقية" },
      { lat: 24.7180, lng: 46.6820, timestamp: "2025-04-12T09:30:00Z", address: "محطة 1، المنطقة الشرقية" },
      { lat: 24.7241, lng: 46.6938, timestamp: "2025-04-12T16:00:00Z", address: "المحطة المركزية، المنطقة الشرقية" }
    ],
    polyline: "av~xFaenoGhD{MpJoX~A_GcCoIiMya@"
  }
];

/**
 * الحصول على قائمة الرحلات مع دعم التصفية
 * @param filters فلاتر الرحلات
 * @param page رقم الصفحة
 * @param limit عدد العناصر في الصفحة
 */
export const getTrips = async (
  filters: TripFilters = {}, 
  page: number = 1, 
  limit: number = 10
): Promise<{ trips: Trip[]; totalCount: number }> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // let query = supabase
    //   .from('trips')
    //   .select('*', { count: 'exact' });
    
    // إضافة الفلاتر إذا وجدت
    // if (filters.status) query = query.eq('status', filters.status);
    // if (filters.agentId) query = query.eq('agent_id', filters.agentId);
    // if (filters.priority) query = query.eq('priority', filters.priority);
    // if (filters.startDate) query = query.gte('start_time', filters.startDate);
    // if (filters.endDate) query = query.lte('start_time', filters.endDate);
    // if (filters.searchQuery) query = query.ilike('title', `%${filters.searchQuery}%`);
    
    // // إضافة الصفحات
    // query = query
    //   .range((page - 1) * limit, page * limit - 1)
    //   .order('created_at', { ascending: false });
    
    // const { data, error, count } = await query;
    // if (error) throw error;
    
    // return { trips: data, totalCount: count || 0 };

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    let filteredTrips = [...mockTrips];
    
    // تطبيق الفلاتر
    if (filters.status) {
      filteredTrips = filteredTrips.filter(trip => trip.status === filters.status);
    }
    
    if (filters.agentId) {
      filteredTrips = filteredTrips.filter(trip => trip.agentId === filters.agentId);
    }
    
    if (filters.priority) {
      filteredTrips = filteredTrips.filter(trip => trip.priority === filters.priority);
    }
    
    if (filters.startDate) {
      filteredTrips = filteredTrips.filter(trip => new Date(trip.startTime) >= new Date(filters.startDate!));
    }
    
    if (filters.endDate) {
      filteredTrips = filteredTrips.filter(trip => new Date(trip.startTime) <= new Date(filters.endDate!));
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredTrips = filteredTrips.filter(trip => 
        trip.title.toLowerCase().includes(query) || 
        trip.description.toLowerCase().includes(query)
      );
    }
    
    // ترتيب حسب تاريخ الإنشاء تنازلياً
    filteredTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // تقسيم الصفحات
    const totalCount = filteredTrips.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTrips = filteredTrips.slice(startIndex, endIndex);
    
    return { trips: paginatedTrips, totalCount };
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

/**
 * الحصول على رحلة بالمعرف
 * @param tripId معرف الرحلة
 */
export const getTripById = async (tripId: string): Promise<Trip | null> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { data, error } = await supabase
    //   .from('trips')
    //   .select('*')
    //   .eq('id', tripId)
    //   .single();
    
    // if (error) throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const trip = mockTrips.find(trip => trip.id === tripId);
    return trip || null;
  } catch (error) {
    console.error(`Error fetching trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * إنشاء رحلة جديدة
 * @param tripData بيانات الرحلة الجديدة
 */
export const createTrip = async (tripData: TripCreationData): Promise<Trip> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const newTrip = {
    //   ...tripData,
    //   id: uuidv4(),
    //   created_at: new Date().toISOString(),
    //   updated_at: new Date().toISOString()
    // };
    
    // const { data, error } = await supabase
    //   .from('trips')
    //   .insert(newTrip)
    //   .select()
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const now = new Date().toISOString();
    
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${generateId()}`,
      agentName: "مستخدم جديد", // سيتم استبداله ببيانات حقيقية
      createdAt: now,
      updatedAt: now
    };
    
    mockTrips.push(newTrip);
    
    // إضافة حدث لتغيير الحالة
    const newEvent: TripEvent = {
      id: `event-${generateId()}`,
      tripId: newTrip.id,
      eventType: "status_change",
      description: "تم إنشاء الرحلة",
      timestamp: now,
      metadata: { oldStatus: null, newStatus: newTrip.status }
    };
    
    mockTripEvents.push(newEvent);
    
    return newTrip;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * تحديث رحلة موجودة
 * @param tripId معرف الرحلة
 * @param tripData بيانات الرحلة المحدثة
 */
export const updateTrip = async (tripId: string, tripData: Partial<Trip>): Promise<Trip> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { data: existingTrip, error: fetchError } = await supabase
    //   .from('trips')
    //   .select('*')
    //   .eq('id', tripId)
    //   .single();
    
    // if (fetchError) throw fetchError;
    // if (!existingTrip) throw new Error(`Trip with ID ${tripId} not found`);
    
    // const updatedTrip = {
    //   ...tripData,
    //   updated_at: new Date().toISOString()
    // };
    
    // const { data, error } = await supabase
    //   .from('trips')
    //   .update(updatedTrip)
    //   .eq('id', tripId)
    //   .select()
    //   .single();
    
    // if (error) throw error;
    // return data;
    
    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const tripIndex = mockTrips.findIndex(trip => trip.id === tripId);
    
    if (tripIndex === -1) {
      throw new Error(`Trip with ID ${tripId} not found`);
    }
    
    const existingTrip = mockTrips[tripIndex];
    const now = new Date().toISOString();
    
    // إذا كان هناك تغيير في الحالة، نقوم بإضافة حدث
    if (tripData.status && tripData.status !== existingTrip.status) {
      const newEvent: TripEvent = {
        id: `event-${generateId()}`,
        tripId: tripId,
        eventType: "status_change",
        description: `تم تغيير الحالة من ${existingTrip.status} إلى ${tripData.status}`,
        timestamp: now,
        metadata: { oldStatus: existingTrip.status, newStatus: tripData.status }
      };
      
      mockTripEvents.push(newEvent);
    }
    
    const updatedTrip: Trip = {
      ...existingTrip,
      ...tripData,
      updatedAt: now
    };
    
    mockTrips[tripIndex] = updatedTrip;
    
    return updatedTrip;
  } catch (error) {
    console.error(`Error updating trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * حذف رحلة
 * @param tripId معرف الرحلة
 */
export const deleteTrip = async (tripId: string): Promise<boolean> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { error } = await supabase
    //   .from('trips')
    //   .delete()
    //   .eq('id', tripId);
    
    // if (error) throw error;
    // return true;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const tripIndex = mockTrips.findIndex(trip => trip.id === tripId);
    
    if (tripIndex === -1) {
      throw new Error(`Trip with ID ${tripId} not found`);
    }
    
    mockTrips.splice(tripIndex, 1);
    
    // حذف أحداث الرحلة المرتبطة بطريقة أمنة
    // بدلاً من إعادة تعيين المصفوفة، نقوم بحذف العناصر من المصفوفة الحالية
    for (let i = mockTripEvents.length - 1; i >= 0; i--) {
      if (mockTripEvents[i].tripId === tripId) {
        mockTripEvents.splice(i, 1);
      }
    }
    
    // حذف مسارات الرحلة المرتبطة بطريقة أمنة
    for (let i = mockTripRoutes.length - 1; i >= 0; i--) {
      if (mockTripRoutes[i].tripId === tripId) {
        mockTripRoutes.splice(i, 1);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * الحصول على إحصائيات الرحلات
 */
export const getTripStats = async (): Promise<TripStats> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { data, error } = await supabase
    //   .rpc('get_trip_stats');
    
    // if (error) throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const totalTrips = mockTrips.length;
    const scheduledTrips = mockTrips.filter(trip => trip.status === 'scheduled').length;
    const inProgressTrips = mockTrips.filter(trip => trip.status === 'in_progress').length;
    const completedTrips = mockTrips.filter(trip => trip.status === 'completed').length;
    const cancelledTrips = mockTrips.filter(trip => trip.status === 'cancelled').length;
    
    const totalDistance = mockTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
    const totalDuration = mockTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
    
    return {
      total: totalTrips,
      scheduled: scheduledTrips,
      inProgress: inProgressTrips,
      completed: completedTrips,
      cancelled: cancelledTrips,
      totalDistance,
      totalDuration
    };
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    throw error;
  }
};

/**
 * الحصول على أحداث الرحلة
 * @param tripId معرف الرحلة
 */
export const getTripEvents = async (tripId: string): Promise<TripEvent[]> => {
  try {
    // عند إضافة جدول trip_events يمكن استخدام التعليقات التالية:
    // const { data, error } = await supabase
    //   .from('trip_events')
    //   .select('*')
    //   .eq('trip_id', tripId)
    //   .order('timestamp', { ascending: true });
    
    // if (error) throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const events = mockTripEvents.filter(event => event.tripId === tripId);
    
    // ترتيب حسب الوقت تصاعدياً
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return events;
  } catch (error) {
    console.error(`Error fetching events for trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * الحصول على مسار الرحلة
 * @param tripId معرف الرحلة
 */
export const getTripRoute = async (tripId: string): Promise<TripRoute | null> => {
  try {
    // عند إضافة جدول trip_routes يمكن استخدام التعليقات التالية:
    // const { data, error } = await supabase
    //   .from('trip_routes')
    //   .select('*')
    //   .eq('trip_id', tripId)
    //   .single();
    
    // if (error && error.code !== 'PGRST116') throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const route = mockTripRoutes.find(route => route.tripId === tripId);
    return route || null;
  } catch (error) {
    console.error(`Error fetching route for trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * تحديث حالة رحلة
 * @param tripId معرف الرحلة
 * @param newStatus الحالة الجديدة
 * @param comment تعليق اختياري
 */
export const updateTripStatus = async (
  tripId: string, 
  newStatus: "scheduled" | "in_progress" | "completed" | "cancelled", 
  comment?: string
): Promise<Trip> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { data: existingTrip, error: fetchError } = await supabase
    //   .from('trips')
    //   .select('*')
    //   .eq('id', tripId)
    //   .single();
    
    // if (fetchError) throw fetchError;
    // if (!existingTrip) throw new Error(`Trip with ID ${tripId} not found`);
    
    // const now = new Date().toISOString();
    
    // // إضافة حدث لتغيير الحالة
    // const eventData = {
    //   trip_id: tripId,
    //   event_type: 'status_change',
    //   description: `Status changed from ${existingTrip.status} to ${newStatus}${comment ? ': ' + comment : ''}`,
    //   timestamp: now,
    //   metadata: { oldStatus: existingTrip.status, newStatus, comment }
    // };
    
    // const { error: eventError } = await supabase
    //   .from('trip_events')
    //   .insert(eventData);
    
    // if (eventError) throw eventError;
    
    // // تحديث حالة الرحلة
    // const { data, error } = await supabase
    //   .from('trips')
    //   .update({
    //     status: newStatus,
    //     updated_at: now
    //   })
    //   .eq('id', tripId)
    //   .select()
    //   .single();
    
    // if (error) throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const tripIndex = mockTrips.findIndex(trip => trip.id === tripId);
    
    if (tripIndex === -1) {
      throw new Error(`Trip with ID ${tripId} not found`);
    }
    
    const existingTrip = mockTrips[tripIndex];
    const now = new Date().toISOString();
    
    // إضافة حدث لتغيير الحالة
    const newEvent: TripEvent = {
      id: `event-${generateId()}`,
      tripId: tripId,
      eventType: "status_change",
      description: `تم تغيير الحالة من ${existingTrip.status} إلى ${newStatus}${comment ? ': ' + comment : ''}`,
      timestamp: now,
      metadata: { 
        oldStatus: existingTrip.status, 
        newStatus, 
        comment 
      }
    };
    
    mockTripEvents.push(newEvent);
    
    // تحديث حالة الرحلة
    const updatedTrip: Trip = {
      ...existingTrip,
      status: newStatus,
      updatedAt: now
    };
    
    mockTrips[tripIndex] = updatedTrip;
    
    return updatedTrip;
  } catch (error) {
    console.error(`Error updating status for trip with ID ${tripId}:`, error);
    throw error;
  }
};

/**
 * جلب الرحلات حسب وكيل التوصيل
 * @param agentId معرف وكيل التوصيل
 */
export const getTripsByAgent = async (agentId: string): Promise<Trip[]> => {
  try {
    // عند إضافة جدول trips يمكن استخدام التعليقات التالية:
    // const { data, error } = await supabase
    //   .from('trips')
    //   .select('*')
    //   .eq('agent_id', agentId)
    //   .order('start_time', { ascending: false });
    
    // if (error) throw error;
    // return data;

    // استخدام البيانات الوهمية بدلاً من قاعدة البيانات
    const trips = mockTrips.filter(trip => trip.agentId === agentId);
    
    // ترتيب حسب وقت البدء تنازلياً
    trips.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return trips;
  } catch (error) {
    console.error(`Error fetching trips for agent with ID ${agentId}:`, error);
    throw error;
  }
};