import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groupsApi, AdminGroup, GroupData, GroupResponse, GroupsListResponse } from '@/services/groupsApi';
import { Admin } from '@/domains/admins/types';
import { adminsApi } from '@/services/adminsApi'; // Corrected import for adminsApi

// Define a type for the slice state
interface GroupsState {
  groups: AdminGroup[];
  selectedGroup: AdminGroup | null;
  selectedGroupMembers: Admin[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: GroupsState = {
  groups: [],
  selectedGroup: null,
  selectedGroupMembers: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchGroups = createAsyncThunk<
  AdminGroup[], // Changed Returned type to AdminGroup[]
  void,
  { rejectValue: string }
>(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroups();
      return response.groups || []; // Return AdminGroup[] directly
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to fetch groups');
    }
  }
);

export const addGroup = createAsyncThunk<
  AdminGroup, // Changed Returned type to AdminGroup
  GroupData,
  { rejectValue: string }
>(
  'groups/addGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupsApi.addGroup(groupData);
      if (!response.group) {
        throw new Error('Group not returned after creation');
      }
      return response.group; // Return AdminGroup directly
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to add group');
    }
  }
);

export const updateGroup = createAsyncThunk<
  AdminGroup, // Changed Returned type to AdminGroup
  { groupId: string; groupData: GroupData },
  { rejectValue: string }
>(
  'groups/updateGroup',
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.updateGroup(groupId, groupData);
      if (!response.group) {
        throw new Error('Group not returned after update');
      }
      return response.group; // Return AdminGroup directly
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      await groupsApi.deleteGroup(groupId);
      return groupId;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to delete group');
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'groups/fetchGroupMembers',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroupMembers(groupId);
      return response.members || [];
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to fetch group members');
    }
  }
);

export const addGroupMember = createAsyncThunk(
  'groups/addGroupMember',
  async ({ groupId, adminId }: { groupId: string; adminId: string }, { rejectWithValue }) => {
    try {
      await groupsApi.addMemberToGroup(groupId, adminId);
      return { groupId, adminId }; 
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to add group member');
    }
  }
);

export const removeGroupMember = createAsyncThunk(
  'groups/removeGroupMember',
  async ({ groupId, adminId }: { groupId: string; adminId: string }, { rejectWithValue }) => {
    try {
      await groupsApi.removeMemberFromGroup(groupId, adminId);
      return { groupId, adminId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to remove group member');
    }
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setSelectedGroup: (state, action: PayloadAction<AdminGroup | null>) => {
      state.selectedGroup = action.payload;
      state.selectedGroupMembers = []; // Clear members when group changes
    },
    clearGroupsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<AdminGroup[]>) => { // Changed PayloadAction type
        state.loading = false;
        state.groups = action.payload; // Payload is now AdminGroup[] directly
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Group
      .addCase(addGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGroup.fulfilled, (state, action: PayloadAction<AdminGroup>) => { // Changed PayloadAction type
        state.loading = false;
        state.groups.push(action.payload); // Payload is now AdminGroup directly
      })
      .addCase(addGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Group
      .addCase(updateGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action: PayloadAction<AdminGroup>) => { // Changed PayloadAction type
        state.loading = false;
        const updatedGroup = action.payload; // Payload is now AdminGroup directly
        const index = state.groups.findIndex(group => group.id === updatedGroup.id);
        if (index !== -1) {
          state.groups[index] = updatedGroup;
        }
        if (state.selectedGroup?.id === updatedGroup.id) {
            state.selectedGroup = updatedGroup;
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Group
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.groups = state.groups.filter(group => group.id !== action.payload);
        if (state.selectedGroup?.id === action.payload) {
          state.selectedGroup = null;
          state.selectedGroupMembers = [];
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Group Members
      .addCase(fetchGroupMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action: PayloadAction<Admin[]>) => {
        state.loading = false;
        state.selectedGroupMembers = action.payload; // This now directly returns Admin[]
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Group Member
      .addCase(addGroupMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGroupMember.fulfilled, (state, action) => {
        state.loading = false;
        // The UI will refetch members after success, so no direct state manipulation here
      })
      .addCase(addGroupMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove Group Member
      .addCase(removeGroupMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        state.loading = false;
        // The UI will refetch members after success, so no direct state manipulation here
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedGroup, clearGroupsError } = groupsSlice.actions;

export default groupsSlice.reducer; 