import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groupsApi, AdminGroup, GroupData } from '@/services/groupsApi';
import { Admin } from '@/domains/admins/types'; // افتراض مسار صحيح

// واجهة لحالة المجموعات في Redux
interface GroupsState {
  groups: AdminGroup[];
  selectedGroup: AdminGroup | null;
  selectedGroupMembers: Admin[];
  loading: boolean;
  error: string | null;
}

// الحالة الأولية
const initialState: GroupsState = {
  groups: [],
  selectedGroup: null,
  selectedGroupMembers: [],
  loading: false,
  error: null,
};

// Thunks لإدارة المجموعات
export const fetchGroups = createAsyncThunk<AdminGroup[]>(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    const response = await groupsApi.getGroups();
    if (response.success && response.groups) {
      return response.groups;
    } else {
      return rejectWithValue(response.message || 'Failed to fetch groups');
    }
  }
);

export const addGroup = createAsyncThunk<AdminGroup, GroupData>(
  'groups/addGroup',
  async (groupData, { rejectWithValue }) => {
    const response = await groupsApi.addGroup(groupData);
    if (response.success && response.group) {
      return response.group;
    } else {
      return rejectWithValue(response.message || 'Failed to add group');
    }
  }
);

export const updateGroup = createAsyncThunk<AdminGroup, { groupId: string; groupData: GroupData }>(
  'groups/updateGroup',
  async ({ groupId, groupData }, { rejectWithValue }) => {
    const response = await groupsApi.updateGroup(groupId, groupData);
    if (response.success && response.group) {
      return response.group;
    } else {
      return rejectWithValue(response.message || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk<string, string>(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    const response = await groupsApi.deleteGroup(groupId);
    if (response.success) {
      return groupId; // إعادة معرف المجموعة المحذوفة للتعامل معها في reducer
    } else {
      return rejectWithValue(response.message || 'Failed to delete group');
    }
  }
);

// Thunks لإدارة أعضاء المجموعات
export const fetchGroupMembers = createAsyncThunk<Admin[], string>(
  'groups/fetchGroupMembers',
  async (groupId, { rejectWithValue }) => {
    const response = await groupsApi.getGroupMembers(groupId);
    if (response.success && response.members) {
      return response.members as Admin[]; // قد يحتاج لتأكيد النوع هنا أيضاً
    } else {
      return rejectWithValue(response.message || 'Failed to fetch members');
    }
  }
);

export const addGroupMember = createAsyncThunk<{ groupId: string; adminId: string }, { groupId: string; adminId: string }>(
  'groups/addGroupMember',
  async ({ groupId, adminId }, { rejectWithValue }) => {
    const response = await groupsApi.addMemberToGroup(groupId, adminId);
    if (response.success) {
      return { groupId, adminId };
    } else {
      return rejectWithValue(response.message || 'Failed to add member');
    }
  }
);

export const removeGroupMember = createAsyncThunk<{ groupId: string; adminId: string }, { groupId: string; adminId: string }>(
  'groups/removeGroupMember',
  async ({ groupId, adminId }, { rejectWithValue }) => {
    const response = await groupsApi.removeMemberFromGroup(groupId, adminId);
    if (response.success) {
      return { groupId, adminId };
    } else {
      return rejectWithValue(response.message || 'Failed to remove member');
    }
  }
);

// إنشاء الشريحة
const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setSelectedGroup: (state, action: PayloadAction<AdminGroup | null>) => {
      state.selectedGroup = action.payload;
      if (!action.payload) {
        state.selectedGroupMembers = []; // مسح الأعضاء عند إلغاء تحديد المجموعة
      }
    },
    clearGroupsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // معالجة fetchGroups
    builder
      .addCase(fetchGroups.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // معالجة addGroup
    builder
      .addCase(addGroup.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
      })
      .addCase(addGroup.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // معالجة updateGroup
    builder
      .addCase(updateGroup.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.groups.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        // تحديث المجموعة المحددة إذا كانت هي التي تم تعديلها
        if (state.selectedGroup?.id === action.payload.id) {
          state.selectedGroup = action.payload;
        }
      })
      .addCase(updateGroup.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // معالجة deleteGroup
    builder
      .addCase(deleteGroup.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = state.groups.filter(g => g.id !== action.payload);
        // إلغاء تحديد المجموعة إذا كانت هي المحذوفة
        if (state.selectedGroup?.id === action.payload) {
          state.selectedGroup = null;
          state.selectedGroupMembers = [];
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // معالجة fetchGroupMembers
    builder
      .addCase(fetchGroupMembers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedGroupMembers = action.payload;
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; state.selectedGroupMembers = []; });
      
    // لا نحتاج عادةً لتحديث حالة الأعضاء عند الإضافة/الحذف هنا
    // يفضل إعادة جلب الأعضاء (dispatch(fetchGroupMembers)) بعد نجاح الإضافة/الحذف في المكون
  }
});

export const { setSelectedGroup, clearGroupsError } = groupsSlice.actions;
export default groupsSlice.reducer; 