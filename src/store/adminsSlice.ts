import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminsApi } from '@/services/adminsApi';
import { Admin, CreateAdminDto } from '@/domains/admins/types';

// تعريف نوع الحالة
interface AdminsState {
  items: Admin[];
  loading: boolean;
  error: string | null;
  selectedAdmin: Admin | null;
  roles: { id: string; name: string }[];
}

const initialState: AdminsState = {
  items: [],
  loading: false,
  error: null,
  selectedAdmin: null,
  roles: [],
};

// الأحداث (Thunks)
export const fetchAdmins = createAsyncThunk(
  'admins/fetchAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminsApi.getAdmins();
      return data;
    } catch (error) {
      console.error("Error fetching admins:", error);
      return rejectWithValue(error instanceof Error ? error.message : 'فشل جلب المسؤولين');
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'admins/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminsApi.getRoles();
      return data;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return rejectWithValue(error instanceof Error ? error.message : 'فشل جلب الأدوار');
    }
  }
);

export const getAdminById = createAsyncThunk(
  'admins/getAdminById',
  async (adminId: string, { rejectWithValue }) => {
    try {
      const admin = await adminsApi.getAdminById(adminId);
      return admin;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب بيانات المسؤول');
    }
  }
);

export const createAdmin = createAsyncThunk(
  'admins/createAdmin',
  async (adminData: CreateAdminDto, { rejectWithValue }) => {
    try {
      const newAdmin = await adminsApi.createAdmin(adminData);
      return newAdmin;
    } catch (error) {
      console.error("Error creating admin:", error);
      return rejectWithValue(error instanceof Error ? error.message : 'فشل إنشاء المسؤول');
    }
  }
);

export const updateAdmin = createAsyncThunk(
  'admins/updateAdmin',
  async ({ adminId, adminData }: { adminId: string, adminData: Partial<Admin> }, { rejectWithValue }) => {
    try {
      const admin = await adminsApi.updateAdmin(adminId, adminData);
      return admin;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث بيانات المسؤول');
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  'admins/deleteAdmin',
  async (adminId: string, { rejectWithValue }) => {
    try {
      await adminsApi.deleteAdmin(adminId);
      return adminId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المسؤول');
    }
  }
);

// شريحة Redux
const adminsSlice = createSlice({
  name: 'admins',
  initialState,
  reducers: {
    setAdmins(state, action: PayloadAction<Admin[]>) {
      state.items = action.payload;
    },
    setSelectedAdmin(state, action: PayloadAction<Admin | null>) {
      state.selectedAdmin = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedAdmin: (state) => {
      state.selectedAdmin = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // معالجة جلب المسؤولين
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة جلب مسؤول بواسطة المعرف
      .addCase(getAdminById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAdmin = action.payload;
      })
      .addCase(getAdminById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedAdmin = null;
      })
      
      // معالجة إنشاء مسؤول جديد
      .addCase(createAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة تحديث مسؤول
      .addCase(updateAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(admin => admin.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedAdmin?.id === action.payload.id) {
          state.selectedAdmin = action.payload;
        }
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة حذف مسؤول
      .addCase(deleteAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(admin => admin.id !== action.payload);
        if (state.selectedAdmin?.id === action.payload) {
          state.selectedAdmin = null;
        }
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // معالجة جلب الأدوار
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// تصدير الأفعال
export const { setAdmins, setSelectedAdmin, clearError, clearSelectedAdmin } = adminsSlice.actions;

// تصدير reducer
export default adminsSlice.reducer; 