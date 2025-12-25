import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SystemAlert, alertService } from '../services/alertService';

// تعريف حالة التنبيهات
interface AlertState {
  alerts: SystemAlert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

// الحالة المبدئية للتنبيهات
const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// thunks للعمليات غير المتزامنة

// جلب جميع التنبيهات
export const fetchAlerts = createAsyncThunk(
  'alert/fetchAll',
  async (includeResolved: boolean = false, { rejectWithValue }) => {
    try {
      const alerts = await alertService.getAll(includeResolved);
      return alerts;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب التنبيهات حسب النوع
export const fetchAlertsByType = createAsyncThunk(
  'alert/fetchByType',
  async ({ 
    type, 
    includeResolved = false 
  }: { 
    type: SystemAlert['alert_type']; 
    includeResolved?: boolean 
  }, { rejectWithValue }) => {
    try {
      const alerts = await alertService.getByType(type, includeResolved);
      return alerts;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// إنشاء تنبيه جديد
export const createAlert = createAsyncThunk(
  'alert/create',
  async (alert: Omit<SystemAlert, 'id' | 'is_read' | 'created_at' | 'resolved_at'>, { rejectWithValue }) => {
    try {
      const newAlert = await alertService.createAlert(alert);
      if (!newAlert) {
        return rejectWithValue('فشل في إنشاء التنبيه');
      }
      return newAlert;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// وضع علامة "مقروء" على التنبيه
export const markAlertAsRead = createAsyncThunk(
  'alert/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const updatedAlert = await alertService.markAsRead(id);
      if (!updatedAlert) {
        return rejectWithValue('فشل في وضع علامة قراءة على التنبيه');
      }
      return updatedAlert;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// وضع علامة "تمت معالجته" على التنبيه
export const resolveAlert = createAsyncThunk(
  'alert/resolve',
  async (id: string, { rejectWithValue }) => {
    try {
      const updatedAlert = await alertService.resolveAlert(id);
      if (!updatedAlert) {
        return rejectWithValue('فشل في وضع علامة معالجة على التنبيه');
      }
      return updatedAlert;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// حذف تنبيه
export const deleteAlert = createAsyncThunk(
  'alert/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await alertService.deleteAlert(id);
      if (!success) {
        return rejectWithValue('فشل في حذف التنبيه');
      }
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// فحص المخزون المنخفض وإنشاء تنبيهات
export const checkLowStockLevels = createAsyncThunk(
  'alert/checkLowStock',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const success = await alertService.checkLowStockLevels();
      if (!success) {
        return rejectWithValue('فشل في فحص مستويات المخزون المنخفضة');
      }
      
      // تحديث قائمة التنبيهات بعد إنشاء تنبيهات جديدة
      dispatch(fetchAlerts(false));
      dispatch(fetchUnreadCount());
      
      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب عدد التنبيهات غير المقروءة
export const fetchUnreadCount = createAsyncThunk(
  'alert/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const count = await alertService.getUnreadCount();
      return count;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// شريحة Redux للتنبيهات
const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    clearAlertError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب جميع التنبيهات
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // جلب التنبيهات حسب النوع
      .addCase(fetchAlertsByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlertsByType.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlertsByType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // إنشاء تنبيه جديد
      .addCase(createAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action: PayloadAction<SystemAlert>) => {
        state.loading = false;
        state.alerts.unshift(action.payload); // إضافة التنبيه الجديد في بداية المصفوفة
        state.unreadCount += 1;
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // وضع علامة "مقروء" على التنبيه
      .addCase(markAlertAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAlertAsRead.fulfilled, (state, action: PayloadAction<SystemAlert>) => {
        state.loading = false;
        const index = state.alerts.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })
      .addCase(markAlertAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // وضع علامة "تمت معالجته" على التنبيه
      .addCase(resolveAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveAlert.fulfilled, (state, action: PayloadAction<SystemAlert>) => {
        state.loading = false;
        const index = state.alerts.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
          if (!state.alerts[index].is_read && state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })
      .addCase(resolveAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // حذف تنبيه
      .addCase(deleteAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const deletedAlert = state.alerts.find(a => a.id === action.payload);
        state.alerts = state.alerts.filter(a => a.id !== action.payload);
        
        // تحديث عدد التنبيهات غير المقروءة إذا تم حذف تنبيه غير مقروء
        if (deletedAlert && !deletedAlert.is_read && state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // فحص المخزون المنخفض
      .addCase(checkLowStockLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkLowStockLevels.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkLowStockLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // جلب عدد التنبيهات غير المقروءة
      .addCase(fetchUnreadCount.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAlertError } = alertSlice.actions;

export default alertSlice.reducer; 