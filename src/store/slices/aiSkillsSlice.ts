import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchAISkills, createAISkill, updateAISkill, deleteAISkill, AISkill, AISkillCreatePayload } from '@/services/aiSkillsApi';

interface AISkillsState {
  skills: AISkill[];
  loading: boolean;
  error: string | null;
}

const initialState: AISkillsState = {
  skills: [],
  loading: false,
  error: null,
};

export const getSkills = createAsyncThunk('aiSkills/getSkills', async (_, { rejectWithValue }) => {
  try {
    return await fetchAISkills();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || error.message);
  }
});

export const addSkill = createAsyncThunk('aiSkills/addSkill', async (data: AISkillCreatePayload, { rejectWithValue }) => {
  try {
    return await createAISkill(data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || error.message);
  }
});

export const updateSkill = createAsyncThunk('aiSkills/updateSkill', async ({ id, data }: { id: string; data: AISkillCreatePayload }, { rejectWithValue }) => {
  try {
    return await updateAISkill(id, data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || error.message);
  }
});

export const removeSkill = createAsyncThunk('aiSkills/removeSkill', async (id: string, { rejectWithValue }) => {
  try {
    await deleteAISkill(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || error.message);
  }
});

const aiSkillsSlice = createSlice({
  name: 'aiSkills',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSkills.fulfilled, (state, action: PayloadAction<AISkill[]>) => {
        state.loading = false;
        state.skills = action.payload;
      })
      .addCase(getSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addSkill.fulfilled, (state, action: PayloadAction<AISkill>) => {
        state.skills.unshift(action.payload);
      })
      .addCase(updateSkill.fulfilled, (state, action: PayloadAction<AISkill>) => {
        const index = state.skills.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.skills[index] = action.payload;
        }
      })
      .addCase(removeSkill.fulfilled, (state, action: PayloadAction<string>) => {
        state.skills = state.skills.filter((s) => s.id !== action.payload);
      });
  },
});

export default aiSkillsSlice.reducer;
