import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ordersApi } from '@/services/ordersApi';
import { DeliveryOrder } from '@/types';

// تعريف نوع حالة الطلبات
interface OrdersState {
  items: DeliveryOrder[];
  filteredItems: DeliveryOrder[];
  selectedOrder: DeliveryOrder | null;
  activeFilter: string;
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

// الحالة الأولية
const initialState: OrdersState = {
  items: [],
  filteredItems: [],
  selectedOrder: null,
  activeFilter: 'all',
  searchTerm: '',
  loading: false,
  error: null
};

// إجراءات غير متزامنة (Async Thunks)

/**
 * إجراء غير متزامن لجلب جميع الطلبات
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await ordersApi.getAll();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب الطلبات');
    }
  }
);

/**
 * إجراء غير متزامن لجلب طلب محدد
 */
export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await ordersApi.getById(id);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في جلب الطلب');
    }
  }
);

/**
 * إجراء غير متزامن لتحديث حالة طلب
 */
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      return await ordersApi.updateStatus(id, status);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تحديث حالة الطلب');
    }
  }
);

/**
 * إجراء غير متزامن لتعيين مندوب لطلب
 */
export const assignAgent = createAsyncThunk(
  'orders/assignAgent',
  async ({ orderId, agentId }: { orderId: string; agentId: string }, { rejectWithValue }) => {
    try {
      return await ordersApi.assignAgent(orderId, agentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في تعيين المندوب للطلب');
    }
  }
);

// شريحة Redux للطلبات
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // تعيين الفلتر النشط
    setActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilter = action.payload;
      // تطبيق الفلترة
      applyFilters(state);
    },
    
    // تعيين مصطلح البحث
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      // تطبيق الفلترة
      applyFilters(state);
    },
    
    // اختيار طلب
    selectOrder: (state, action: PayloadAction<DeliveryOrder | null>) => {
      state.selectedOrder = action.payload;
    },
    
    // إعادة تعيين الفلاتر
    resetFilters: (state) => {
      state.activeFilter = 'all';
      state.searchTerm = '';
      applyFilters(state);
    }
  },
  extraReducers: (builder) => {
    // التعامل مع fetchOrders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // تطبيق الفلترة على النتائج الجديدة
        applyFilters(state);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // التعامل مع fetchOrderById
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // التعامل مع updateOrderStatus
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (action.payload) {
          // تحديث الطلب في القائمة
          const index = state.items.findIndex(item => item.id === action.payload?.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
          
          // تحديث الطلب المحدد إذا كان هو نفسه
          if (state.selectedOrder?.id === action.payload.id) {
            state.selectedOrder = action.payload;
          }
          
          // تطبيق الفلترة
          applyFilters(state);
        }
      })
      
      // التعامل مع assignAgent
      .addCase(assignAgent.fulfilled, (state, action) => {
        if (action.payload) {
          // تحديث الطلب في القائمة
          const index = state.items.findIndex(item => item.id === action.payload?.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
          
          // تحديث الطلب المحدد إذا كان هو نفسه
          if (state.selectedOrder?.id === action.payload.id) {
            state.selectedOrder = action.payload;
          }
          
          // تطبيق الفلترة
          applyFilters(state);
        }
      });
  }
});

// وظيفة مساعدة لتطبيق الفلاتر على الطلبات
function applyFilters(state: OrdersState) {
  let result = [...state.items];
  
  // فلترة حسب الحالة
  if (state.activeFilter !== 'all') {
    result = result.filter(order => order.status === state.activeFilter);
  }
  
  // فلترة حسب البحث
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    result = result.filter(
      order => 
        order.order_number?.toLowerCase().includes(term) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(term)) ||
        order.pickup_address?.toLowerCase().includes(term) ||
        order.delivery_address?.toLowerCase().includes(term)
    );
  }
  
  state.filteredItems = result;
}

// تصدير الإجراءات والمخفض
export const { setActiveFilter, setSearchTerm, selectOrder, resetFilters } = ordersSlice.actions;
export default ordersSlice.reducer;