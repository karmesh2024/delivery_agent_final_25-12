import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SupplierPriceOffer } from '../types'; // تأكد من أن هذا المسار صحيح لنوع بياناتك

// تعريف الحالة الأولية
interface PriceOfferState {
  priceOffers: SupplierPriceOffer[];
  loading: boolean;
  error: string | null;
}

const initialState: PriceOfferState = {
  priceOffers: [],
  loading: false,
  error: null,
};

// Async Thunks
// استجلاب عروض الأسعار
export const fetchPriceOffers = createAsyncThunk(
  'priceOffer/fetchPriceOffers',
  async (supplierId: string, { rejectWithValue }) => {
    try {
      // هنا يجب أن تقوم باستدعاء API الخاص بك لجلب عروض الأسعار
      // مثال افتراضي:
      const response = await fetch(`/api/suppliers/${supplierId}/price-offers`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في جلب عروض الأسعار');
      }
      const data: SupplierPriceOffer[] = await response.json();
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// تحديث عرض سعر
export const updatePriceOffer = createAsyncThunk(
  'priceOffer/updatePriceOffer',
  async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }, { rejectWithValue }) => {
    try {
      // هنا يجب أن تقوم باستدعاء API الخاص بك لتحديث عرض السعر
      // مثال افتراضي:
      const response = await fetch(`/api/price-offers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تحديث عرض السعر');
      }
      const data: SupplierPriceOffer = await response.json();
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// إضافة عرض سعر جديد
export const addPriceOffer = createAsyncThunk(
  'priceOffer/addPriceOffer',
  async (newOffer: Omit<SupplierPriceOffer, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/price-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOffer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة عرض السعر');
      }

      const data: SupplierPriceOffer = await response.json();
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const priceOfferSlice = createSlice({
  name: 'priceOffer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceOffers.fulfilled, (state, action: PayloadAction<SupplierPriceOffer[]>) => {
        state.loading = false;
        state.priceOffers = action.payload;
      })
      .addCase(fetchPriceOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePriceOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePriceOffer.fulfilled, (state, action: PayloadAction<SupplierPriceOffer>) => {
        state.loading = false;
        const index = state.priceOffers.findIndex((offer) => offer.id === action.payload.id);
        if (index !== -1) {
          state.priceOffers[index] = action.payload;
        }
      })
      .addCase(updatePriceOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addPriceOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPriceOffer.fulfilled, (state, action: PayloadAction<SupplierPriceOffer>) => {
        state.loading = false;
        state.priceOffers.push(action.payload);
      })
      .addCase(addPriceOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default priceOfferSlice.reducer; 