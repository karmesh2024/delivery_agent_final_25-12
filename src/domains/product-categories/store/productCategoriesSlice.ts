import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category, SubCategory, WasteItem } from '@/types';
import { categoryService } from '../api/categoryService';
import { Product, productService } from '../services/productService';
import {
  SubCategoryBucketConfig,
  CategoryBucketConfig,
  getCategoryBucketConfigs as serviceGetCategoryBucketConfigs,
  addCategoryBucketConfig as serviceAddCategoryBucketConfig,
  updateCategoryBucketConfig as serviceUpdateCategoryBucketConfig,
  getSubCategoryBucketConfigs as serviceGetSubCategoryBucketConfigs,
  addSubCategoryBucketConfig as serviceAddSubCategoryBucketConfig,
  updateSubCategoryBucketConfig as serviceUpdateSubCategoryBucketConfig,
} from '../api/basketConfigService';

const basketConfigService = {
  getCategoryBucketConfigs: serviceGetCategoryBucketConfigs,
  addCategoryBucketConfig: serviceAddCategoryBucketConfig,
  updateCategoryBucketConfig: serviceUpdateCategoryBucketConfig,
  getSubCategoryBucketConfigs: serviceGetSubCategoryBucketConfigs,
  addSubCategoryBucketConfig: serviceAddSubCategoryBucketConfig,
  updateSubCategoryBucketConfig: serviceUpdateSubCategoryBucketConfig,
};

// الحالة الأولية
interface ProductCategoriesState {
  categories: {
    data: Category[];
    loading: boolean;
    error: string | null;
  };
  subcategories: {
    data: SubCategory[];
    loading: boolean;
    error: string | null;
  };
  wasteItems: {
    data: WasteItem[];
    loading: boolean;
    error: string | null;
  };
  selectedCategory: Category | null;
  selectedSubCategory: SubCategory | null;
  products: {
    data: Product[];
    loading: boolean;
    error: string | null;
  };
  selectedProduct: Product | null;
  subCategoryBucketConfigs: {
    data: SubCategoryBucketConfig[];
    loading: boolean;
    error: string | null;
  };
  categoryBucketConfigs: {
    data: CategoryBucketConfig[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: ProductCategoriesState = {
  categories: {
    data: [],
    loading: false,
    error: null,
  },
  subcategories: {
    data: [],
    loading: false,
    error: null,
  },
  wasteItems: {
    data: [],
    loading: false,
    error: null,
  },
  selectedCategory: null,
  selectedSubCategory: null,
  products: {
    data: [],
    loading: false,
    error: null
  },
  selectedProduct: null,
  subCategoryBucketConfigs: {
    data: [],
    loading: false,
    error: null,
  },
  categoryBucketConfigs: {
    data: [],
    loading: false,
    error: null,
  },
};

// Async Thunks للفئات
export const fetchCategories = createAsyncThunk(
  'productCategories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.getCategories();
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب الفئات');
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  'productCategories/fetchCategoryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.getCategoryById(id);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب الفئة');
    }
  }
);

export const addCategory = createAsyncThunk(
  'productCategories/addCategory',
  async (category: Partial<Category>, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.addCategory(category);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في إضافة الفئة');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'productCategories/updateCategory',
  async ({ id, category }: { id: string; category: Partial<Category> }, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.updateCategory(id, category);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في تحديث الفئة');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'productCategories/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log('Redux: Intentando eliminar categoría con ID:', id);
      const { success, error } = await categoryService.deleteCategory(id);
      
      if (!success) {
        console.error('Redux: Error al eliminar categoría:', error);
        return rejectWithValue(error || 'فشل في حذف الفئة');
      }
      
      console.log('Redux: Categoría eliminada exitosamente:', id);
      return id;
    } catch (error) {
      console.error('Redux: Excepción al eliminar categoría:', error);
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('فشل في حذف الفئة');
    }
  }
);

