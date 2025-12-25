import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UnregisteredCustomer, UnregisteredCustomersState } from '../types';
import { supabase } from '@/lib/supabase';

// Check if supabase client is available
const checkSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }
  return supabase;
};

// Async thunk for fetching unregistered customers
export const fetchUnregisteredCustomers = createAsyncThunk(
  'unregisteredCustomers/fetch',
  async (filters: { search?: string; page: number; limit: number }, { rejectWithValue }) => {
    try {
      const client = checkSupabase();
      
      // First, get the unregistered customers with pagination
      let query = client
        .from('unregistered_customers')
        .select('*', { count: 'exact' });

      // Apply search filter if provided
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      
      const { data: customers, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // If we have customers, get their associated agents
      if (customers && customers.length > 0) {
        // Get all customer IDs
        const customerIds = customers.map(customer => customer.id);
        
        // Get the most recent collection for each customer with agent info
        const { data: collections } = await client
          .from('agent_collections')
          .select(`
            id,
            agent_id,
            unregistered_customer_id,
            collection_date,
            agents (
              id, 
              full_name
            )
          `)
          .in('unregistered_customer_id', customerIds)
          .order('collection_date', { ascending: false });
        
        // Create a map of customer ID to their most recent agent
        const customerAgentMap = new Map();
        
        if (collections) {
          // Group collections by customer ID and keep only the most recent one
          collections.forEach(collection => {
            const customerId = collection.unregistered_customer_id;
            
            // Only add if we don't have an entry for this customer yet
            // (since collections are ordered by date, the first one is the most recent)
                         if (!customerAgentMap.has(customerId) && collection.agents) {
               // Handle the agents data which might be an array or object
               const agentData = Array.isArray(collection.agents) 
                 ? collection.agents[0] // If it's an array, take the first item
                 : collection.agents;   // Otherwise use it directly
                 
               if (agentData) {
                 customerAgentMap.set(customerId, {
                   agentId: collection.agent_id,
                   agent: {
                     id: agentData.id,
                     fullName: agentData.full_name
                   }
                 });
               }
            }
          });
        }
        
        // Add agent info to each customer
        const customersWithAgents = customers.map(customer => {
          const agentInfo = customerAgentMap.get(customer.id);
          if (agentInfo) {
            return {
              ...customer,
              ...agentInfo
            };
          }
          return customer;
        });
        
        return {
          customers: customersWithAgents as UnregisteredCustomer[],
          totalCount: count || 0
        };
      }

      return {
        customers: customers as UnregisteredCustomer[],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching unregistered customers:', error);
      return rejectWithValue('Failed to fetch unregistered customers');
    }
  }
);

// Async thunk for fetching a single unregistered customer with their collections
export const fetchUnregisteredCustomerDetails = createAsyncThunk(
  'unregisteredCustomers/fetchDetails',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const client = checkSupabase();
      // Fetch customer details
      const { data: customer, error: customerError } = await client
        .from('unregistered_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      // Fetch collections for this customer
      const { data: collections, error: collectionsError } = await client
        .from('agent_collections')
        .select(`
          *,
          agent:agents(id, full_name, phone, profile_image_id)
        `)
        .eq('unregistered_customer_id', customerId)
        .order('collection_date', { ascending: false });

      if (collectionsError) throw collectionsError;

      // Transform the data to match our interface
      const transformedCollections = collections.map(collection => ({
        id: collection.id,
        agentId: collection.agent_id,
        unregisteredCustomerId: collection.unregistered_customer_id,
        collectionDate: collection.collection_date,
        totalWeight: collection.total_weight,
        paymentStatus: collection.payment_status,
        paymentMethod: collection.payment_method,
        totalAmount: collection.total_amount,
        notes: collection.notes,
        locationLat: collection.location_lat,
        locationLng: collection.location_lng,
        locationAddress: collection.location_address,
        createdAt: collection.created_at,
        updatedAt: collection.updated_at,
        agent: collection.agent ? {
          id: collection.agent.id,
          fullName: collection.agent.full_name,
          phone: collection.agent.phone,
          profileImageId: collection.agent.profile_image_id
        } : undefined
      }));

      // Return the customer with their collections
      return {
        ...customer,
        collections: transformedCollections
      } as UnregisteredCustomer;
    } catch (error) {
      console.error('Error fetching unregistered customer details:', error);
      return rejectWithValue('Failed to fetch unregistered customer details');
    }
  }
);

// Async thunk for updating customer contact status
export const updateCustomerContactStatus = createAsyncThunk(
  'unregisteredCustomers/updateContactStatus',
  async ({ customerId, contactStatus }: { customerId: string, contactStatus: UnregisteredCustomer['contactStatus'] }, { rejectWithValue }) => {
    try {
      const client = checkSupabase();
      
      // تحديث حالة الاتصال باستخدام حقل contact_status الجديد
      const { data, error } = await client
        .from('unregistered_customers')
        .update({
          contact_status: contactStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      
      return data as UnregisteredCustomer;
    } catch (error) {
      console.error('Error updating customer contact status:', error);
      return rejectWithValue('فشل تحديث حالة الاتصال بالعميل');
    }
  }
);

// Initial state
const initialState: UnregisteredCustomersState = {
  unregisteredCustomers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10
  },
  totalCount: 0
};

// Create the slice
const unregisteredCustomersSlice = createSlice({
  name: 'unregisteredCustomers',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<UnregisteredCustomersState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUnregisteredCustomers
      .addCase(fetchUnregisteredCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUnregisteredCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.unregisteredCustomers = action.payload.customers;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchUnregisteredCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchUnregisteredCustomerDetails
      .addCase(fetchUnregisteredCustomerDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUnregisteredCustomerDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchUnregisteredCustomerDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle updateCustomerContactStatus
      .addCase(updateCustomerContactStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCustomerContactStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the customer in the list
        const index = state.unregisteredCustomers.findIndex(customer => customer.id === action.payload.id);
        if (index !== -1) {
          state.unregisteredCustomers[index] = action.payload;
        }
        // Update selected customer if it's the same
        if (state.selectedCustomer && state.selectedCustomer.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(updateCustomerContactStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setFilters, resetFilters, clearSelectedCustomer } = unregisteredCustomersSlice.actions;

export default unregisteredCustomersSlice.reducer; 