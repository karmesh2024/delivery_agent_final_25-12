/**
 * شريحة Redux لإدارة حالة الإعدادات
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  LoginRecord, 
  SettingsState, 
  UserData, 
  NotificationSettings, 
  ConnectedAccount 
} from '../types';
import { 
  getUserSettings, 
  updateUserProfile, 
  updateProfileImage, 
  updateNotificationSettings, 
  updatePassword, 
  getLoginHistory, 
  updateRegionalSettings, 
  updateAppearanceSettings,
  updateQuietHours
} from '../api/settingsApi';

// الحالة الأولية للإعدادات
const initialState: SettingsState = {
  activeTab: 'profile',
  userData: {
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    profileImage: '',
    language: 'English',
    timeZone: 'GMT+3 (Eastern Europe Time)',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    notificationSettings: {
      email: true,
      push: true,
      sms: false,
      agentUpdates: true,
      orderStatusChanges: true,
      systemAnnouncements: true,
      marketingMessages: false
    }
  },
  loginRecords: [],
  connectedAccounts: [
    { name: 'Google', connected: true },
    { name: 'Microsoft', connected: false },
    { name: 'Slack', connected: true },
    { name: 'GitHub', connected: false }
  ],
  isLoading: false,
  isSaving: false,
  error: null,
  theme: 'light',
  colorAccent: 'blue-500',
  layoutDensity: 'default',
  fontSize: 3,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

// جلب إعدادات المستخدم
export const fetchUserSettings = createAsyncThunk(
  'settings/fetchUserSettings',
  async (userId: string, { rejectWithValue }) => {
    try {
      const userData = await getUserSettings(userId);
      return userData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب إعدادات المستخدم');
    }
  }
);

// تحديث الملف الشخصي للمستخدم
export const updateProfile = createAsyncThunk(
  'settings/updateProfile',
  async ({ userId, profileData }: { userId: string, profileData: Partial<UserData> }, { rejectWithValue }) => {
    try {
      const updatedUser = await updateUserProfile(userId, profileData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث الملف الشخصي');
    }
  }
);

// تحديث صورة الملف الشخصي
export const uploadProfileImage = createAsyncThunk(
  'settings/uploadProfileImage',
  async ({ userId, file }: { userId: string, file: File }, { rejectWithValue }) => {
    try {
      const imageUrl = await updateProfileImage(userId, file);
      return imageUrl;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث صورة الملف الشخصي');
    }
  }
);

// تحديث إعدادات الإشعارات
export const updateUserNotificationSettings = createAsyncThunk(
  'settings/updateNotificationSettings',
  async ({ userId, settings }: { userId: string, settings: NotificationSettings }, { rejectWithValue }) => {
    try {
      await updateNotificationSettings(userId, settings);
      return settings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث إعدادات الإشعارات');
    }
  }
);

// تحديث كلمة المرور
export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async ({ userId, currentPassword, newPassword }: { userId: string, currentPassword: string, newPassword: string }, { rejectWithValue }) => {
    try {
      const success = await updatePassword(userId, currentPassword, newPassword);
      return success;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث كلمة المرور');
    }
  }
);

// جلب سجل تسجيل الدخول
export const fetchLoginHistory = createAsyncThunk(
  'settings/fetchLoginHistory',
  async (userId: string, { rejectWithValue }) => {
    try {
      const loginRecords = await getLoginHistory(userId);
      return loginRecords;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب سجل تسجيل الدخول');
    }
  }
);

// تحديث الإعدادات الإقليمية
export const updateRegional = createAsyncThunk(
  'settings/updateRegional',
  async ({ userId, settings }: { userId: string, settings: Partial<UserData> }, { rejectWithValue }) => {
    try {
      await updateRegionalSettings(userId, settings);
      return settings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث الإعدادات الإقليمية');
    }
  }
);

// تحديث إعدادات المظهر
export const updateAppearance = createAsyncThunk(
  'settings/updateAppearance',
  async ({ 
    userId, 
    theme, 
    colorAccent, 
    layoutDensity, 
    fontSize 
  }: { 
    userId: string, 
    theme: string, 
    colorAccent: string, 
    layoutDensity: string, 
    fontSize: number 
  }, { rejectWithValue }) => {
    try {
      await updateAppearanceSettings(userId, theme, colorAccent, layoutDensity, fontSize);
      return { theme, colorAccent, layoutDensity, fontSize };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث إعدادات المظهر');
    }
  }
);

// تحديث إعدادات الساعات الهادئة
export const updateUserQuietHours = createAsyncThunk(
  'settings/updateQuietHours',
  async ({ userId, startTime, endTime }: { userId: string, startTime: string, endTime: string }, { rejectWithValue }) => {
    try {
      await updateQuietHours(userId, startTime, endTime);
      return { startTime, endTime };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث إعدادات الساعات الهادئة');
    }
  }
);

// إنشاء شريحة الإعدادات
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // تغيير التبويب النشط
    setActiveTab: (state, action: PayloadAction<SettingsState['activeTab']>) => {
      state.activeTab = action.payload;
    },
    // تغيير حالة الحساب المتصل
    toggleConnectedAccount: (state, action: PayloadAction<string>) => {
      const accountName = action.payload;
      const accountIndex = state.connectedAccounts.findIndex(
        account => account.name === accountName
      );
      
      if (accountIndex !== -1) {
        state.connectedAccounts[accountIndex].connected = !state.connectedAccounts[accountIndex].connected;
      }
    },
    // تغيير السمة
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    // تغيير لون التمييز
    setColorAccent: (state, action: PayloadAction<string>) => {
      state.colorAccent = action.payload;
    },
    // تغيير كثافة التخطيط
    setLayoutDensity: (state, action: PayloadAction<string>) => {
      state.layoutDensity = action.payload;
    },
    // تغيير حجم الخط
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    // إعادة تعيين الإعدادات إلى الافتراضية
    resetToDefaults: (state) => {
      state.theme = 'light';
      state.colorAccent = 'blue-500';
      state.layoutDensity = 'default';
      state.fontSize = 3;
      state.userData.notificationSettings = initialState.userData.notificationSettings;
      state.quietHoursStart = '22:00';
      state.quietHoursEnd = '07:00';
    },
    // مسح الخطأ
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // جلب إعدادات المستخدم
    builder
      .addCase(fetchUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.userData = action.payload;
        }
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // تحديث الملف الشخصي
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isSaving = false;
        state.userData = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // تحديث صورة الملف الشخصي
    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isSaving = false;
        state.userData.profileImage = action.payload;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // تحديث إعدادات الإشعارات
    builder
      .addCase(updateUserNotificationSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateUserNotificationSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.userData.notificationSettings = action.payload;
      })
      .addCase(updateUserNotificationSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // تحديث كلمة المرور
    builder
      .addCase(changePassword.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // جلب سجل تسجيل الدخول
    builder
      .addCase(fetchLoginHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoginHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loginRecords = action.payload;
      })
      .addCase(fetchLoginHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // تحديث الإعدادات الإقليمية
    builder
      .addCase(updateRegional.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateRegional.fulfilled, (state, action) => {
        state.isSaving = false;
        state.userData.language = action.payload.language || state.userData.language;
        state.userData.timeZone = action.payload.timeZone || state.userData.timeZone;
        state.userData.dateFormat = action.payload.dateFormat || state.userData.dateFormat;
        state.userData.timeFormat = action.payload.timeFormat || state.userData.timeFormat;
        state.userData.currency = action.payload.currency || state.userData.currency;
      })
      .addCase(updateRegional.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // تحديث إعدادات المظهر
    builder
      .addCase(updateAppearance.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateAppearance.fulfilled, (state, action) => {
        state.isSaving = false;
        state.theme = action.payload.theme;
        state.colorAccent = action.payload.colorAccent;
        state.layoutDensity = action.payload.layoutDensity;
        state.fontSize = action.payload.fontSize;
      })
      .addCase(updateAppearance.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // تحديث إعدادات الساعات الهادئة
    builder
      .addCase(updateUserQuietHours.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateUserQuietHours.fulfilled, (state, action) => {
        state.isSaving = false;
        state.quietHoursStart = action.payload.startTime;
        state.quietHoursEnd = action.payload.endTime;
      })
      .addCase(updateUserQuietHours.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  }
});

// تصدير الإجراءات
export const { 
  setActiveTab, 
  toggleConnectedAccount, 
  setTheme, 
  setColorAccent, 
  setLayoutDensity, 
  setFontSize, 
  resetToDefaults,
  clearError
} = settingsSlice.actions;

// تصدير الشريحة
export default settingsSlice.reducer;