// Async Thunks للفئات الفرعية
export const fetchSubCategories = createAsyncThunk(
  'productCategories/fetchSubCategories',
  async (categoryId: string | undefined, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.getSubCategories(categoryId);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب الفئات الفرعية');
    }
  }
);

export const fetchSubCategoryById = createAsyncThunk(
  'productCategories/fetchSubCategoryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.getSubCategoryById(id);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في جلب الفئة الفرعية';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addSubCategory = createAsyncThunk(
  'productCategories/addSubCategory',
  async (subCategory: Partial<SubCategory>, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.addSubCategory(subCategory);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في إضافة الفئة الفرعية');
    }
  }
);

/** إنشاء فئة فرعية مع سعر بورصة أولي في خطوة واحدة */
export const addSubCategoryWithInitialPrice = createAsyncThunk(
  'productCategories/addSubCategoryWithInitialPrice',
  async (
    payload: { subCategory: Partial<SubCategory>; initialBuyPrice: number; initialSellPrice?: number | null },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await categoryService.createSubCategoryWithInitialExchangePrice(
        payload.subCategory,
        payload.initialBuyPrice,
        payload.initialSellPrice,
        undefined
      );
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في إضافة الفئة الفرعية مع السعر');
    }
  }
);

export const updateSubCategory = createAsyncThunk(
  'productCategories/updateSubCategory',
  async ({ id, subCategory }: { id: string; subCategory: Partial<SubCategory> }, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.updateSubCategory(id, subCategory);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في تحديث الفئة الفرعية');
    }
  }
);

export const deleteSubCategory = createAsyncThunk(
  'productCategories/deleteSubCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      const { success, error } = await categoryService.deleteSubCategory(id);
      if (!success) {
        return rejectWithValue(error);
      }
      return id;
    } catch (error) {
      return rejectWithValue('فشل في حذف الفئة الفرعية');
    }
  }
);

/** حذف فئة فرعية مع جميع المنتجات تحتها (تعطيل كتالوج + حذف من waste_data_admin + حذف الفئة) */
export const deleteSubCategoryWithProducts = createAsyncThunk(
  'productCategories/deleteSubCategoryWithProducts',
  async (id: string, { rejectWithValue }) => {
    try {
      const { success, error } = await categoryService.deleteSubCategoryWithProducts(id);
      if (!success) return rejectWithValue(error ?? 'فشل في حذف الفئة الفرعية مع المنتجات');
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في حذف الفئة الفرعية مع المنتجات');
    }
  }
);

/** حذف فئة رئيسية مع الفئات الفرعية وجميع المنتجات */
export const deleteCategoryWithProducts = createAsyncThunk(
  'productCategories/deleteCategoryWithProducts',
  async (id: string, { rejectWithValue }) => {
    try {
      const { success, error } = await categoryService.deleteCategoryWithProducts(id);
      if (!success) return rejectWithValue(error ?? 'فشل في حذف الفئة مع المنتجات');
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'فشل في حذف الفئة مع المنتجات');
    }
  }
);

// Async Thunks للعناصر
export const fetchWasteItems = createAsyncThunk(
  'productCategories/fetchWasteItems',
  async (filters: { categoryId?: string; subcategoryId?: string } | undefined, { rejectWithValue }) => {
    try {
      const { data, error } = await categoryService.getWasteItems(filters);
      if (error) {
        return rejectWithValue(error);
      }
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب العناصر');
    }
  }
);

// Async thunks for products
export const fetchProducts = createAsyncThunk(
  'productCategories/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getProducts();
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء جلب المنتجات');
    }
  }
);

export const fetchProductsBySubcategory = createAsyncThunk(
  'productCategories/fetchProductsBySubcategory',
  async (subcategoryId: string, { rejectWithValue }) => {
    try {
      return await productService.getProductsBySubcategory(subcategoryId);
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء جلب منتجات الفئة الفرعية');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'productCategories/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      return await productService.getProductById(productId);
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء جلب المنتج');
    }
  }
);

