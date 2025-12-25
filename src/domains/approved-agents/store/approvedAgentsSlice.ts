import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService'; // استيراد الخدمة الجديدة
import { NewAgentPayload, ApprovedAgent, AgentCommission } from '@/types'; // استيراد الأنواع الصحيحة

// تعريف حمولة تحديث تفاصيل الوكيل
interface UpdateAgentDetailsPayload {
  agentId: string;
  storage_location?: string;
  region?: string;
  agent_type?: string;
  payment_method?: string;
  function_specific_commissions?: AgentCommission[] | null;
}

// تعريف حالة slice الوكلاء المعتمدين
interface ApprovedAgentsState {
  items: ApprovedAgent[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// الحالة الأولية
const initialState: ApprovedAgentsState = {
  items: [],
  status: 'idle',
  error: null,
};

// Thunk لجلب جميع الوكلاء المعتمدين
export const fetchApprovedAgents = createAsyncThunk(
  'approvedAgents/fetchApprovedAgents',
  async (_, { rejectWithValue }) => {
    const { agents, error } = await approvedAgentService.getApprovedAgents();
    if (error) {
      return rejectWithValue(error);
    }
    return agents;
  }
);

// Thunk لإنشاء وكيل معتمد جديد
export const createApprovedAgent = createAsyncThunk(
  'approvedAgents/createApprovedAgent',
  async (payload: NewAgentPayload, { rejectWithValue }) => {
    const { agentId, error } = await approvedAgentService.createApprovedAgent(payload);
    if (error) {
      return rejectWithValue(error);
    }
    return agentId;
  }
);

// Thunk لتحديث تفاصيل وكيل معتمد
export const updateApprovedAgentDetails = createAsyncThunk(
  'approvedAgents/updateApprovedAgentDetails',
  async (payload: UpdateAgentDetailsPayload, { rejectWithValue }) => {
    const { error } = await approvedAgentService.updateApprovedAgentDetails(payload.agentId, payload);
    if (error) {
      return rejectWithValue(error);
    }
    return null; // لا توجد بيانات محددة لإرجاعها عند النجاح
  }
);

// إنشاء slice الوكلاء المعتمدين
const approvedAgentsSlice = createSlice({
  name: 'approvedAgents',
  initialState,
  reducers: {
    // يمكن إضافة reducers أخرى هنا إذا لزم الأمر للتعامل مع تحديثات الحالة المحلية غير المتزامنة
  },
  extraReducers: (builder) => {
    builder
      // حالات fetchApprovedAgents
      .addCase(fetchApprovedAgents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchApprovedAgents.fulfilled, (state, action: PayloadAction<ApprovedAgent[] | null>) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(fetchApprovedAgents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ? (action.payload as string) : 'فشل جلب الوكلاء المعتمدين';
      })
      // حالات createApprovedAgent
      .addCase(createApprovedAgent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createApprovedAgent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(createApprovedAgent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ? (action.payload as string) : 'فشل إنشاء وكيل معتمد جديد';
      })
      // حالات updateApprovedAgentDetails
      .addCase(updateApprovedAgentDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateApprovedAgentDetails.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(updateApprovedAgentDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ? (action.payload as string) : 'فشل تحديث تفاصيل الوكيل';
      });
  },
});

export default approvedAgentsSlice.reducer; 