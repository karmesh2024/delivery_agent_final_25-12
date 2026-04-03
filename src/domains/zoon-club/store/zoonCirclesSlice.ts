import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  zoonCirclesService, 
  ZoonCircle, 
  ZoonCircleMember, 
  ZoonCircleResource, 
  ZoonCircleConnection,
  ZoonCircleCategory 
} from '../services/zoonCirclesService';
import { GroupHarmonyAnalysis } from '../services/zoonMindEngineService';

interface ZoonCirclesState {
  circles: ZoonCircle[];
  categories: ZoonCircleCategory[];
  membersMap: Record<string, ZoonCircleMember[]>;
  circlesHarmony: Record<string, GroupHarmonyAnalysis>; // تحليل توازن الدوائر
  outerZoneMembers: ZoonCircleMember[];
  activeCircleResources: ZoonCircleResource[];
  connections: ZoonCircleConnection[];
  loading: boolean;
  availableClubMembers: any[]; // الأعضاء المتاحون للمقترحات
  error: string | null;
}

const initialState: ZoonCirclesState = {
  circles: [],
  categories: [],
  membersMap: {},
  circlesHarmony: {},
  outerZoneMembers: [],
  activeCircleResources: [],
  connections: [],
  availableClubMembers: [],
  loading: false,
  error: null,
};

// ... Thunks ...

export const fetchCircleHarmony = createAsyncThunk(
  'zoonCircles/fetchHarmony',
  async (circleId: string) => {
    return {
      circleId,
      analysis: await zoonCirclesService.calculateCircleDynamics(circleId)
    };
  }
);

// ... existing Thunks ...
export const fetchZoonCircles = createAsyncThunk(
  'zoonCircles/fetchAll',
  async (ownerId?: string) => {
    return await zoonCirclesService.getCircles(ownerId);
  }
);

export const fetchZoonCategories = createAsyncThunk(
  'zoonCircles/fetchCategories',
  async () => {
    return await zoonCirclesService.getCategories();
  }
);

export const createZoonCategory = createAsyncThunk(
  'zoonCircles/createCategory',
  async (category: Partial<ZoonCircleCategory>) => {
    return await zoonCirclesService.createCategory(category);
  }
);

export const deleteZoonCategory = createAsyncThunk(
  'zoonCircles/deleteCategory',
  async (id: string) => {
    await zoonCirclesService.deleteCategory(id);
    return id;
  }
);

export const createZoonCircle = createAsyncThunk(
  'zoonCircles/create',
  async (circleData: Partial<ZoonCircle>) => {
    return await zoonCirclesService.createCircle(circleData);
  }
);

export const updateZoonCircle = createAsyncThunk(
  'zoonCircles/update',
  async ({ id, updates }: { id: string; updates: Partial<ZoonCircle> }) => {
    return await zoonCirclesService.updateCircle(id, updates);
  }
);

export const deleteZoonCircle = createAsyncThunk(
  'zoonCircles/delete',
  async (id: string) => {
    await zoonCirclesService.deleteCircle(id);
    return id;
  }
);

export const fetchCircleMembers = createAsyncThunk(
  'zoonCircles/fetchMembers',
  async (circleId: string) => {
    return await zoonCirclesService.getCircleMembers(circleId);
  }
);

export const addCircleMember = createAsyncThunk(
  'zoonCircles/addMember',
  async (memberData: Partial<ZoonCircleMember>) => {
    return await zoonCirclesService.addMember(memberData);
  }
);

export const deleteCircleMember = createAsyncThunk(
  'zoonCircles/deleteMember',
  async (id: string) => {
    await zoonCirclesService.deleteMember(id);
    return id;
  }
);

export const fetchCircleConnections = createAsyncThunk(
  'zoonCircles/fetchConnections',
  async (circleIds: string[]) => {
    return await zoonCirclesService.getConnections(circleIds);
  }
);

export const fetchCircleResources = createAsyncThunk(
  'zoonCircles/fetchResources',
  async (circleId: string) => {
    return await zoonCirclesService.getResources(circleId);
  }
);

export const addCircleResource = createAsyncThunk(
  'zoonCircles/addResource',
  async (resourceData: Partial<ZoonCircleResource>) => {
    return await zoonCirclesService.addResource(resourceData);
  }
);

export const createCircleConnection = createAsyncThunk(
  'zoonCircles/createConnection',
  async (connectionData: Partial<ZoonCircleConnection>) => {
    return await zoonCirclesService.createConnection(connectionData);
  }
);

export const updateCircleConnection = createAsyncThunk(
  'zoonCircles/updateConnection',
  async ({ id, updates }: { id: string; updates: Partial<ZoonCircleConnection> }) => {
    return await zoonCirclesService.updateConnection(id, updates);
  }
);

export const deleteCircleConnection = createAsyncThunk(
  'zoonCircles/deleteConnection',
  async (id: string) => {
    return id;
  }
);

