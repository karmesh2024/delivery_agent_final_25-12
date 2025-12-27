import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { exchangeService, StockExchange } from "../services/exchangeService";

// تعريف حالة البورصة
interface ExchangeState {
  prices: StockExchange[];
  currentProduct: StockExchange | null;
  loading: boolean;
  error: string | null;
  lastUpdateTime: string | null;
}

// الحالة المبدئية للبورصة
const initialState: ExchangeState = {
  prices: [],
  currentProduct: null,
  loading: false,
  error: null,
  lastUpdateTime: null,
};

// thunks للعمليات غير المتزامنة

// جلب جميع أسعار البورصة
export const fetchPrices = createAsyncThunk(
  "exchange/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const prices = await exchangeService.getAllPrices();
      return prices;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// جلب سعر منتج محدد في البورصة
export const fetchPriceByProductId = createAsyncThunk(
  "exchange/fetchByProductId",
  async (productId: string, { rejectWithValue }) => {
    try {
      const price = await exchangeService.getPriceByProductId(productId);
      if (!price) {
        return rejectWithValue("المنتج غير موجود في البورصة");
      }
      return price;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// إضافة منتج جديد للبورصة
export const addProductToExchange = createAsyncThunk(
  "exchange/addProduct",
  async (product: Omit<StockExchange, "id">, { rejectWithValue }) => {
    try {
      const newProduct = await exchangeService.addProductToExchange(product);
      if (!newProduct) {
        return rejectWithValue("فشل في إضافة المنتج للبورصة");
      }
      return newProduct;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// تحديث منتج موجود في البورصة
export const updateExchangeProduct = createAsyncThunk(
  "exchange/updateProduct",
  async (
    { id, product }: { id: number; product: Partial<StockExchange> },
    { rejectWithValue },
  ) => {
    try {
      const updatedProduct = await exchangeService.updateExchangeProduct(
        id,
        product,
      );
      if (!updatedProduct) {
        return rejectWithValue("فشل في تحديث المنتج في البورصة");
      }
      return updatedProduct;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// حذف منتج من البورصة
export const deleteExchangeProduct = createAsyncThunk(
  "exchange/deleteProduct",
  async (id: number, { rejectWithValue }) => {
    try {
      const success = await exchangeService.deleteExchangeProduct(id);
      if (!success) {
        return rejectWithValue("فشل في حذف المنتج من البورصة");
      }
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// شريحة Redux للبورصة
const exchangeSlice = createSlice({
  name: "exchange",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearExchangeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب جميع أسعار البورصة
      .addCase(fetchPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = action.payload;
      })
      .addCase(fetchPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // جلب سعر منتج محدد
      .addCase(fetchPriceByProductId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceByProductId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchPriceByProductId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // إضافة منتج للبورصة
      .addCase(addProductToExchange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addProductToExchange.fulfilled,
        (state, action: PayloadAction<StockExchange>) => {
          state.loading = false;
          state.prices.push(action.payload);
          state.currentProduct = action.payload;
        },
      )
      .addCase(addProductToExchange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // تحديث منتج في البورصة
      .addCase(updateExchangeProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateExchangeProduct.fulfilled,
        (state, action: PayloadAction<StockExchange>) => {
          state.loading = false;
          const index = state.prices.findIndex((p) =>
            p.id === action.payload.id
          );
          if (index !== -1) {
            state.prices[index] = action.payload;
          }
          state.currentProduct = action.payload;
        },
      )
      .addCase(updateExchangeProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // حذف منتج من البورصة
      .addCase(deleteExchangeProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteExchangeProduct.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading = false;
          state.prices = state.prices.filter((p) => p.id !== action.payload);
          if (
            state.currentProduct && state.currentProduct.id === action.payload
          ) {
            state.currentProduct = null;
          }
        },
      )
      .addCase(deleteExchangeProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentProduct, clearExchangeError } =
  exchangeSlice.actions;

export default exchangeSlice.reducer;