export const createProduct = createAsyncThunk(
  'productCategories/createProduct',
  async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      return await productService.createProduct(product);
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء إنشاء المنتج');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'productCategories/updateProduct',
  async ({ productId, product }: { productId: string; product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> }, { rejectWithValue }) => {
    try {
      return await productService.updateProduct(productId, product);
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء تحديث المنتج');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'productCategories/deleteProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(productId);
      return productId;
    } catch (error: unknown) {
      return rejectWithValue((error instanceof Error) ? error.message : 'حدث خطأ أثناء حذف المنتج');
    }
  }
);

// Async Thunks for SubCategory Bucket Configs
export const fetchSubCategoryBucketConfigsThunk = createAsyncThunk(
  'productCategories/fetchSubCategoryBucketConfigs',
  async (subcategoryId: string | undefined, { rejectWithValue }) => {
    try {
      const data = await basketConfigService.getSubCategoryBucketConfigs(subcategoryId);
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب تكوينات سلة الفئات الفرعية');
    }
  }
);

export const addSubCategoryBucketConfigThunk = createAsyncThunk(
  'productCategories/addSubCategoryBucketConfig',
  async (config: Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const data = await basketConfigService.addSubCategoryBucketConfig(config);
      return data;
    } catch (error) {
      return rejectWithValue('فشل في إضافة تكوين سلة الفئة الفرعية');
    }
  }
);

export const updateSubCategoryBucketConfigThunk = createAsyncThunk(
  'productCategories/updateSubCategoryBucketConfig',
  async ({ id, config }: { id: string; config: Partial<Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>> }, { rejectWithValue }) => {
    try {
      const data = await basketConfigService.updateSubCategoryBucketConfig(id, config);
      return data;
    } catch (error) {
      return rejectWithValue('فشل في تحديث تكوين سلة الفئة الفرعية');
    }
  }
);

// Async Thunks for Category Bucket Configs
export const fetchCategoryBucketConfigsThunk = createAsyncThunk(
  'productCategories/fetchCategoryBucketConfigs',
  async (_, { rejectWithValue }) => {
    try {
      const data = await basketConfigService.getCategoryBucketConfigs();
      return data;
    } catch (error) {
      return rejectWithValue('فشل في جلب إعدادات سلة الفئات الأساسية');
    }
  }
);

export const addCategoryBucketConfigThunk = createAsyncThunk(
  'productCategories/addCategoryBucketConfig',
  async (
    config: Parameters<typeof basketConfigService.addCategoryBucketConfig>[0],
    { rejectWithValue }
  ) => {
    try {
      const data = await basketConfigService.addCategoryBucketConfig(config);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'فشل في إضافة تكوين سلة الفئة الرئيسية';
      return rejectWithValue(message);
    }
  }
);

export const updateCategoryBucketConfigThunk = createAsyncThunk(
  'productCategories/updateCategoryBucketConfig',
  async (
    {
      id,
      config,
    }: {
      id: string;
      config: Parameters<typeof basketConfigService.updateCategoryBucketConfig>[1];
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await basketConfigService.updateCategoryBucketConfig(id, config);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'فشل في تحديث تكوين سلة الفئة الرئيسية';
      return rejectWithValue(message);
    }
  }
);

