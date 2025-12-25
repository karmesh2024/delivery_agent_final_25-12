import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import purchasingService from '../services/purchasingService';
import {
  CreatePurchaseInvoiceInput,
  PurchaseInvoice,
  PurchaseInvoiceFilters,
  PurchaseInvoiceStatus,
  UpdatePurchaseInvoiceStatusPayload,
} from '../types';

interface PurchasingState {
  invoices: PurchaseInvoice[];
  loading: boolean;
  error?: string | null;
  filters: PurchaseInvoiceFilters;
}

const initialState: PurchasingState = {
  invoices: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    supplierId: undefined,
    search: '',
  },
};

export const fetchPurchaseInvoices = createAsyncThunk(
  'purchasing/fetchInvoices',
  async (filters?: Partial<PurchaseInvoiceFilters>, { rejectWithValue, getState }) => {
    try {
      // Get token from state
      const state = getState() as RootState;
      const token = state.auth?.token || null;
      const data = await purchasingService.fetchInvoices(filters, token);
      return data.invoices;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب فواتير المشتريات');
    }
  }
);

export const createPurchaseInvoice = createAsyncThunk(
  'purchasing/createInvoice',
  async (payload: CreatePurchaseInvoiceInput, { rejectWithValue, getState }) => {
    try {
      // Get token from state
      const state = getState() as RootState;
      const token = state.auth?.token || null;
      return await purchasingService.createInvoice(payload, token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إنشاء فاتورة المشتريات');
    }
  }
);

export const updatePurchaseInvoiceStatus = createAsyncThunk(
  'purchasing/updateInvoiceStatus',
  async ({ invoiceId, status }: UpdatePurchaseInvoiceStatusPayload, { rejectWithValue, getState }) => {
    try {
      // Get token from state
      const state = getState() as RootState;
      const token = state.auth?.token || null;
      return await purchasingService.updateInvoiceStatus(invoiceId, status, token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في تحديث حالة الفاتورة');
    }
  }
);

const purchasingSlice = createSlice({
  name: 'purchasing',
  initialState,
  reducers: {
    setPurchasingFilters(state, action: PayloadAction<Partial<PurchaseInvoiceFilters>>) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action: PayloadAction<PurchaseInvoice[]>) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'تعذر تحميل الفواتير';
      })
      .addCase(createPurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseInvoice.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false;
        state.invoices = [action.payload, ...state.invoices];
      })
      .addCase(createPurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'تعذر إنشاء الفاتورة';
      })
      .addCase(updatePurchaseInvoiceStatus.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.invoices = state.invoices.map((invoice) =>
          invoice.id === action.payload.id ? action.payload : invoice
        );
      });
  },
});

export const { setPurchasingFilters } = purchasingSlice.actions;
export default purchasingSlice.reducer;


