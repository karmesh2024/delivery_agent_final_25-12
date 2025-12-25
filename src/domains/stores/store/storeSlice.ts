'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Define the type for a single store
export interface Store {
    id: string;
    owner_id: string;
    name_ar: string;
    name_en?: string | null;
    description_ar?: string | null;
    description_en?: string | null;
    logo_path?: string | null;
    cover_path?: string | null;
    slug: string;
    is_active: boolean;
    sort_order?: number | null;
    settings?: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
}

// Define the state structure for stores
interface StoresState {
  stores: Store[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
    currentStore: Store | null;
}

// Initial state for the stores slice
const initialState: StoresState = {
  stores: [],
  loading: 'idle',
  error: null,
    currentStore: null,
};

// Response type for delete operation
interface DeleteStoreResponse {
    id: string;
    message?: string;
}

// Async thunk for fetching all stores
export const fetchStores = createAsyncThunk('stores/fetchStores', async (_, { rejectWithValue }) => {
    try {
  const response = await fetch('/api/stores');
  if (!response.ok) {
            throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data as Store[];
    } catch (error) {
        const err = error as Error;
        return rejectWithValue(err.message);
    }
});

// Async thunk for deleting a store
export const deleteStore = createAsyncThunk('stores/deleteStore', async (storeId: string, { rejectWithValue }) => {
    try {
        console.log('Attempting to delete store with Redux thunk', storeId);
        const response = await fetch(`/api/stores/${storeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.status === 200) {
            // New 200 success response with message
            const data = await response.json();
            console.log('Delete success response:', data);
            return { id: storeId, message: data.message };
        } else if (response.status === 204) {
            // Legacy 204 No Content success response
            console.log('Delete success with 204 status');
            return { id: storeId };
        }
        
        // For error responses, try to parse error data
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || 'Unknown error occurred';
            console.error('Error data from API:', errorData);
        } catch (e) {
            errorMessage = `Server returned status ${response.status}`;
        }
        
        if (!response.ok) {
            throw new Error(errorMessage);
        }
        
        return { id: storeId };
    } catch (error) {
        console.error('Error in deleteStore thunk:', error);
        const err = error as Error;
        return rejectWithValue(err.message);
    }
});

// Async thunk for updating store status
export const updateStoreStatus = createAsyncThunk(
    'stores/updateStoreStatus',
    async ({ storeId, is_active }: { storeId: string; is_active: boolean }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/stores/${storeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update store status');
            }
            const data = await response.json();
            return data as Store;
        } catch (error) {
            const err = error as Error;
            return rejectWithValue(err.message);
        }
    }
);

// Async thunk for fetching a single store by ID
export const fetchStoreById = createAsyncThunk(
    'stores/fetchStoreById',
    async (storeId: string, { rejectWithValue }) => {
        try {
            console.log('Fetching store data for ID:', storeId);
            const response = await fetch(`/api/stores/${storeId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.message || 'Failed to fetch store');
            }
            
            const data = await response.json();
            console.log('Received store data:', data);
            
            // Validate that we have the required fields
            if (!data.id || !data.name_ar) {
                console.error('Invalid store data received:', data);
                throw new Error('Received invalid store data from the server');
            }
            
            return data as Store;
        } catch (error) {
            console.error('Error in fetchStoreById:', error);
            const err = error as Error;
            return rejectWithValue(err.message);
        }
    }
);

// Async thunk for updating a store
export const updateStore = createAsyncThunk(
    'stores/updateStore',
    async (storeData: Partial<Store> & { id: string }, { rejectWithValue }) => {
        try {
            const { id, ...updateData } = storeData;
            const response = await fetch(`/api/stores/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update store');
            }
            const data = await response.json();
            return data as Store;
        } catch (error) {
            const err = error as Error;
            return rejectWithValue(err.message);
        }
    }
);

// Async thunk for adding a new store
export const addStore = createAsyncThunk(
    'stores/addStore',
    async (newStore: Omit<Store, 'id' | 'created_at'>, { rejectWithValue }) => {
        try {
    const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
    });
    if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add store');
    }
    const data = await response.json();
    return data as Store;
        } catch (error) {
            const err = error as Error;
            return rejectWithValue(err.message);
        }
    }
);

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchStores.fulfilled, (state, action: PayloadAction<Store[]>) => {
        state.loading = 'succeeded';
        state.stores = action.payload;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = 'failed';
                state.error = action.payload as string;
            })
            .addCase(deleteStore.fulfilled, (state, action: PayloadAction<DeleteStoreResponse>) => {
                state.stores = state.stores.filter((store) => store.id !== action.payload.id);
            })
            .addCase(updateStoreStatus.fulfilled, (state, action: PayloadAction<Store>) => {
                const index = state.stores.findIndex((store) => store.id === action.payload.id);
                if (index !== -1) {
                    state.stores[index] = action.payload;
                }
            })
            .addCase(updateStoreStatus.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(fetchStoreById.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(fetchStoreById.fulfilled, (state, action: PayloadAction<Store>) => {
                state.loading = 'succeeded';
                state.currentStore = action.payload;
            })
            .addCase(fetchStoreById.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            })
            .addCase(updateStore.fulfilled, (state, action: PayloadAction<Store>) => {
                const index = state.stores.findIndex((store) => store.id === action.payload.id);
                if (index !== -1) {
                    state.stores[index] = action.payload;
                }
                if (state.currentStore && state.currentStore.id === action.payload.id) {
                    state.currentStore = action.payload;
                }
            })
            .addCase(addStore.pending, (state) => {
                state.loading = 'pending';
      })
      .addCase(addStore.fulfilled, (state, action: PayloadAction<Store>) => {
                state.loading = 'succeeded';
        state.stores.push(action.payload);
      })
            .addCase(addStore.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
      });
  },
});

export default storesSlice.reducer; 