export const fetchAvailableClubMembers = createAsyncThunk(
  'zoonCircles/fetchAvailableMembers',
  async () => {
    return await zoonCirclesService.getAvailableClubMembers();
  }
);

const zoonCirclesSlice = createSlice({
  name: 'zoonCircles',
  initialState,
  reducers: {
    clearCirclesError: (state) => {
      state.error = null;
    },
    moveToOuterZone: (state, action: PayloadAction<string>) => {
      // البحث عن العضو في الخريطة وحذفه منها وإضافته للمنطقة الخارجية
      Object.keys(state.membersMap).forEach(circleId => {
        const member = state.membersMap[circleId].find(m => m.id === action.payload);
        if (member) {
          state.outerZoneMembers.push(member);
          state.membersMap[circleId] = state.membersMap[circleId].filter(m => m.id !== action.payload);
        }
      });
    },
    removeFromOuterZone: (state, action: PayloadAction<string>) => {
      state.outerZoneMembers = state.outerZoneMembers.filter(m => m.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Harmony Analysis
      .addCase(fetchCircleHarmony.fulfilled, (state, action) => {
        if (action.payload.analysis) {
          state.circlesHarmony[action.payload.circleId] = action.payload.analysis;
        }
      })
      // Fetch Circles
      .addCase(fetchZoonCircles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchZoonCircles.fulfilled, (state, action: PayloadAction<ZoonCircle[]>) => {
        state.loading = false;
        state.circles = action.payload;
      })
      // Categories
      .addCase(fetchZoonCategories.fulfilled, (state, action: PayloadAction<ZoonCircleCategory[]>) => {
        state.categories = action.payload;
      })
      .addCase(createZoonCategory.fulfilled, (state, action: PayloadAction<ZoonCircleCategory>) => {
        state.categories.push(action.payload);
      })
      .addCase(deleteZoonCategory.fulfilled, (state, action: PayloadAction<string>) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      })
      // Create Circle
      .addCase(createZoonCircle.fulfilled, (state, action: PayloadAction<ZoonCircle>) => {
        state.circles.unshift(action.payload);
      })
      // Update Circle
      .addCase(updateZoonCircle.fulfilled, (state, action: PayloadAction<ZoonCircle>) => {
        const index = state.circles.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.circles[index] = action.payload;
        }
      })
      // Delete Circle
      .addCase(deleteZoonCircle.fulfilled, (state, action: PayloadAction<string>) => {
        state.circles = state.circles.filter(c => c.id !== action.payload);
      })
      // Members
      .addCase(fetchCircleMembers.fulfilled, (state, action: PayloadAction<ZoonCircleMember[]>) => {
        if (action.payload.length > 0) {
          const circleId = action.payload[0].circle_id;
          state.membersMap[circleId] = action.payload;
        }
      })
      .addCase(addCircleMember.fulfilled, (state, action: PayloadAction<ZoonCircleMember>) => {
        const circleId = action.payload.circle_id;
        if (!state.membersMap[circleId]) state.membersMap[circleId] = [];
        state.membersMap[circleId].push(action.payload);
      })
      .addCase(deleteCircleMember.fulfilled, (state, action: PayloadAction<string>) => {
        // البحث عن العضو في جميع الدوائر وحذفه
        Object.keys(state.membersMap).forEach(circleId => {
          state.membersMap[circleId] = state.membersMap[circleId].filter(m => m.id !== action.payload);
        });
      })
      // Connections
      .addCase(fetchCircleConnections.fulfilled, (state, action: PayloadAction<ZoonCircleConnection[]>) => {
        state.connections = action.payload;
      })
      // Resources
      .addCase(fetchCircleResources.fulfilled, (state, action: PayloadAction<ZoonCircleResource[]>) => {
        state.activeCircleResources = action.payload;
      })
      .addCase(addCircleResource.fulfilled, (state, action: PayloadAction<ZoonCircleResource>) => {
        state.activeCircleResources.push(action.payload);
      })
      .addCase(createCircleConnection.fulfilled, (state, action: PayloadAction<ZoonCircleConnection>) => {
        state.connections.push(action.payload);
      })
      .addCase(updateCircleConnection.fulfilled, (state, action: PayloadAction<ZoonCircleConnection>) => {
        const index = state.connections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.connections[index] = action.payload;
        }
      })
      .addCase(deleteCircleConnection.fulfilled, (state, action: PayloadAction<string>) => {
        state.connections = state.connections.filter(c => c.id !== action.payload);
      })
      // Available Members
      .addCase(fetchAvailableClubMembers.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.availableClubMembers = action.payload;
      });
  },
});

export const { clearCirclesError, moveToOuterZone, removeFromOuterZone } = zoonCirclesSlice.actions;
export default zoonCirclesSlice.reducer;
