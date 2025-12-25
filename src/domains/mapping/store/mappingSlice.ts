/**
 * Mapping and Tracking Redux Slice
 * شريحة Redux لإدارة حالة الخرائط والتتبع
 * 
 * @version 1.0.0
 * @module domains/mapping/store
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mappingApi, TrackingPoint, TrackingPointWithDetails, MapAgent } from '../api/mappingApi';

// تعريف حالة شريحة الخرائط والتتبع
interface MappingState {
  agents: {
    items: MapAgent[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  trackingPoints: {
    byOrderId: Record<string, TrackingPointWithDetails[]>;
    byAgentId: Record<string, TrackingPointWithDetails[]>;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  routes: {
    byOrderId: Record<string, { 
      waypoints: Array<{ lat: number; lng: number }>;
      distance: number;
      duration: number;
    }>;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  selectedAgent: string | null;
  selectedOrder: string | null;
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;
}

// الحالة الأولية
const initialState: MappingState = {
  agents: {
    items: [],
    status: 'idle',
    error: null
  },
  trackingPoints: {
    byOrderId: {},
    byAgentId: {},
    status: 'idle',
    error: null
  },
  routes: {
    byOrderId: {},
    status: 'idle',
    error: null
  },
  selectedAgent: null,
  selectedOrder: null,
  mapCenter: null,
  mapZoom: 13
};

// ------------ ASYNC THUNKS ------------

// جلب المندوبين النشطين مع مواقعهم
export const fetchActiveAgents = createAsyncThunk(
  'mapping/fetchActiveAgents',
  async () => {
    return await mappingApi.getActiveAgentsWithLocations();
  }
);

// جلب نقاط التتبع لطلب محدد
export const fetchTrackingPointsByOrderId = createAsyncThunk(
  'mapping/fetchTrackingPointsByOrderId',
  async (orderId: string) => {
    return {
      orderId,
      points: await mappingApi.getTrackingPointsByOrderId(orderId)
    };
  }
);

// جلب نقاط التتبع لمندوب محدد
export const fetchTrackingPointsByAgentId = createAsyncThunk(
  'mapping/fetchTrackingPointsByAgentId',
  async (agentId: string) => {
    return {
      agentId,
      points: await mappingApi.getTrackingPointsByAgentId(agentId)
    };
  }
);

// إضافة نقطة تتبع جديدة
export const addTrackingPoint = createAsyncThunk(
  'mapping/addTrackingPoint',
  async (trackingPoint: TrackingPoint) => {
    const result = await mappingApi.addTrackingPoint(trackingPoint);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { trackingPoint, id: result.id };
  }
);

// ------------ SLICE DEFINITION ------------

const mappingSlice = createSlice({
  name: 'mapping',
  initialState,
  reducers: {
    // تحديد مندوب
    setSelectedAgent: (state, action: PayloadAction<string | null>) => {
      state.selectedAgent = action.payload;
    },
    
    // تحديد طلب
    setSelectedOrder: (state, action: PayloadAction<string | null>) => {
      state.selectedOrder = action.payload;
    },
    
    // تحديد مركز الخريطة
    setMapCenter: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      state.mapCenter = action.payload;
    },
    
    // تحديد تكبير الخريطة
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.mapZoom = action.payload;
    },
    
    // تحديث موقع المندوب
    updateAgentLocation: (state, action: PayloadAction<{ 
      agentId: string; 
      location: { lat: number; lng: number; timestamp?: string; }
    }>) => {
      const { agentId, location } = action.payload;
      const agentIndex = state.agents.items.findIndex(agent => agent.id === agentId);
      
      if (agentIndex !== -1) {
        state.agents.items[agentIndex].location = {
          ...state.agents.items[agentIndex].location,
          ...location
        };
      }
    },
    
    // إضافة مسار لطلب
    addRoute: (state, action: PayloadAction<{
      orderId: string;
      route: {
        waypoints: Array<{ lat: number; lng: number }>;
        distance: number;
        duration: number;
      }
    }>) => {
      const { orderId, route } = action.payload;
      state.routes.byOrderId[orderId] = route;
    },
    
    // إعادة تعيين الحالة
    resetMappingState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    // معالجة حالات جلب المندوبين النشطين
    builder
      .addCase(fetchActiveAgents.pending, (state) => {
        state.agents.status = 'loading';
      })
      .addCase(fetchActiveAgents.fulfilled, (state, action) => {
        state.agents.status = 'succeeded';
        state.agents.items = action.payload;
        state.agents.error = null;
      })
      .addCase(fetchActiveAgents.rejected, (state, action) => {
        state.agents.status = 'failed';
        state.agents.error = action.error.message || 'خطأ في جلب المندوبين';
      })
    
    // معالجة حالات جلب نقاط التتبع للطلب
    builder
      .addCase(fetchTrackingPointsByOrderId.pending, (state) => {
        state.trackingPoints.status = 'loading';
      })
      .addCase(fetchTrackingPointsByOrderId.fulfilled, (state, action) => {
        state.trackingPoints.status = 'succeeded';
        state.trackingPoints.byOrderId[action.payload.orderId] = action.payload.points;
        state.trackingPoints.error = null;
      })
      .addCase(fetchTrackingPointsByOrderId.rejected, (state, action) => {
        state.trackingPoints.status = 'failed';
        state.trackingPoints.error = action.error.message || 'خطأ في جلب نقاط التتبع';
      })
    
    // معالجة حالات جلب نقاط التتبع للمندوب
    builder
      .addCase(fetchTrackingPointsByAgentId.pending, (state) => {
        state.trackingPoints.status = 'loading';
      })
      .addCase(fetchTrackingPointsByAgentId.fulfilled, (state, action) => {
        state.trackingPoints.status = 'succeeded';
        state.trackingPoints.byAgentId[action.payload.agentId] = action.payload.points;
        state.trackingPoints.error = null;
      })
      .addCase(fetchTrackingPointsByAgentId.rejected, (state, action) => {
        state.trackingPoints.status = 'failed';
        state.trackingPoints.error = action.error.message || 'خطأ في جلب نقاط التتبع';
      })
    
    // معالجة حالات إضافة نقطة تتبع جديدة
    builder
      .addCase(addTrackingPoint.fulfilled, (state, action) => {
        // إذا كان لدينا نقاط تتبع للطلب، نضيف النقطة الجديدة
        const { trackingPoint } = action.payload;
        const orderId = trackingPoint.order_id;
        const agentId = trackingPoint.delivery_boy_id;
        
        if (state.trackingPoints.byOrderId[orderId]) {
          state.trackingPoints.byOrderId[orderId].push(trackingPoint as TrackingPointWithDetails);
        }
        
        if (state.trackingPoints.byAgentId[agentId]) {
          state.trackingPoints.byAgentId[agentId].push(trackingPoint as TrackingPointWithDetails);
        }
        
        // تحديث موقع المندوب
        const agentIndex = state.agents.items.findIndex(agent => agent.id === agentId);
        if (agentIndex !== -1) {
          state.agents.items[agentIndex].location = {
            lat: trackingPoint.lat,
            lng: trackingPoint.lng,
            timestamp: trackingPoint.timestamp,
            speed: trackingPoint.speed,
            heading: trackingPoint.heading
          };
        }
      });
  }
});

// تصدير الإجراءات والمخفض
export const {
  setSelectedAgent,
  setSelectedOrder,
  setMapCenter,
  setMapZoom,
  updateAgentLocation,
  addRoute,
  resetMappingState
} = mappingSlice.actions;

export default mappingSlice.reducer;