import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/domains/products/types/types';
import { fetchProductsByStoreId, addProduct, updateProduct, deleteProduct as deleteProductService } from '@/domains/products/services/productService';
import { RootState } from '@/store';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/product-assets/by-store/${storeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      const products: Product[] = await response.json();
      return products;
    } catch (err: unknown) {
      return rejectWithValue((err instanceof Error ? err.message : 'An unknown error occurred') || 'فشل في جلب المنتجات');
    }
  }
);

export const addNewProduct = createAsyncThunk(
  'products/addNewProduct',
  async (newProductData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'ratings_count'>, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/stores/${newProductData.shop_id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProductData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }
      const newProduct: Product = await response.json();
      return newProduct;
    } catch (err: unknown) {
      return rejectWithValue((err instanceof Error ? err.message : 'An unknown error occurred') || 'فشل في إضافة المنتج');
    }
  }
);

export const updateExistingProduct = createAsyncThunk(
  'products/updateExistingProduct',
  async (updatedProductData: Product, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/product-assets/by-store/${updatedProductData.shop_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProductData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }
      const updatedProduct: Product = await response.json();
      return updatedProduct;
    } catch (err: unknown) {
      return rejectWithValue((err instanceof Error ? err.message : 'An unknown error occurred') || 'فشل في تحديث المنتج');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const productToDelete = state.products.products.find(p => p.id === productId);

      if (!productToDelete || !productToDelete.shop_id) {
        throw new Error('Product not found or shopId is missing.');
      }
      const response = await fetch(`/api/product-assets/by-store/${productToDelete.shop_id}?id=${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      return productId;
    } catch (err: unknown) {
      return rejectWithValue((err instanceof Error ? err.message : 'An unknown error occurred') || 'فشل في حذف المنتج');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'فشل في جلب المنتجات';
      })
      .addCase(addNewProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(addNewProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'فشل في إضافة المنتج';
      })
      .addCase(updateExistingProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        const index = state.products.findIndex(product => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateExistingProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'فشل في تحديث المنتج';
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.products = state.products.filter(product => product.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'فشل في حذف المنتج';
      });
  },
});

export default productsSlice.reducer; 