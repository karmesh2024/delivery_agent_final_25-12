import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { referenceDataService, Region, SupplierType } from '../services/referenceDataService';
import { DocumentType } from '../components/tabs/DocumentsTab';
import { PaymentType } from '../components/tabs/FinancialDetailsTab';
import { Category } from '../types';

interface ReferenceDataState {
  regions: Region[];
  supplierTypes: SupplierType[];
  documentTypes: DocumentType[];
  paymentTypes: PaymentType[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  // Track the loading state of individual reference data types
  loadingStates: {
    regions: boolean;
    supplierTypes: boolean;
    documentTypes: boolean;
    paymentTypes: boolean;
    categories: boolean;
  };
  // Track individual error states
  errorStates: {
    regions: string | null;
    supplierTypes: string | null;
    documentTypes: string | null;
    paymentTypes: string | null;
    categories: string | null;
  };
}

const initialState: ReferenceDataState = {
  regions: [],
  supplierTypes: [],
  documentTypes: [],
  paymentTypes: [],
  categories: [],
  loading: false,
  error: null,
  loadingStates: {
    regions: false,
    supplierTypes: false,
    documentTypes: false,
    paymentTypes: false,
    categories: false
  },
  errorStates: {
    regions: null,
    supplierTypes: null,
    documentTypes: null,
    paymentTypes: null,
    categories: null
  }
};

// Individual thunks for fetching each type of reference data
export const fetchRegions = createAsyncThunk(
  'referenceData/fetchRegions',
  async (_, { rejectWithValue }) => {
    try {
      return await referenceDataService.fetchRegions();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchSupplierTypes = createAsyncThunk(
  'referenceData/fetchSupplierTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await referenceDataService.fetchSupplierTypes();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchDocumentTypes = createAsyncThunk(
  'referenceData/fetchDocumentTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await referenceDataService.fetchDocumentTypes();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPaymentTypes = createAsyncThunk(
  'referenceData/fetchPaymentTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await referenceDataService.fetchPaymentTypes();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'referenceData/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await referenceDataService.fetchCategories();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async Thunk to fetch all reference data in parallel
export const fetchAllReferenceData = createAsyncThunk(
  'referenceData/fetchAll',
  async (_, { dispatch }) => {
    // Using Promise.allSettled to ensure all promises complete even if some fail
    const results = await Promise.allSettled([
      dispatch(fetchRegions()),
      dispatch(fetchSupplierTypes()),
      dispatch(fetchDocumentTypes()),
      dispatch(fetchPaymentTypes()),
      dispatch(fetchCategories())
    ]);
    
    // Check for any rejected promises and collect errors
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);
    
    if (errors.length > 0) {
      console.error('Some reference data failed to load:', errors);
    }
    
    // No need to return anything since individual reducers will handle their own data
    return {};
  }
);

const referenceDataSlice = createSlice({
  name: 'referenceData',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.errorStates = {
        regions: null,
        supplierTypes: null,
        documentTypes: null,
        paymentTypes: null,
        categories: null
      };
    }
  },
  extraReducers: (builder) => {
    // fetchAllReferenceData cases
    builder
      .addCase(fetchAllReferenceData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.loadingStates = {
          regions: true,
          supplierTypes: true,
          documentTypes: true,
          paymentTypes: true,
          categories: true
        };
      })
      .addCase(fetchAllReferenceData.fulfilled, (state) => {
        // This will just reset the overall loading state
        // Individual loading states are handled by their respective reducers
        state.loading = false;
      })
      .addCase(fetchAllReferenceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Unknown error occurred';
      })
      
      // Regions cases
      .addCase(fetchRegions.pending, (state) => {
        state.loadingStates.regions = true;
        state.errorStates.regions = null;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.regions = action.payload;
        state.loadingStates.regions = false;
      })
      .addCase(fetchRegions.rejected, (state, action) => {
        state.loadingStates.regions = false;
        state.errorStates.regions = action.payload as string || 'Failed to load regions';
      })
      
      // Supplier Types cases
      .addCase(fetchSupplierTypes.pending, (state) => {
        state.loadingStates.supplierTypes = true;
        state.errorStates.supplierTypes = null;
      })
      .addCase(fetchSupplierTypes.fulfilled, (state, action) => {
        state.supplierTypes = action.payload;
        state.loadingStates.supplierTypes = false;
      })
      .addCase(fetchSupplierTypes.rejected, (state, action) => {
        state.loadingStates.supplierTypes = false;
        state.errorStates.supplierTypes = action.payload as string || 'Failed to load supplier types';
      })
      
      // Document Types cases
      .addCase(fetchDocumentTypes.pending, (state) => {
        state.loadingStates.documentTypes = true;
        state.errorStates.documentTypes = null;
      })
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.documentTypes = action.payload;
        state.loadingStates.documentTypes = false;
      })
      .addCase(fetchDocumentTypes.rejected, (state, action) => {
        state.loadingStates.documentTypes = false;
        state.errorStates.documentTypes = action.payload as string || 'Failed to load document types';
      })
      
      // Payment Types cases
      .addCase(fetchPaymentTypes.pending, (state) => {
        state.loadingStates.paymentTypes = true;
        state.errorStates.paymentTypes = null;
      })
      .addCase(fetchPaymentTypes.fulfilled, (state, action) => {
        state.paymentTypes = action.payload;
        state.loadingStates.paymentTypes = false;
      })
      .addCase(fetchPaymentTypes.rejected, (state, action) => {
        state.loadingStates.paymentTypes = false;
        state.errorStates.paymentTypes = action.payload as string || 'Failed to load payment types';
      })
      
      // Categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.loadingStates.categories = true;
        state.errorStates.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loadingStates.categories = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loadingStates.categories = false;
        state.errorStates.categories = action.payload as string || 'Failed to load categories';
      });
  },
});

export const { clearErrors } = referenceDataSlice.actions;
export default referenceDataSlice.reducer; 