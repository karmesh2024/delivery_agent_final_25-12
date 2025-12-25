import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Customer, CustomerFilters, CustomerType, CustomerStatus, CustomersState, CreateCustomerAddress, CreateBusinessProfile, CreateAgentDetails, CustomerCreationPayload } from '../types';
import customersService from '../services/customersService';

// الحالة الأولية
const initialState: CustomersState = {
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10
  },
  totalCount: 0
};

// Async Thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (filters: CustomerFilters, { rejectWithValue }) => {
    try {
      return await customersService.getCustomers(filters);
    } catch (error) {
      return rejectWithValue('فشل في جلب بيانات العملاء');
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await customersService.getCustomerById(id);
    } catch (error) {
      return rejectWithValue('فشل في جلب بيانات العميل');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData: CustomerCreationPayload, { rejectWithValue }) => {
    try {
      return await customersService.createCustomer(customerData);
    } catch (error) {
      let errorMessage = 'فشل في إنشاء العميل';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // If the error is from an HTTP request and has a specific structure (e.g., from Axios or a similar library)
      // you might check for error.response.data.message, but ensure 'error' is typed appropriately
      // For now, we just use the basic Error message if available.
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }: { id: string, customerData: Partial<Customer> }, { rejectWithValue }) => {
    try {
      return await customersService.updateCustomer(id, customerData);
    } catch (error) {
      return rejectWithValue('فشل في تحديث بيانات العميل');
    }
  }
);

export const diagnoseCustomersIssue = createAsyncThunk(
  'customers/diagnoseCustomersIssue',
  async (_, { rejectWithValue }) => {
    try {
      return await customersService.diagnoseCustomersIssue();
    } catch (error) {
      return rejectWithValue('فشل في تشخيص مشكلة العملاء');
    }
  }
);

// إنشاء الـ Slice
const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<CustomerFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { 
        page: 1, 
        limit: 10,
        status: 'all',
        customerType: 'all',
        search: ''
      };
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload.customers;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchCustomerById
      .addCase(fetchCustomerById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action: PayloadAction<Customer | null>) => {
        state.isLoading = false;
        if (action.payload === null) {
          state.selectedCustomer = null;
        } else {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // createCustomer
      .addCase(createCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action: PayloadAction<Customer | null>) => {
        state.isLoading = false;
        if (action.payload) {
          state.customers.unshift(action.payload); 
          state.totalCount += 1;
        } else {
          state.error = 'فشل في إنشاء العميل: البيانات المستلمة فارغة.';
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateCustomer
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action: PayloadAction<Customer | null>) => {
        state.isLoading = false;
        if (action.payload) {
          const updatedCustomer: Customer = action.payload;
          const index = state.customers.findIndex(customer => customer.id === updatedCustomer.id);
          if (index !== -1) {
            state.customers[index] = updatedCustomer;
          }
          if (state.selectedCustomer && state.selectedCustomer.id === updatedCustomer.id) {
            state.selectedCustomer = updatedCustomer;
          }
        } else {
          state.error = 'فشل في تحديث بيانات العميل: البيانات المستلمة فارغة.';
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setFilters, resetFilters, clearSelectedCustomer } = customersSlice.actions;
export default customersSlice.reducer; 