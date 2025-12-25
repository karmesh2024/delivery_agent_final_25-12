'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { storeOrdersApi } from '../api/storeOrdersApi';
import { StoreOrder, StoreOrdersFilters, StoreOrderItem } from '../types';

// الحالة الأولية
const initialState: {
  orders: StoreOrder[];
  filteredOrders: StoreOrder[];
  selectedOrder: StoreOrder | null;
  selectedOrderItems: StoreOrderItem[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  filters: StoreOrdersFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
} = {
  orders: [],
  filteredOrders: [],
  selectedOrder: null,
  selectedOrderItems: [],
  loading: 'idle',
  error: null,
  filters: {
    status: 'all',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
};

// Async Thunks

/**
 * جلب جميع طلبات المتاجر
 */
export const fetchStoreOrders = createAsyncThunk(
  'storeOrders/fetchAll',
  async (filters?: StoreOrdersFilters, { rejectWithValue }) => {
    try {
      const orders = await storeOrdersApi.getAllOrders(filters);
      return orders;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في جلب الطلبات'
      );
    }
  }
);

/**
 * جلب طلبات الوكلاء المعتمدين
 */
export const fetchAgentOrders = createAsyncThunk(
  'storeOrders/fetchAgentOrders',
  async (filters?: StoreOrdersFilters, { rejectWithValue }) => {
    try {
      const orders = await storeOrdersApi.getAgentOrders(filters);
      return orders;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في جلب طلبات الوكلاء'
      );
    }
  }
);

/**
 * جلب طلبات المستخدمين
 */
export const fetchUserOrders = createAsyncThunk(
  'storeOrders/fetchUserOrders',
  async (filters?: StoreOrdersFilters, { rejectWithValue }) => {
    try {
      const orders = await storeOrdersApi.getUserOrders(filters);
      return orders;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في جلب طلبات المستخدمين'
      );
    }
  }
);

/**
 * جلب طلب محدد
 */
export const fetchStoreOrderById = createAsyncThunk(
  'storeOrders/fetchById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const order = await storeOrdersApi.getOrderById(orderId);
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      return order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في جلب الطلب'
      );
    }
  }
);

/**
 * جلب عناصر الطلب
 */
export const fetchOrderItems = createAsyncThunk(
  'storeOrders/fetchItems',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const items = await storeOrdersApi.getOrderItems(orderId);
      return items;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في جلب عناصر الطلب'
      );
    }
  }
);

/**
 * تحديث حالة الطلب
 */
export const updateOrderStatus = createAsyncThunk(
  'storeOrders/updateStatus',
  async (
    { orderId, status }: { orderId: string; status: StoreOrder['status'] },
    { rejectWithValue }
  ) => {
    try {
      const order = await storeOrdersApi.updateOrderStatus(orderId, status);
      return order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في تحديث حالة الطلب'
      );
    }
  }
);

/**
 * تحديث حالة الدفع
 */
export const updatePaymentStatus = createAsyncThunk(
  'storeOrders/updatePaymentStatus',
  async (
    {
      orderId,
      paymentStatus,
    }: { orderId: string; paymentStatus: StoreOrder['payment_status'] },
    { rejectWithValue }
  ) => {
    try {
      const order = await storeOrdersApi.updatePaymentStatus(
        orderId,
        paymentStatus
      );
      return order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'فشل في تحديث حالة الدفع'
      );
    }
  }
);

// Redux Slice
const storeOrdersSlice = createSlice({
  name: 'storeOrders',
  initialState,
  reducers: {
    /**
     * تعيين الفلاتر
     */
    setFilters: (state, action: PayloadAction<StoreOrdersFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      applyFilters(state);
    },

    /**
     * إعادة تعيين الفلاتر
     */
    resetFilters: (state) => {
      state.filters = { status: 'all' };
      applyFilters(state);
    },

    /**
     * تعيين الطلب المحدد
     */
    setSelectedOrder: (state, action: PayloadAction<StoreOrder | null>) => {
      state.selectedOrder = action.payload;
      if (!action.payload) {
        state.selectedOrderItems = [];
      }
    },

    /**
     * تعيين صفحة التصفح
     */
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    /**
     * مسح الخطأ
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStoreOrders
      .addCase(fetchStoreOrders.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchStoreOrders.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.orders = action.payload;
        state.pagination.total = action.payload.length;
        applyFilters(state);
      })
      .addCase(fetchStoreOrders.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })

      // fetchAgentOrders
      .addCase(fetchAgentOrders.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchAgentOrders.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.orders = action.payload;
        state.pagination.total = action.payload.length;
        applyFilters(state);
      })
      .addCase(fetchAgentOrders.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })

      // fetchUserOrders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.orders = action.payload;
        state.pagination.total = action.payload.length;
        applyFilters(state);
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })

      // fetchStoreOrderById
      .addCase(fetchStoreOrderById.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchStoreOrderById.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.selectedOrder = action.payload;
      })
      .addCase(fetchStoreOrderById.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })

      // fetchOrderItems
      .addCase(fetchOrderItems.fulfilled, (state, action) => {
        state.selectedOrderItems = action.payload;
      })

      // updateOrderStatus
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        applyFilters(state);
      })

      // updatePaymentStatus
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        applyFilters(state);
      });
  },
});

/**
 * تطبيق الفلاتر على الطلبات
 */
function applyFilters(state: typeof initialState) {
  let filtered = [...state.orders];

  // فلترة حسب الحالة
  if (state.filters.status && state.filters.status !== 'all') {
    filtered = filtered.filter(
      (order) => order.status === state.filters.status
    );
  }

  // فلترة حسب المتجر
  if (state.filters.shop_id) {
    filtered = filtered.filter((order) => order.shop_id === state.filters.shop_id);
  }

  // فلترة حسب حالة الدفع
  if (state.filters.payment_status) {
    filtered = filtered.filter(
      (order) => order.payment_status === state.filters.payment_status
    );
  }

  // فلترة حسب البحث
  if (state.filters.search) {
    const searchTerm = state.filters.search.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchTerm) ||
        (order.shop?.name_ar &&
          order.shop.name_ar.toLowerCase().includes(searchTerm))
    );
  }

  state.filteredOrders = filtered;
  state.pagination.total = filtered.length;
}

export const {
  setFilters,
  resetFilters,
  setSelectedOrder,
  setPage,
  clearError,
} = storeOrdersSlice.actions;

export default storeOrdersSlice.reducer;

