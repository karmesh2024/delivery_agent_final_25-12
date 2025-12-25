import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { agentService, AgentWithDetails } from '@/services/agentService';
import { NewAgentPayload } from '@/types';

// تعريف حالة slice الوكلاء
interface AgentsState {
  items: AgentWithDetails[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// الحالة الأولية
const initialState: AgentsState = {
  items: [],
  status: 'idle',
  error: null,
};

// Thunk لجلب جميع الوكلاء
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (_, { rejectWithValue }) => {
    const { agents, error } = await agentService.getAgents();
    if (error) {
      return rejectWithValue(error);
    }
    return agents;
  }
);

// Thunk لإنشاء وكيل جديد
export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (payload: NewAgentPayload, { rejectWithValue }) => {
    const { agentId, error } = await agentService.createAgent(payload);
    if (error) {
      return rejectWithValue(error);
    }
    // بعد إنشاء الوكيل بنجاح، يمكننا جلب تفاصيله الكاملة إذا أردنا إضافتها إلى الحالة على الفور
    // أو يمكننا ببساطة إرجاع الـ agentId وتحديث الحالة بشكل منفصل أو إعادة جلب القائمة بالكامل
    // لغرض التبسيط، سأفترض أننا قد نحتاج إلى إعادة جلب الوكلاء لتحديث القائمة.
    // (يمكن تعديل هذا لاحقًا ليناسب متطلبات تحديث UI الدقيقة)
    return agentId; // نرجع المعرف فقط
  }
);

// إنشاء slice الوكلاء
const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    // يمكن إضافة reducers أخرى هنا إذا لزم الأمر للتعامل مع تحديثات الحالة المحلية غير المتزامنة
  },
  extraReducers: (builder) => {
    builder
      // حالات fetchAgents
      .addCase(fetchAgents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAgents.fulfilled, (state, action: PayloadAction<AgentWithDetails[] | null>) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ? (action.payload as string) : 'فشل جلب الوكلاء';
      })
      // حالات createAgent
      .addCase(createAgent.pending, (state) => {
        state.status = 'loading'; // يمكن أن يكون هناك حالة تحميل منفصلة لعملية الإنشاء
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        // بعد إنشاء الوكيل، نقوم بإعادة جلب القائمة لتحديثها.
        // في تطبيق حقيقي، قد تفضل إضافة الوكيل الجديد مباشرة إلى الحالة إذا كانت لديك بياناته الكاملة.
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ? (action.payload as string) : 'فشل إنشاء وكيل جديد';
      });
  },
});

export default agentsSlice.reducer; 