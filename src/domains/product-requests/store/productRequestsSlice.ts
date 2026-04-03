import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { productRequestService } from "../services/productRequestService";
import type {
  ProductRequest,
  ProductRequestCreate,
  ProductRequestUpdate,
} from "../types";

export interface ProductRequestsFilters {
  status: string;
  department: string;
  main_category_id: string;
  sub_category_id: string;
}

interface ProductRequestsState {
  requests: {
    data: ProductRequest[];
    loading: boolean;
    error: string | null;
  };
  selectedRequest: ProductRequest | null;
  filters: ProductRequestsFilters;
}

const initialFilters: ProductRequestsFilters = {
  status: "",
  department: "",
  main_category_id: "",
  sub_category_id: "",
};

const initialState: ProductRequestsState = {
  requests: { data: [], loading: false, error: null },
  selectedRequest: null,
  filters: initialFilters,
};

export const fetchProductRequests = createAsyncThunk(
  "productRequests/fetchList",
  async (
    params?: {
      status?: string;
      department?: string;
      main_category_id?: number;
      sub_category_id?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const list = await productRequestService.getList(params);
      return list;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const fetchProductRequestById = createAsyncThunk(
  "productRequests/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const item = await productRequestService.getById(id);
      if (!item) return rejectWithValue("الطلب غير موجود");
      return item;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const createProductRequest = createAsyncThunk(
  "productRequests/create",
  async (
    { payload, userId }: { payload: ProductRequestCreate; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const created = await productRequestService.create(payload, userId);
      if (!created) return rejectWithValue("فشل إنشاء الطلب");
      return created;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const updateProductRequest = createAsyncThunk(
  "productRequests/update",
  async (
    { id, payload }: { id: string; payload: ProductRequestUpdate },
    { rejectWithValue }
  ) => {
    try {
      const updated = await productRequestService.update(id, payload);
      if (!updated) return rejectWithValue("فشل تحديث الطلب");
      return updated;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const approveProductRequest = createAsyncThunk(
  "productRequests/approve",
  async (
    { id, userId, notes }: { id: string; userId: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const updated = await productRequestService.approve(id, userId, notes);
      if (!updated) return rejectWithValue("فشل الموافقة على الطلب");
      return updated;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const rejectProductRequest = createAsyncThunk(
  "productRequests/reject",
  async (
    {
      id,
      userId,
      reason,
      notes,
    }: { id: string; userId: string; reason: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const updated = await productRequestService.reject(
        id,
        userId,
        reason,
        notes
      );
      if (!updated) return rejectWithValue("فشل رفض الطلب");
      return updated;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const requestRevisionProductRequest = createAsyncThunk(
  "productRequests/requestRevision",
  async (
    { id, userId, notes }: { id: string; userId: string; notes: string },
    { rejectWithValue }
  ) => {
    try {
      const updated = await productRequestService.requestRevision(
        id,
        userId,
        notes
      );
      if (!updated) return rejectWithValue("فشل طلب التعديل");
      return updated;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

const productRequestsSlice = createSlice({
  name: "productRequests",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductRequestsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedRequest: (state, action: PayloadAction<ProductRequest | null>) => {
      state.selectedRequest = action.payload;
    },
    clearProductRequestsError: (state) => {
      state.requests.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductRequests.pending, (state) => {
        state.requests.loading = true;
        state.requests.error = null;
      })
      .addCase(fetchProductRequests.fulfilled, (state, action) => {
        state.requests.loading = false;
        state.requests.data = action.payload;
      })
      .addCase(fetchProductRequests.rejected, (state, action) => {
        state.requests.loading = false;
        state.requests.error = (action.payload as string) ?? null;
      })
      .addCase(fetchProductRequestById.fulfilled, (state, action) => {
        state.selectedRequest = action.payload;
      })
      .addCase(createProductRequest.fulfilled, (state, action) => {
        state.requests.data = [action.payload, ...state.requests.data];
      })
      .addCase(updateProductRequest.fulfilled, (state, action) => {
        const idx = state.requests.data.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.requests.data[idx] = action.payload;
        if (state.selectedRequest?.id === action.payload.id) {
          state.selectedRequest = action.payload;
        }
      })
      .addCase(approveProductRequest.fulfilled, (state, action) => {
        const idx = state.requests.data.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.requests.data[idx] = action.payload;
        if (state.selectedRequest?.id === action.payload.id) {
          state.selectedRequest = action.payload;
        }
      })
      .addCase(rejectProductRequest.fulfilled, (state, action) => {
        const idx = state.requests.data.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.requests.data[idx] = action.payload;
        if (state.selectedRequest?.id === action.payload.id) {
          state.selectedRequest = action.payload;
        }
      })
      .addCase(requestRevisionProductRequest.fulfilled, (state, action) => {
        const idx = state.requests.data.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.requests.data[idx] = action.payload;
        if (state.selectedRequest?.id === action.payload.id) {
          state.selectedRequest = action.payload;
        }
      });
  },
});

export const {
  setFilters,
  setSelectedRequest,
  clearProductRequestsError,
} = productRequestsSlice.actions;
export default productRequestsSlice.reducer;