// إنشاء Slice
const productCategoriesSlice = createSlice({
  name: 'productCategories',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedSubCategory: (state, action: PayloadAction<SubCategory | null>) => {
      state.selectedSubCategory = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    clearErrors: (state) => {
      state.categories.error = null;
      state.subcategories.error = null;
      state.wasteItems.error = null;
    },
    clearProductsError: (state) => {
      state.products.error = null;
    },
  },
  extraReducers: (builder) => {
    // الفئات
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categories.loading = true;
        state.categories.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories.loading = false;
        state.categories.data = action.payload ?? [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories.loading = false;
        state.categories.error = action.payload as string;
      })
      .addCase(fetchCategoryById.pending, (state) => {
        state.categories.loading = true;
        state.categories.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.categories.loading = false;
        state.selectedCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.categories.loading = false;
        state.categories.error = action.payload as string;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        if (action.payload) {
          state.categories.data.push(action.payload);
        }
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.categories.data.findIndex((cat) => cat.id === action.payload?.id);
          if (index !== -1) {
            state.categories.data[index] = action.payload;
          }
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories.data = state.categories.data.filter((cat) => cat.id !== action.payload);
      })

      // الفئات الفرعية
      .addCase(fetchSubCategories.pending, (state) => {
        state.subcategories.loading = true;
        state.subcategories.error = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.data = action.payload ?? [];
      })
      .addCase(fetchSubCategories.rejected, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.error = action.payload as string;
      })
      .addCase(fetchSubCategoryById.pending, (state) => {
        state.subcategories.loading = true;
        state.subcategories.error = null;
      })
      .addCase(fetchSubCategoryById.fulfilled, (state, action) => {
        state.subcategories.loading = false;
        state.selectedSubCategory = action.payload;
      })
      .addCase(fetchSubCategoryById.rejected, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.error = action.payload as string;
      })
      .addCase(addSubCategory.fulfilled, (state, action) => {
        if (action.payload) {
          state.subcategories.data.push(action.payload);
        }
      })
      .addCase(addSubCategoryWithInitialPrice.fulfilled, (state, action) => {
        if (action.payload) {
          state.subcategories.data.push(action.payload);
        }
      })
      .addCase(updateSubCategory.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.subcategories.data.findIndex((subcat) => subcat.id === action.payload?.id);
          if (index !== -1) {
            state.subcategories.data[index] = action.payload;
          }
        }
      })
      .addCase(updateSubCategory.rejected, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.error = action.payload as string;
      })
      .addCase(deleteSubCategory.pending, (state) => {
        state.subcategories.loading = true;
        state.subcategories.error = null;
      })
      .addCase(deleteSubCategory.fulfilled, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.data = state.subcategories.data.filter(sub => sub.id !== action.payload);
      })
      .addCase(deleteSubCategory.rejected, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.error = action.payload as string;
      })
      .addCase(deleteSubCategoryWithProducts.pending, (state) => {
        state.subcategories.loading = true;
        state.subcategories.error = null;
      })
      .addCase(deleteSubCategoryWithProducts.fulfilled, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.data = state.subcategories.data.filter(sub => sub.id !== action.payload);
      })
      .addCase(deleteSubCategoryWithProducts.rejected, (state, action) => {
        state.subcategories.loading = false;
        state.subcategories.error = action.payload as string;
      })
      .addCase(deleteCategoryWithProducts.fulfilled, (state, action) => {
        state.categories.data = state.categories.data.filter((cat) => cat.id !== action.payload);
      })
      .addCase(deleteCategoryWithProducts.rejected, (state, action) => {
        state.categories.error = action.payload as string;
      })

      // العناصر
      .addCase(fetchWasteItems.pending, (state) => {
        state.wasteItems.loading = true;
        state.wasteItems.error = null;
      })
      .addCase(fetchWasteItems.fulfilled, (state, action) => {
        state.wasteItems.loading = false;
        state.wasteItems.data = action.payload ?? [];
      })
      .addCase(fetchWasteItems.rejected, (state, action) => {
        state.wasteItems.loading = false;
        state.wasteItems.error = action.payload as string;
      })

      // Products reducers
      .addCase(fetchProducts.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      
      .addCase(fetchProductsBySubcategory.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(fetchProductsBySubcategory.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data = action.payload;
      })
      .addCase(fetchProductsBySubcategory.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      
      .addCase(fetchProductById.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.products.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      
      .addCase(createProduct.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      
      .addCase(updateProduct.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data = state.products.data.map(product => 
          product.id === action.payload.id ? action.payload : product
        );
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      
      .addCase(deleteProduct.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data = state.products.data.filter(product => product.id !== action.payload);
        if (state.selectedProduct?.id === action.payload) {
          state.selectedProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })

      // Reducers for SubCategory Bucket Configs
      .addCase(fetchSubCategoryBucketConfigsThunk.pending, (state) => {
        state.subCategoryBucketConfigs.loading = true;
        state.subCategoryBucketConfigs.error = null;
      })
      .addCase(fetchSubCategoryBucketConfigsThunk.fulfilled, (state, action: PayloadAction<SubCategoryBucketConfig[]>) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.data = action.payload;
      })
      .addCase(fetchSubCategoryBucketConfigsThunk.rejected, (state, action) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.error = action.payload as string;
      })
      .addCase(addSubCategoryBucketConfigThunk.pending, (state) => {
        state.subCategoryBucketConfigs.loading = true;
        state.subCategoryBucketConfigs.error = null;
      })
      .addCase(addSubCategoryBucketConfigThunk.fulfilled, (state, action: PayloadAction<SubCategoryBucketConfig>) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.data.push(action.payload);
      })
      .addCase(addSubCategoryBucketConfigThunk.rejected, (state, action) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.error = action.payload as string;
      })
      .addCase(updateSubCategoryBucketConfigThunk.pending, (state) => {
        state.subCategoryBucketConfigs.loading = true;
        state.subCategoryBucketConfigs.error = null;
      })
      .addCase(updateSubCategoryBucketConfigThunk.fulfilled, (state, action: PayloadAction<SubCategoryBucketConfig>) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.data = state.subCategoryBucketConfigs.data.map(config =>
          config.id === action.payload.id ? action.payload : config
        );
      })
      .addCase(updateSubCategoryBucketConfigThunk.rejected, (state, action) => {
        state.subCategoryBucketConfigs.loading = false;
        state.subCategoryBucketConfigs.error = action.payload as string;
      })

      // Reducers for Category Bucket Configs
      .addCase(fetchCategoryBucketConfigsThunk.pending, (state) => {
        state.categoryBucketConfigs.loading = true;
        state.categoryBucketConfigs.error = null;
      })
      .addCase(fetchCategoryBucketConfigsThunk.fulfilled, (state, action: PayloadAction<CategoryBucketConfig[]>) => {
        console.log('fulfilled: category bucket configs', action.payload);
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.data = action.payload;
      })
      .addCase(fetchCategoryBucketConfigsThunk.rejected, (state, action) => {
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.error = action.payload as string;
      })
      .addCase(addCategoryBucketConfigThunk.pending, (state) => {
        state.categoryBucketConfigs.loading = true;
        state.categoryBucketConfigs.error = null;
      })
      .addCase(addCategoryBucketConfigThunk.fulfilled, (state, action: PayloadAction<CategoryBucketConfig>) => {
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.data.push(action.payload);
      })
      .addCase(addCategoryBucketConfigThunk.rejected, (state, action) => {
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.error = action.payload as string;
      })
      .addCase(updateCategoryBucketConfigThunk.pending, (state) => {
        state.categoryBucketConfigs.loading = true;
        state.categoryBucketConfigs.error = null;
      })
      .addCase(updateCategoryBucketConfigThunk.fulfilled, (state, action: PayloadAction<CategoryBucketConfig>) => {
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.data = state.categoryBucketConfigs.data.map(config =>
          config.id === action.payload.id ? action.payload : config
        );
      })
      .addCase(updateCategoryBucketConfigThunk.rejected, (state, action) => {
        state.categoryBucketConfigs.loading = false;
        state.categoryBucketConfigs.error = action.payload as string;
      });
  },
});

export const { setSelectedCategory, setSelectedSubCategory, setSelectedProduct, clearErrors } = productCategoriesSlice.actions;
export default productCategoriesSlice.reducer; 