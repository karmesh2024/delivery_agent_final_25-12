import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/authApi'; import { 
  AuthState, 
  AdminCredentials, 
  AdminRegistration, 
  ResetPasswordRequest, 
  UpdatePasswordRequest,
  AuthResult 
} from '../types/auth';
import { Admin } from '../types';

// الحالة الأولية
const initialState: AuthState = {
  isAuthenticated: false,
  currentAdmin: null,
  token: null,
  loading: false,
  error: null,
  resetEmailSent: false
};

// الأحداث (Thunks)
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: AdminCredentials, { rejectWithValue }) => {
    try {
      const result = await authApi.login(credentials);
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل تسجيل الدخول');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (registration: AdminRegistration, { rejectWithValue }) => {
    try {
      const result = await authApi.register(registration);
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل التسجيل');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء التسجيل');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authApi.logout();
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل تسجيل الخروج');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Relying on HttpOnly cookies for authentication status
      // No longer checking localStorage for cached tokens or admin data
      const result = await authApi.checkAuth();
      
      if (!result.success) {
        // If authentication fails, the server (via API route) should handle cookie clearing.
        // No need to clear localStorage here.
        return rejectWithValue(result.error || 'فشل التحقق من المصادقة');
      }
      
      return result;
    } catch (error) {
      // In case of an error, the server should handle cookie clearing.
      // No need to clear localStorage here.
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من المصادقة');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (request: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const result = await authApi.resetPassword(request);
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل طلب إعادة تعيين كلمة المرور');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء طلب إعادة تعيين كلمة المرور');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (request: UpdatePasswordRequest, { rejectWithValue }) => {
    try {
      const result = await authApi.updatePassword(request);
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل تحديث كلمة المرور');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث كلمة المرور');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authApi.refreshToken();
      if (!result.success) {
        return rejectWithValue(result.error || 'فشل تجديد الجلسة');
      }
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء تجديد الجلسة');
    }
  }
);

// شريحة Redux
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearResetEmailSent: (state) => {
      state.resetEmailSent = false;
    },
    setCurrentAdmin: (state, action: PayloadAction<Admin | null>) => {
      state.currentAdmin = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateAdminPermissions: (state, action: PayloadAction<{ permissions: Record<string, boolean> }>) => {
      if (state.currentAdmin) {
        state.currentAdmin.permissions = {
          ...state.currentAdmin.permissions,
          ...action.payload.permissions
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // معالجة تسجيل الدخول
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResult>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentAdmin = action.payload.admin!;
        state.token = action.payload.token!;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.currentAdmin = null;
        state.token = null;
        state.error = action.payload as string;
      })
      
      // معالجة التسجيل
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        // لاحظ: لن نقوم بتسجيل الدخول تلقائيًا بعد التسجيل،
        // لأن المستخدم قد يحتاج إلى تأكيد البريد الإلكتروني
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة تسجيل الخروج
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.currentAdmin = null;
        state.token = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // التحقق من المصادقة
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<AuthResult>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentAdmin = action.payload.admin!;
        state.token = action.payload.token!;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.currentAdmin = null;
        state.token = null;
        state.error = action.payload as string;
      })
      
      // إعادة تعيين كلمة المرور
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetEmailSent = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetEmailSent = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تحديث كلمة المرور
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تجديد JWT
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentAdmin = action.payload.admin!;
        state.token = action.payload.token!;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // عند فشل تجديد الجلسة، نقوم بتسجيل الخروج
        state.isAuthenticated = false;
        state.currentAdmin = null;
        state.token = null;
      });
  }
});

// تصدير الإجراءات
export const { clearError, clearResetEmailSent, setCurrentAdmin, updateAdminPermissions } = authSlice.actions;

// تصدير الشريحة
export default authSlice.reducer;