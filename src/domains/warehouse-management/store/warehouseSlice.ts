import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Warehouse, warehouseService } from '../services/warehouseService';
import { WarehouseInventory, inventoryService } from '../services/inventoryService';

// تعريف حالة المخازن
interface WarehouseState {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  inventory: WarehouseInventory[];
  loading: boolean;
  error: string | null;
}

// الحالة المبدئية للمخازن
const initialState: WarehouseState = {
  warehouses: [],
  currentWarehouse: null,
  inventory: [],
  loading: false,
  error: null,
};

// thunks للعمليات غير المتزامنة

// جلب جميع المخازن
export const fetchWarehouses = createAsyncThunk(
  'warehouse/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const warehouses = await warehouseService.getAll();
      return warehouses;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب مخزن بواسطة المعرف
export const fetchWarehouseById = createAsyncThunk(
  'warehouse/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const warehouse = await warehouseService.getById(id);
      if (!warehouse) {
        return rejectWithValue('المخزن غير موجود');
      }
      return warehouse;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// إضافة مخزن جديد
export const addWarehouse = createAsyncThunk(
  'warehouse/add',
  async (warehouse: Omit<Warehouse, 'id'>, { rejectWithValue }) => {
    try {
      const newWarehouse = await warehouseService.add(warehouse);
      if (!newWarehouse) {
        return rejectWithValue('فشل في إضافة المخزن');
      }
      return newWarehouse;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// تحديث مخزن موجود
export const updateWarehouse = createAsyncThunk(
  'warehouse/update',
  async ({ id, warehouse }: { id: number; warehouse: Partial<Warehouse> }, { rejectWithValue }) => {
    try {
      const updatedWarehouse = await warehouseService.update(id, warehouse);
      if (!updatedWarehouse) {
        return rejectWithValue('فشل في تحديث المخزن');
      }
      return updatedWarehouse;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// حذف مخزن
export const deleteWarehouse = createAsyncThunk(
  'warehouse/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const success = await warehouseService.delete(id);
      if (!success) {
        return rejectWithValue('فشل في حذف المخزن');
      }
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب مخزون المخزن
export const fetchWarehouseInventory = createAsyncThunk(
  'warehouse/fetchInventory',
  async (warehouseId: number, { rejectWithValue }) => {
    try {
      const inventory = await inventoryService.getByWarehouseId(warehouseId);
      return inventory;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// شريحة Redux للمخازن
const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    clearCurrentWarehouse: (state) => {
      state.currentWarehouse = null;
    },
    clearWarehouseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // المخازن
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.warehouses = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // مخزن محدد
      .addCase(fetchWarehouseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWarehouse = action.payload;
      })
      .addCase(fetchWarehouseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // إضافة مخزن
      .addCase(addWarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWarehouse.fulfilled, (state, action: PayloadAction<Warehouse>) => {
        state.loading = false;
        state.warehouses.push(action.payload);
        state.currentWarehouse = action.payload;
      })
      .addCase(addWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تحديث مخزن
      .addCase(updateWarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWarehouse.fulfilled, (state, action: PayloadAction<Warehouse>) => {
        state.loading = false;
        const index = state.warehouses.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.warehouses[index] = action.payload;
        }
        state.currentWarehouse = action.payload;
      })
      .addCase(updateWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // حذف مخزن
      .addCase(deleteWarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.warehouses = state.warehouses.filter(w => w.id !== action.payload);
        if (state.currentWarehouse && state.currentWarehouse.id === action.payload) {
          state.currentWarehouse = null;
        }
      })
      .addCase(deleteWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // مخزون المخزن
      .addCase(fetchWarehouseInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseInventory.fulfilled, (state, action: PayloadAction<WarehouseInventory[]>) => {
        state.loading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchWarehouseInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentWarehouse, clearWarehouseError } = warehouseSlice.actions;

export default warehouseSlice.reducer; 