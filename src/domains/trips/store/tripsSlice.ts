/**
 * شريحة Redux للرحلات
 * توفر الإجراءات المحلية (reducers) والإجراءات غير المتزامنة (thunks) للتعامل مع الرحلات
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Trip, 
  TripCreationData, 
  TripFilters, 
  TripsState,
  TripStats,
  TripEvent,
  TripRoute 
} from '../types';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus,
  getTripsByAgent,
  getTripStats,
  getTripEvents,
  getTripRoute
} from '../api/tripsApi';

// الحالة الأولية
const initialState: TripsState = {
  trips: [],
  selectedTrip: null,
  filters: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  totalCount: 0,
  page: 1,
  limit: 10
};

// إجراءات غير متزامنة للتفاعل مع API

/**
 * جلب قائمة الرحلات
 */
export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (
    { 
      filters, 
      page = 1, 
      limit = 10 
    }: { 
      filters?: TripFilters, 
      page?: number, 
      limit?: number 
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await getTrips(filters, page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب الرحلات');
    }
  }
);

/**
 * جلب تفاصيل رحلة محددة بواسطة المعرف
 */
export const fetchTripById = createAsyncThunk(
  'trips/fetchTripById',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const trip = await getTripById(tripId);
      if (!trip) {
        return rejectWithValue('الرحلة غير موجودة');
      }
      return trip;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب تفاصيل الرحلة');
    }
  }
);

/**
 * إنشاء رحلة جديدة
 */
export const addTrip = createAsyncThunk(
  'trips/addTrip',
  async (tripData: TripCreationData, { rejectWithValue }) => {
    try {
      const newTrip = await createTrip(tripData);
      return newTrip;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في إنشاء الرحلة');
    }
  }
);

/**
 * تحديث رحلة موجودة
 */
export const editTrip = createAsyncThunk(
  'trips/editTrip',
  async (
    { tripId, tripData }: { tripId: string; tripData: Partial<Trip> },
    { rejectWithValue }
  ) => {
    try {
      const updatedTrip = await updateTrip(tripId, tripData);
      return updatedTrip;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث الرحلة');
    }
  }
);

/**
 * حذف رحلة
 */
export const removeTrip = createAsyncThunk(
  'trips/removeTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      await deleteTrip(tripId);
      return tripId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في حذف الرحلة');
    }
  }
);

/**
 * تحديث حالة رحلة
 */
export const changeTripStatus = createAsyncThunk(
  'trips/changeTripStatus',
  async (
    { 
      tripId, 
      newStatus, 
      comment 
    }: { 
      tripId: string; 
      newStatus: "scheduled" | "in_progress" | "completed" | "cancelled"; 
      comment?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const updatedTrip = await updateTripStatus(tripId, newStatus, comment);
      return updatedTrip;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث حالة الرحلة');
    }
  }
);

/**
 * جلب الرحلات حسب وكيل التوصيل
 */
export const fetchTripsByAgent = createAsyncThunk(
  'trips/fetchTripsByAgent',
  async (agentId: string, { rejectWithValue }) => {
    try {
      const trips = await getTripsByAgent(agentId);
      return trips;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب رحلات الوكيل');
    }
  }
);

/**
 * جلب إحصائيات الرحلات
 */
export const fetchTripStats = createAsyncThunk(
  'trips/fetchTripStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await getTripStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب إحصائيات الرحلات');
    }
  }
);

/**
 * جلب أحداث رحلة
 */
export const fetchTripEvents = createAsyncThunk(
  'trips/fetchTripEvents',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const events = await getTripEvents(tripId);
      return { tripId, events };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب أحداث الرحلة');
    }
  }
);

/**
 * جلب مسار رحلة
 */
export const fetchTripRoute = createAsyncThunk(
  'trips/fetchTripRoute',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const route = await getTripRoute(tripId);
      return { tripId, route };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب مسار الرحلة');
    }
  }
);

// إنشاء شريحة Redux
const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    // تحديث الفلاتر
    setFilters: (state, action: PayloadAction<TripFilters>) => {
      state.filters = action.payload;
    },
    
    // تعيين رحلة محددة
    setSelectedTrip: (state, action: PayloadAction<Trip | null>) => {
      state.selectedTrip = action.payload;
    },
    
    // تعيين رقم الصفحة
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    
    // تعيين عدد العناصر في الصفحة
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
    
    // مسح الأخطاء
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // استجابات جلب قائمة الرحلات
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips = action.payload.trips;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // استجابات جلب تفاصيل رحلة محددة
    builder
      .addCase(fetchTripById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTrip = action.payload;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // استجابات إنشاء رحلة جديدة
    builder
      .addCase(addTrip.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(addTrip.fulfilled, (state, action) => {
        state.isCreating = false;
        state.trips.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(addTrip.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });
    
    // استجابات تحديث رحلة موجودة
    builder
      .addCase(editTrip.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(editTrip.fulfilled, (state, action) => {
        state.isUpdating = false;
        
        // تحديث الرحلة في القائمة
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        
        // تحديث الرحلة المحددة إذا كانت هي نفسها
        if (state.selectedTrip && state.selectedTrip.id === action.payload.id) {
          state.selectedTrip = action.payload;
        }
      })
      .addCase(editTrip.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
    
    // استجابات حذف رحلة
    builder
      .addCase(removeTrip.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeTrip.fulfilled, (state, action) => {
        state.isUpdating = false;
        
        // إزالة الرحلة من القائمة
        state.trips = state.trips.filter(trip => trip.id !== action.payload);
        state.totalCount -= 1;
        
        // إعادة تعيين الرحلة المحددة إذا كانت هي المحذوفة
        if (state.selectedTrip && state.selectedTrip.id === action.payload) {
          state.selectedTrip = null;
        }
      })
      .addCase(removeTrip.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
    
    // استجابات تحديث حالة رحلة
    builder
      .addCase(changeTripStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(changeTripStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        
        // تحديث الرحلة في القائمة
        const index = state.trips.findIndex(trip => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        
        // تحديث الرحلة المحددة إذا كانت هي نفسها
        if (state.selectedTrip && state.selectedTrip.id === action.payload.id) {
          state.selectedTrip = action.payload;
        }
      })
      .addCase(changeTripStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
    
    // استجابات جلب الرحلات حسب وكيل التوصيل
    builder
      .addCase(fetchTripsByAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTripsByAgent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trips = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(fetchTripsByAgent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

// تصدير الإجراءات
export const {
  setFilters,
  setSelectedTrip,
  setPage,
  setLimit,
  clearErrors
} = tripsSlice.actions;

// تصدير المخفض
export default tripsSlice.reducer;