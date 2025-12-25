import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { permissionsApi } from '../api/permissionsApi';
import { 
  AuthState, 
  AdminCredentials, 
  AdminRegistration, 
  ResetPasswordRequest, 
  UpdatePasswordRequest,
  AuthResult
} from '../types/auth';
import { Admin, AdminPermissions } from '../types';
import { 
  ExtendedPermissions, 
  ScopedPermissions,
  toExtendedPermissions, 
  fromRawJsonbPermissions,
  addPermission,
  addScopedPermission
} from '../types/permissions';

// واجهة لإدخال التحقق من الصلاحيات
interface PermissionCheckInput {
  permissionCode: string;
  // Scope details are likely handled by a separate API/RPC call if needed
  // Or integrated into a single enhanced check call
}

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
      if (!result.success || !result.admin) {
        const errorMessage = typeof result.error === 'string'
            ? result.error
            : 'فشل تسجيل الدخول: خطأ غير معروف'; // Default if error is undefined
        return rejectWithValue(errorMessage);
      }

      const admin = result.admin;
      let finalPermissions: AdminPermissions = admin.permissions || {}; // Start with admin's direct permissions (if any)

      if (admin.role_id) {
        try {
          // Fetch the role data, which returns { data, error }
          const roleResult = await permissionsApi.getRoleById(admin.role_id);

          // Check if role fetch was successful and data exists
          if (roleResult.data && !roleResult.error) {
             const rolePermissions = roleResult.data.role_permissions; // Access role_permissions instead of permissions
             if (rolePermissions) {
                 // Merge role permissions with direct permissions (direct takes precedence)
                 finalPermissions = {
                    ...Object.fromEntries(
                      Object.entries(rolePermissions)
                        .filter(([_, value]) => 
                          typeof value === 'boolean' || 
                          value === undefined ||
                          (typeof value === 'object' && 
                           !Array.isArray(value) &&
                           'scoped_permissions' in value)
                        )
                    ),
                    ...(admin.permissions || {})
                 } as AdminPermissions;
             }
          } else if (roleResult.error) {
             // Log error if fetching role failed, but continue with direct permissions
             console.error(`فشل جلب صلاحيات الدور ${admin.role_id}:`, roleResult.error.message);
          }
          // If roleResult.data is null but no error, it means role wasn't found - proceed with direct permissions

        } catch (roleFetchException) {
          // Catch unexpected errors during the API call itself
          console.error(`استثناء أثناء جلب الدور ${admin.role_id}:`, roleFetchException);
          // Continue with direct permissions
        }
      }
      
      const updatedAdmin = { ...admin, permissions: finalPermissions };
      return { ...result, admin: updatedAdmin }; 

    } catch (error) {
      // Catch errors from authApi.login or other unexpected issues
      console.error("خطأ غير متوقع في عملية تسجيل الدخول:", error);
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تسجيل الدخول');
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
      const result = await authApi.checkAuth();
      if (!result.success || !result.admin) {
        return rejectWithValue('No active session'); 
      }
      
      const admin = result.admin;
      let finalPermissions: AdminPermissions = admin.permissions || {};

      if (admin.role_id) {
        try {
          const roleResult = await permissionsApi.getRoleById(admin.role_id);

          // Check if role fetch was successful and data exists
          if (roleResult.data && !roleResult.error) {
            const rolePermissions = roleResult.data.permissions; // Access permissions from roleResult.data
            if (rolePermissions) {
                 finalPermissions = { 
                    ...(rolePermissions), 
                    ...(admin.permissions || {})
                 };
            }
          } else if (roleResult.error) {
             console.error(`فشل جلب صلاحيات الدور ${admin.role_id} أثناء checkAuth:`, roleResult.error.message);
          }

        } catch (roleFetchException) {
          console.error(`استثناء أثناء جلب الدور ${admin.role_id} في checkAuth:`, roleFetchException);
        }
      }
      
      const updatedAdmin = { ...admin, permissions: finalPermissions };
      return { ...result, admin: updatedAdmin };

    } catch (error) {
       console.error("خطأ غير متوقع في عملية checkAuth:", error);
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

// التحقق من صلاحية (نسخة مبسطة تعتمد دائماً على الخادم)
export const checkPermission = createAsyncThunk<
  { hasPermission: boolean }, // Return type
  string, // Argument type (permissionCode)
  { rejectValue: string; state: { auth: AuthState } } // ThunkApiConfig
>(
  'auth/checkPermission',
  async (permissionCode, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { currentAdmin } = state.auth;
      
      if (!currentAdmin || !currentAdmin.id) {
        // It's better to return false than reject if user is not logged in
        // Or let the UI handle the non-authenticated state
        return { hasPermission: false }; 
      }
      
      // استدعاء API للتحقق من الصلاحية من الخادم
      // Assuming authApi.hasPermission calls the correct RPC (check_admin_permission_enhanced)
      const result = await authApi.hasPermission(currentAdmin.id, permissionCode);
      return { hasPermission: result };

    } catch (error) {
      // Log the error for debugging
      console.error("Error in checkPermission thunk:", error);
      // Return a consistent shape on error, indicating permission denied
      return rejectWithValue(error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من الصلاحية');
    }
  }
);

// شريحة Redux
export const integratedAuthSlice = createSlice({
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
      // Note: Permissions should ideally be refetched or checked via API 
      // rather than relying solely on this initial set.
    },
    /*
    // --- DEPRECATED REDUCER --- 
    // This reducer manages the deprecated JSONB permissions structure directly in the state.
    // With the role-based system and server-side checks (hasPermission), 
    // modifying permissions directly in the client state is error-prone and likely unnecessary.
    // If admin details (like role) are updated, refetching the user via checkAuth 
    // or updating currentAdmin with fresh data from the API response is preferred.
    updateAdminPermissions: (state, action: PayloadAction<{ 
      permissions: Record<string, boolean>;
      scopedPermissions?: Record<string, Record<string, string[]>>;
    }>) => {
      if (state.currentAdmin) {
        // تحويل الصلاحيات الحالية إلى نظام الصلاحيات الموسع
        const currentPerms = fromRawJsonbPermissions(state.currentAdmin.permissions || {});
        
        // إنشاء نسخة عميقة لتجنب التعديل المباشر على الحالة
        let extendedPermissions: ExtendedPermissions = {
          permissions: { ...currentPerms.permissions }
        };
        
        if (currentPerms.scoped_permissions) {
          extendedPermissions.scoped_permissions = { ...currentPerms.scoped_permissions };
        }
        
        // إضافة/تحديث الصلاحيات العامة
        Object.entries(action.payload.permissions).forEach(([key, value]) => {
          extendedPermissions = addPermission(extendedPermissions, key, value);
        });
        
        // إضافة/تحديث صلاحيات النطاق إذا تم توفيرها
        if (action.payload.scopedPermissions) {
          // التكرار على كل نوع نطاق
          Object.entries(action.payload.scopedPermissions).forEach(([scopeType, permissions]) => {
            // التكرار على كل صلاحية في النطاق
            Object.entries(permissions).forEach(([permCode, scopeValues]) => {
              // إضافة كل قيمة نطاق للصلاحية
              scopeValues.forEach(scopeValue => {
                extendedPermissions = addScopedPermission(
                  extendedPermissions, 
                  permCode, 
                  scopeType, 
                  scopeValue
                );
              });
            });
          });
        }
        
        // تحويل إلى الصيغة المناسبة لتخزينها في كائن Admin
        // استخدام type assertion للتغلب على فحص النوع
        state.currentAdmin.permissions = {
          ...extendedPermissions.permissions,
          ...(extendedPermissions.scoped_permissions ? { scoped_permissions: extendedPermissions.scoped_permissions } : {})
        } as unknown as AdminPermissions;
      }
    }
    */
  },
  extraReducers: (builder) => {
    builder
      // معالجة تسجيل الدخول
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentAdmin = action.payload.admin!;
        state.token = action.payload.token!;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
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
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentAdmin = action.payload.admin!;
        state.token = action.payload.token!;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.currentAdmin = null;
        state.token = null;
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
      });
  }
});

// تصدير الإجراءات (Remove updateAdminPermissions from exports)
export const { 
  clearError, 
  clearResetEmailSent, 
  setCurrentAdmin, 
  // updateAdminPermissions // Removed deprecated action
} = integratedAuthSlice.actions;

// تصدير الشريحة
export default integratedAuthSlice.reducer;