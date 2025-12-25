import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { agentsApi, CreateAgentPayload } from '@/services/agentsApi';
import { Agent } from '@/types';

// حالة المندوبين الأولية
interface AgentsState {
  items: Agent[];
  activeAgents: Agent[];
  selectedAgent: Agent | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  activeFilter: string;
}

const initialState: AgentsState = {
  items: [],
  activeAgents: [],
  selectedAgent: null,
  status: 'idle',
  error: null,
  activeFilter: 'all'
};

// جلب جميع المندوبين
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async () => {
    return await agentsApi.getAll();
  }
);

// جلب المندوبين النشطين
export const fetchActiveAgents = createAsyncThunk(
  'agents/fetchActiveAgents',
  async () => {
    return await agentsApi.getActive();
  }
);

// جلب مندوب محدد بواسطة المعرف
export const fetchAgentById = createAsyncThunk(
  'agents/fetchAgentById',
  async (id: string) => {
    return await agentsApi.getById(id);
  }
);

// تحديث حالة مندوب محدد
export const updateAgentStatus = createAsyncThunk(
  'agents/updateAgentStatus',
  async ({ id, status }: { id: string; status: string }) => {
    return await agentsApi.updateStatus(id, status);
  }
);

// تحديث تفاصيل مندوب محدد
export const updateAgentDetails = createAsyncThunk(
  'agents/updateAgentDetails',
  async ({ agentId, updateData }: { agentId: string; updateData: Partial<Agent> }, { rejectWithValue }) => {
    try {
      const response = await agentsApi.updateDetails(agentId, updateData);
      if (!response) {
        return rejectWithValue('Failed to update agent, no response from API function.');
      }
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message || 'Unknown error during agent update');
      }
      return rejectWithValue('An unknown error occurred during agent update');
    }
  }
);

// إضافة مندوب توصيل جديد
export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (payload: CreateAgentPayload, { rejectWithValue }) => {
    try {
      const response = await agentsApi.create(payload);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.agentId; // أو الكائن الكامل للمندوب إذا كانت الـ API ترجعه
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('فشل غير معروف عند إنشاء مندوب توصيل جديد.');
    }
  }
);

// شريحة المندوبين
const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    // تعيين عامل التصفية النشط
    setActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilter = action.payload;
    },
    // إلغاء تحديد المندوب المحدد
    clearSelectedAgent: (state) => {
      state.selectedAgent = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // جلب جميع المندوبين
      .addCase(fetchAgents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'فشل في جلب المندوبين';
      })
      
      // جلب المندوبين النشطين
      .addCase(fetchActiveAgents.fulfilled, (state, action) => {
        state.activeAgents = action.payload;
      })
      
      // جلب مندوب محدد بواسطة المعرف
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.selectedAgent = action.payload;
      })
      
      // تحديث حالة مندوب محدد
      .addCase(updateAgentStatus.fulfilled, (state, action: PayloadAction<Agent | null>) => {
        if (action.payload) {
          const updatedAgent = action.payload;
          // تحديث المندوب في قائمة المندوبين
          const index = state.items.findIndex(agent => agent.id === updatedAgent.id);
          if (index !== -1) {
            state.items[index] = updatedAgent;
          }
          
          // تحديث المندوب المحدد إذا كان هو نفسه
          if (state.selectedAgent?.id === updatedAgent.id) {
            state.selectedAgent = updatedAgent;
          }
          
          // تحديث المندوب في قائمة المندوبين النشطين
          const activeIndex = state.activeAgents.findIndex(agent => agent.id === updatedAgent.id);
          const isNowConsideredActive = updatedAgent.status !== 'offline'; 

          if (activeIndex !== -1) {
            if (isNowConsideredActive) {
              state.activeAgents[activeIndex] = updatedAgent;
            } else {
              state.activeAgents.splice(activeIndex, 1);
            }
          } else if (isNowConsideredActive) {
            state.activeAgents.push(updatedAgent);
          }
        }
      })
      // معالجات لتحديث تفاصيل المندوب
      .addCase(updateAgentDetails.pending, (state) => {
        state.status = 'loading'; 
      })
      .addCase(updateAgentDetails.fulfilled, (state, action: PayloadAction<Agent>) => {
        state.status = 'succeeded';
        const updatedAgent = action.payload;
        // تحديث المندوب في قائمة items
        const index = state.items.findIndex(agent => agent.id === updatedAgent.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedAgent };
        }
        // تحديث المندوب في قائمة activeAgents إذا كان موجودًا
        const activeIndex = state.activeAgents.findIndex(agent => agent.id === updatedAgent.id);
        if (activeIndex !== -1) {
          state.activeAgents[activeIndex] = { ...state.activeAgents[activeIndex], ...updatedAgent };
        }
        // تحديث selectedAgent إذا كان هو المندوب المحدث
        if (state.selectedAgent?.id === updatedAgent.id) {
          state.selectedAgent = { ...state.selectedAgent, ...updatedAgent };
        }
      })
      .addCase(updateAgentDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'فشل في تحديث تفاصيل المندوب';
      })
      // معالجة إضافة مندوب جديد
      .addCase(createAgent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createAgent.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
        // لا نقوم بإضافة المندوب مباشرة هنا، بل نعتمد على fetchAgents لتحديث القائمة
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'فشل في إضافة مندوب جديد';
      });
  }
});

// تصدير الإجراءات المنشأة من قبل شريحة المندوبين
export const { setActiveFilter, clearSelectedAgent } = agentsSlice.actions;

// تصدير المخفض الافتراضي
export default agentsSlice.reducer;