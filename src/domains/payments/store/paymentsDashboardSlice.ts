import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getDashboardStats, 
  getTransactionTrends, 
  getRecentTransactions, 
  getWallets, 
  getWalletDetails,
  updateWalletStatus,
  getWalletTransactions,
  createManualTransaction,
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  translateWalletType,
  translateWalletStatus,
  translateTransactionType,
  PayoutRequestFilters,
  getAllCentralTransactions,
  AllTransactionsFilters,
  WalletFilters as ServiceWalletFilters
} from '@/services/paymentsService';
import { 
  DashboardStats, 
  TransactionTrendPoint, 
  TransactionDetail,
  WalletWithUserDetails,
  PayoutRequestDetail
} from '@/domains/payments/types/paymentTypes';
import { RootState, AppDispatch } from '@/store';
import { supabase } from '@/lib/supabase';

interface PaymentsDashboardState {
  stats: DashboardStats | null;
  statsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  statsError: string | null;

  transactionTrends: TransactionTrendPoint[];
  transactionTrendsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  transactionTrendsError: string | null;

  recentTransactions: TransactionDetail[];
  recentTransactionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  recentTransactionsError: string | null;

  wallets: WalletWithUserDetails[];
  walletsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  walletsError: string | null;
  walletsTotalCount: number;
  walletsCurrentPage: number;
  walletsPageSize: number;

  selectedWalletDetails: WalletWithUserDetails | null;
  selectedWalletStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedWalletError: string | null;

  selectedWalletTransactions: TransactionDetail[];
  selectedWalletTransactionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedWalletTransactionsError: string | null;
  selectedWalletTransactionsTotalCount: number;
  selectedWalletTransactionsCurrentPage: number;

  payoutRequestsList: PayoutRequestDetail[];
  payoutRequestsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  payoutRequestsError: string | null;
  payoutRequestsTotalCount: number;
  payoutRequestsCurrentPage: number;
  payoutRequestsTotalPages: number;
  selectedPayoutRequest: PayoutRequestDetail | null;
  walletTransactions: TransactionDetail[];
  walletTransactionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  walletTransactionsError: string | null;
  walletTransactionsCurrentPage: number;
  walletTransactionsTotalPages: number;
  walletTransactionsTotalCount: number;
  filteredTransactionsByWalletType: {
    [walletTypeKey: string]: {
      transactions: TransactionDetail[];
      status: 'idle' | 'loading' | 'succeeded' | 'failed';
      error: string | null;
      currentPage: number;
      totalPages: number;
      totalCount: number;
    };
  };

  payoutActionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  payoutActionError: string | null;

  allTransactions: TransactionDetail[];
  allTransactionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  allTransactionsError: string | null;
  allTransactionsTotalCount: number;
  allTransactionsCurrentPage: number;
  allTransactionsTotalPages: number;
}

// Define a specific ThunkApiConfig for fetchTransactionsForWalletType
interface ThunkApiConfigForFetchTransactions {
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: { walletTypeKey: string; message: string };
}

const initialState: PaymentsDashboardState = {
  stats: null,
  statsStatus: 'idle',
  statsError: null,

  transactionTrends: [],
  transactionTrendsStatus: 'idle',
  transactionTrendsError: null,

  recentTransactions: [],
  recentTransactionsStatus: 'idle',
  recentTransactionsError: null,

  wallets: [],
  walletsStatus: 'idle',
  walletsError: null,
  walletsTotalCount: 0,
  walletsCurrentPage: 1,
  walletsPageSize: 10,

  selectedWalletDetails: null,
  selectedWalletStatus: 'idle',
  selectedWalletError: null,

  selectedWalletTransactions: [],
  selectedWalletTransactionsStatus: 'idle',
  selectedWalletTransactionsError: null,
  selectedWalletTransactionsTotalCount: 0,
  selectedWalletTransactionsCurrentPage: 1,

  payoutRequestsList: [],
  payoutRequestsStatus: 'idle',
  payoutRequestsError: null,
  payoutRequestsTotalCount: 0,
  payoutRequestsCurrentPage: 1,
  payoutRequestsTotalPages: 0,
  selectedPayoutRequest: null,
  walletTransactions: [],
  walletTransactionsStatus: 'idle',
  walletTransactionsError: null,
  walletTransactionsCurrentPage: 1,
  walletTransactionsTotalPages: 0,
  walletTransactionsTotalCount: 0,
  filteredTransactionsByWalletType: {},

  payoutActionStatus: 'idle',
  payoutActionError: null,

  allTransactions: [],
  allTransactionsStatus: 'idle',
  allTransactionsError: null,
  allTransactionsTotalCount: 0,
  allTransactionsCurrentPage: 1,
  allTransactionsTotalPages: 0,
};

interface ThunkApiConfig {
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: string;
}

interface FetchWalletsThunkArgs {
  page?: number; 
  pageSize?: number; 
  filters?: { 
    walletType?: string; 
    status?: string; 
    userId?: string; 
  };
  searchQuery?: string;
  sortBy?: string; 
  sortDirection?: 'asc' | 'desc'; 
}

export const fetchDashboardStats = createAsyncThunk<
  DashboardStats, 
  { adminId: string }, 
  { rejectValue: string }
>(
  'paymentsDashboard/fetchStats',
  async ({ adminId }, { rejectWithValue }) => {
    try {
      return await getDashboardStats(adminId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTransactionTrends = createAsyncThunk<
  TransactionTrendPoint[], 
  { period: string }, 
  { rejectValue: string }
>(
  'paymentsDashboard/fetchTrends',
  async ({ period }, { rejectWithValue }) => {
    try {
      return await getTransactionTrends(period);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب اتجاهات المعاملات';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchRecentTransactions = createAsyncThunk<
  TransactionDetail[], 
  { limit: number }, 
  { rejectValue: string }
>(
  'paymentsDashboard/fetchRecent',
  async ({ limit }, { rejectWithValue }) => {
    try {
      // Ensure adminId is correctly passed or handled if not needed by getRecentTransactions
      // For now, assuming getRecentTransactions might not need adminId directly or it's handled internally/globally
      return await getRecentTransactions("UNUSED_ADMIN_ID_FOR_NOW", limit); // Passing a dummy adminId as it expects one
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب أحدث المعاملات';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchWallets = createAsyncThunk<
  { data: WalletWithUserDetails[]; count: number; pageUsed: number; pageSizeUsed: number }, 
  FetchWalletsThunkArgs, 
  { rejectValue: string; state: RootState; dispatch: AppDispatch }
>(
  'paymentsDashboard/fetchWallets',
  async (params, { rejectWithValue, getState }) => {
    try {
      const client = supabase; 
      if (!client) {
        return rejectWithValue('Supabase client is not initialized.');
      }
      
      const actualPage = params.page || getState().paymentsDashboard.walletsCurrentPage;
      const actualPageSize = params.pageSize || getState().paymentsDashboard.walletsPageSize;

      console.log('[fetchWallets] About to call getWallets with - actualPage:', actualPage, '(type:', typeof actualPage, '), actualPageSize:', actualPageSize, '(type:', typeof actualPageSize, '), filters:', params.filters, ', searchQuery:', params.searchQuery);
      
      // استدعاء خدمة جلب المحافظ بالوسائط الصحيحة
      const response = await getWallets(
        actualPage,
        actualPageSize,
        params.filters, // هذا هو الكائن الذي يحتوي على walletType, status, userId
        params.searchQuery
      );

      return { ...response, pageUsed: actualPage, pageSizeUsed: actualPageSize }; 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب المحافظ';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchWalletDetails = createAsyncThunk<
  WalletWithUserDetails | null, 
  { walletId: string },
  { rejectValue: string }
>(
  'paymentsDashboard/fetchWalletDetails',
  async ({ walletId }, { rejectWithValue }) => {
    try {
      const response = await getWalletDetails(walletId);
      if (!response) {
        return rejectWithValue('لم يتم العثور على المحفظة.');
      }
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب تفاصيل المحفظة';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateWalletStatusAndRefreshList = createAsyncThunk<
  WalletWithUserDetails[], 
  { 
    walletId: string; 
    newStatus: string; 
    listParams: FetchWalletsThunkArgs;
  },
  { rejectValue: string; dispatch: AppDispatch; state: RootState } 
>(
  'paymentsDashboard/updateWalletStatusAndRefreshList',
  async ({ walletId, newStatus, listParams }, { dispatch, rejectWithValue, getState }) => {
    try {
      const updateSuccess = await updateWalletStatus(walletId, newStatus);
      if (!updateSuccess) {
        return rejectWithValue('فشل تحديث حالة المحفظة.');
      }

      const fetchArgs: FetchWalletsThunkArgs = {
        page: listParams.page !== undefined ? listParams.page : getState().paymentsDashboard.walletsCurrentPage,
        pageSize: listParams.pageSize !== undefined ? listParams.pageSize : getState().paymentsDashboard.walletsPageSize,
        filters: listParams.filters,
        searchQuery: listParams.searchQuery,
        sortBy: listParams.sortBy,
        sortDirection: listParams.sortDirection,
      };

      const refreshedWalletsResult = await dispatch(fetchWallets(fetchArgs));

      if (fetchWallets.rejected.match(refreshedWalletsResult)) {
        const payloadError = refreshedWalletsResult.payload;
        return rejectWithValue(typeof payloadError === 'string' ? payloadError : 'فشل تحديث قائمة المحافظ بعد تغيير الحالة.');
      }
      
      const payload = refreshedWalletsResult.payload as { data: WalletWithUserDetails[], count: number, pageUsed: number, pageSizeUsed: number };
      return payload.data;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء تحديث حالة المحفظة وإعادة تحميل القائمة';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSelectedWalletTransactions = createAsyncThunk<
  { data: TransactionDetail[], count: number, page: number },
  { 
    walletId: string; 
    page: number; 
    limit: number;
    searchTerm?: string;
    transactionType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  },
  { rejectValue: string }
>(
  'paymentsDashboard/fetchSelectedWalletTransactions',
  async ({ walletId, page, limit, searchTerm, transactionType, status, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await getWalletTransactions(walletId, page, limit, searchTerm, transactionType, status, startDate, endDate);
      if (!response) {
        return rejectWithValue('لم يتم العثور على معاملات لهذه المحفظة.');
      }
      return { ...response, page };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب معاملات المحفظة المحددة';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createManualTransactionAndUpdateDetails = createAsyncThunk<
  { walletDetails: WalletWithUserDetails | null; transactions: { data: TransactionDetail[], count: number, page: number } },
  {
    walletId: string;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    currency: string;
    description: string;
    paymentDetails?: { [key: string]: string | number | boolean | undefined };
    currentTransactionsPage: number;
    transactionsLimit: number;
  },
  ThunkApiConfig
>(
  'paymentsDashboard/createManualTransactionAndUpdateDetails',
  async (params, { getState, dispatch, rejectWithValue }) => {
    try {
      const adminState = getState().auth.currentAdmin;
      if (!adminState || !adminState.user_id) {
        return rejectWithValue('Admin user_id not found in state. Cannot create manual transaction.');
      }
      const adminUserId = adminState.user_id;

      const transactionTypeForService: 'ADMIN_CREDIT_ADJUSTMENT' | 'ADMIN_DEBIT_ADJUSTMENT' = 
        params.type === 'DEPOSIT' ? 'ADMIN_CREDIT_ADJUSTMENT' : 'ADMIN_DEBIT_ADJUSTMENT';

      await createManualTransaction(
        params.walletId,
        transactionTypeForService,
        params.amount,
        params.currency,
        params.description,
        adminUserId,
        params.paymentDetails
      );

      const walletDetailsResult = await dispatch(fetchWalletDetails({ walletId: params.walletId }));
      if (fetchWalletDetails.rejected.match(walletDetailsResult)) {
        const payloadError = walletDetailsResult.payload;
        throw new Error(typeof payloadError === 'string' ? payloadError : 'Failed to fetch wallet details after transaction.');
      }

      const transactionsResult = await dispatch(fetchSelectedWalletTransactions({ 
        walletId: params.walletId, 
        page: params.currentTransactionsPage, 
        limit: params.transactionsLimit 
      }));

      if (fetchSelectedWalletTransactions.rejected.match(transactionsResult)) {
        const payloadError = transactionsResult.payload;
        throw new Error(typeof payloadError === 'string' ? payloadError : 'Failed to fetch transactions after manual transaction.');
      }
      
      return { 
        walletDetails: walletDetailsResult.payload as WalletWithUserDetails | null, 
        transactions: transactionsResult.payload as { data: TransactionDetail[], count: number, page: number } 
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء إنشاء المعاملة اليدوية وتحديث التفاصيل';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPayoutRequestsThunk = createAsyncThunk<
  { data: PayoutRequestDetail[]; count: number; page: number; limit: number },
  { page: number; limit: number; filters?: PayoutRequestFilters; searchQuery?: string },
  { rejectValue: string }
>(
  'paymentsDashboard/fetchPayoutRequests',
  async ({ page, limit, filters, searchQuery }, { rejectWithValue }) => {
    try {
      const response = await getPayoutRequests(page, limit, filters, searchQuery);
      return { ...response, page, limit };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب طلبات السحب';
      return rejectWithValue(errorMessage);
    }
  }
);

export const approvePayoutRequestThunk = createAsyncThunk<
  PayoutRequestDetail,
  { payoutRequestId: string; amountApproved: number; adminNotes?: string },
  ThunkApiConfig
>(
  'paymentsDashboard/approvePayoutRequest',
  async ({ payoutRequestId, amountApproved, adminNotes }, { getState, rejectWithValue }) => {
    try {
      const adminState = getState().auth.currentAdmin;
      if (!adminState || !adminState.user_id) {
        return rejectWithValue('Admin user_id not found. Cannot approve payout.');
      }
      const adminUserId = adminState.user_id;
      
      const result = await approvePayoutRequest(payoutRequestId, adminUserId, amountApproved, adminNotes);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء الموافقة على طلب السحب';
      return rejectWithValue(errorMessage);
    }
  }
);

export const rejectPayoutRequestThunk = createAsyncThunk<
  PayoutRequestDetail,
  { payoutRequestId: string; adminNotes: string },
  ThunkApiConfig
>(
  'paymentsDashboard/rejectPayoutRequest',
  async ({ payoutRequestId, adminNotes }, { getState, rejectWithValue }) => {
    try {
      const adminState = getState().auth.currentAdmin;
      if (!adminState || !adminState.user_id) {
        return rejectWithValue('Admin user_id not found. Cannot reject payout.');
      }
      const adminUserId = adminState.user_id;

      const result = await rejectPayoutRequest(payoutRequestId, adminUserId, adminNotes);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء رفض طلب السحب';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchWalletTransactionsModal = createAsyncThunk<
    { data: TransactionDetail[]; count: number; walletId: string }, // Return type
    { walletId: string; page: number; limit: number; searchTerm?: string, transactionType?: string, status?: string, startDate?: string, endDate?: string }, // Argument type
    { rejectValue: string } // ThunkApiConfig type
>(
  'paymentsDashboard/fetchWalletTransactionsModal',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getWalletTransactions(
        params.walletId, 
        params.page, 
        params.limit, 
        params.searchTerm,
        params.transactionType,
        params.status,
        params.startDate,
        params.endDate
      );
      return { ...response, walletId: params.walletId };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet transactions for modal';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTransactionsForWalletType = createAsyncThunk<
  // Type for the fulfilled value
  {
    walletTypeKey: string;
    data: TransactionDetail[];
    count: number;
    currentPage: number;
    limit: number;
  },
  // Type for the thunk argument
  {
    walletTypeKey: string;
    walletIds: string[];
    page: number;
    limit: number;
    filters: { startDate?: string; endDate?: string; }
  },
  ThunkApiConfigForFetchTransactions // Use the defined interface here
>(
  'paymentsDashboard/fetchTransactionsForWalletType',
  async (params, { rejectWithValue }) => {
    try {
      if (params.walletIds.length === 0) {
        return {
          walletTypeKey: params.walletTypeKey,
          data: [],
          count: 0,
          currentPage: params.page,
          limit: params.limit
        };
      }
      const response = await getWalletTransactions(
        params.walletIds,
        params.page,
        params.limit,
        undefined, // searchTerm
        undefined, // transactionType
        undefined, // status
        params.filters.startDate,
        params.filters.endDate
      );
      return {
        walletTypeKey: params.walletTypeKey,
        data: response.data,
        count: response.count,
        currentPage: params.page,
        limit: params.limit,
      };
    } catch (error: unknown) { // Specify error type as unknown
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue({ walletTypeKey: params.walletTypeKey, message });
    }
  }
);

export const fetchAllAdminTransactions = createAsyncThunk<
  { data: TransactionDetail[]; count: number },
  AllTransactionsFilters,
  ThunkApiConfig
>(
  'paymentsDashboard/fetchAllAdminTransactions',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getAllCentralTransactions(filters);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء جلب جميع المعاملات';
      return rejectWithValue(errorMessage);
    }
  }
);

const paymentsDashboardSlice = createSlice({
  name: 'paymentsDashboard',
  initialState,
  reducers: {
    clearSelectedWallet: (state) => {
      state.selectedWalletDetails = null;
      state.selectedWalletStatus = 'idle';
      state.selectedWalletError = null;
      state.selectedWalletTransactions = [];
      state.selectedWalletTransactionsStatus = 'idle';
      state.selectedWalletTransactionsError = null;
      state.selectedWalletTransactionsTotalCount = 0;
      state.selectedWalletTransactionsCurrentPage = 1;
    },
    setSelectedWalletTransactionsPage: (state, action: PayloadAction<number>) => {
      state.selectedWalletTransactionsCurrentPage = action.payload;
    },
    setPayoutRequestsCurrentPage: (state, action: PayloadAction<number>) => {
      state.payoutRequestsCurrentPage = action.payload;
    },
    clearPayoutActionStatus: (state) => {
      state.payoutActionStatus = 'idle';
      state.payoutActionError = null;
    },
    resetPayoutActionStatus: (state) => {
      state.payoutActionStatus = 'idle';
      state.payoutActionError = null;
    },
    clearWalletTransactions: (state) => {
      state.walletTransactions = [];
      state.walletTransactionsStatus = 'idle';
      state.walletTransactionsError = null;
      state.walletTransactionsCurrentPage = 1;
      state.walletTransactionsTotalPages = 0;
      state.walletTransactionsTotalCount = 0;
    },
    clearFilteredWalletTypeTransactions: (state, action: PayloadAction<string>) => {
      const walletTypeKey = action.payload;
      if (state.filteredTransactionsByWalletType[walletTypeKey]) {
        state.filteredTransactionsByWalletType[walletTypeKey] = {
          transactions: [],
          status: 'idle',
          error: null,
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.statsStatus = 'loading';
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.statsStatus = 'failed';
        state.statsError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(fetchTransactionTrends.pending, (state) => {
        state.transactionTrendsStatus = 'loading';
      })
      .addCase(fetchTransactionTrends.fulfilled, (state, action: PayloadAction<TransactionTrendPoint[]>) => {
        state.transactionTrendsStatus = 'succeeded';
        state.transactionTrends = action.payload;
      })
      .addCase(fetchTransactionTrends.rejected, (state, action) => {
        state.transactionTrendsStatus = 'failed';
        state.transactionTrendsError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(fetchRecentTransactions.pending, (state) => {
        state.recentTransactionsStatus = 'loading';
      })
      .addCase(fetchRecentTransactions.fulfilled, (state, action: PayloadAction<TransactionDetail[]>) => {
        state.recentTransactionsStatus = 'succeeded';
        state.recentTransactions = action.payload;
      })
      .addCase(fetchRecentTransactions.rejected, (state, action) => {
        state.recentTransactionsStatus = 'failed';
        state.recentTransactionsError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(fetchWallets.pending, (state) => {
        state.walletsStatus = 'loading';
      })
      .addCase(fetchWallets.fulfilled, (state, action: PayloadAction<{ data: WalletWithUserDetails[]; count: number; pageUsed: number; pageSizeUsed: number }>) => {
        state.walletsStatus = 'succeeded';
        state.wallets = action.payload.data;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.walletsStatus = 'failed';
        state.walletsError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(fetchWalletDetails.pending, (state) => {
        state.selectedWalletStatus = 'loading';
        state.selectedWalletDetails = null;
        state.selectedWalletError = null;
        state.selectedWalletTransactions = [];
        state.selectedWalletTransactionsStatus = 'idle';
        state.selectedWalletTransactionsError = null;
        state.selectedWalletTransactionsTotalCount = 0;
        state.selectedWalletTransactionsCurrentPage = 1;
      })
      .addCase(fetchWalletDetails.fulfilled, (state, action: PayloadAction<WalletWithUserDetails | null>) => {
        state.selectedWalletStatus = 'succeeded';
        state.selectedWalletDetails = action.payload;
      })
      .addCase(fetchWalletDetails.rejected, (state, action) => {
        state.selectedWalletStatus = 'failed';
        state.selectedWalletError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(updateWalletStatusAndRefreshList.pending, (state) => {
        state.selectedWalletStatus = 'loading'; // Or a more specific status like 'updating'
      })
      .addCase(updateWalletStatusAndRefreshList.fulfilled, (state, action: PayloadAction<WalletWithUserDetails[]>) => {
        state.selectedWalletStatus = 'succeeded';
        state.wallets = action.payload; // Update the main list
        // Also update the selectedWalletDetails if it's the one that was changed
        if (state.selectedWalletDetails && action.payload.find(w => w.id === state.selectedWalletDetails!.id)){
            const updatedWalletInList = action.payload.find(w => w.id === state.selectedWalletDetails!.id);
            if(updatedWalletInList) state.selectedWalletDetails = updatedWalletInList;
        }
      })
      .addCase(updateWalletStatusAndRefreshList.rejected, (state, action) => {
        state.selectedWalletStatus = 'failed';
        state.selectedWalletError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(fetchSelectedWalletTransactions.pending, (state) => {
        state.selectedWalletTransactionsStatus = 'loading';
      })
      .addCase(fetchSelectedWalletTransactions.fulfilled, (state, action: PayloadAction<{ data: TransactionDetail[]; count: number; page: number }>) => {
        state.selectedWalletTransactionsStatus = 'succeeded';
        state.selectedWalletTransactions = action.payload.data;
        state.selectedWalletTransactionsTotalCount = action.payload.count;
        state.selectedWalletTransactionsCurrentPage = action.payload.page;
      })
      .addCase(fetchSelectedWalletTransactions.rejected, (state, action) => {
        state.selectedWalletTransactionsStatus = 'failed';
        state.selectedWalletTransactionsError = action.payload ?? 'حدث خطأ غير معروف';
      })
      .addCase(createManualTransactionAndUpdateDetails.pending, (state) => {
        state.selectedWalletStatus = 'loading'; // Consider a more specific status
      })
      .addCase(createManualTransactionAndUpdateDetails.fulfilled, (state, action) => {
        state.selectedWalletStatus = 'succeeded';
        // Update selectedWalletDetails and its transactions based on action.payload
        state.selectedWalletDetails = action.payload.walletDetails;
        state.selectedWalletTransactions = action.payload.transactions.data;
        state.selectedWalletTransactionsTotalCount = action.payload.transactions.count;
        state.selectedWalletTransactionsCurrentPage = action.payload.transactions.page;
        console.log('Manual transaction successful and details/transactions are being refreshed');
      })
      .addCase(createManualTransactionAndUpdateDetails.rejected, (state, action) => {
        state.selectedWalletStatus = 'failed';
        state.selectedWalletError = action.payload || 'فشل إنشاء معاملة يدوية.';
      })
      .addCase(fetchPayoutRequestsThunk.pending, (state) => {
        state.payoutRequestsStatus = 'loading';
      })
      .addCase(fetchPayoutRequestsThunk.fulfilled, (state, action: PayloadAction<{ data: PayoutRequestDetail[]; count: number; page: number; limit: number }>) => {
        state.payoutRequestsStatus = 'succeeded';
        state.payoutRequestsList = action.payload.data;
        state.payoutRequestsTotalCount = action.payload.count;
        state.payoutRequestsCurrentPage = action.payload.page;
        if (action.payload.limit > 0) { 
            state.payoutRequestsTotalPages = Math.ceil(action.payload.count / action.payload.limit);
        }
      })
      .addCase(fetchPayoutRequestsThunk.rejected, (state, action) => {
        state.payoutRequestsStatus = 'failed';
        state.payoutRequestsError = action.payload || 'فشل جلب طلبات السحب.';
      })
      .addCase(approvePayoutRequestThunk.pending, (state) => {
        state.payoutActionStatus = 'loading';
        state.payoutActionError = null;
      })
      .addCase(approvePayoutRequestThunk.fulfilled, (state, action: PayloadAction<PayoutRequestDetail>) => {
        state.payoutActionStatus = 'succeeded';
        const index = state.payoutRequestsList.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.payoutRequestsList[index] = action.payload;
        }
        // Also update the selected PayoutRequest if it's the one being acted upon
        if (state.selectedPayoutRequest && state.selectedPayoutRequest.id === action.payload.id) {
          state.selectedPayoutRequest = action.payload;
        }
      })
      .addCase(approvePayoutRequestThunk.rejected, (state, action) => {
        state.payoutActionStatus = 'failed';
        state.payoutActionError = action.payload || 'فشل الموافقة على طلب السحب.';
      })
      .addCase(rejectPayoutRequestThunk.pending, (state) => {
        state.payoutActionStatus = 'loading';
        state.payoutActionError = null;
      })
      .addCase(rejectPayoutRequestThunk.fulfilled, (state, action: PayloadAction<PayoutRequestDetail>) => {
        state.payoutActionStatus = 'succeeded';
        const index = state.payoutRequestsList.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.payoutRequestsList[index] = action.payload;
        }
        if (state.selectedPayoutRequest && state.selectedPayoutRequest.id === action.payload.id) {
          state.selectedPayoutRequest = action.payload;
        }
      })
      .addCase(rejectPayoutRequestThunk.rejected, (state, action) => {
        state.payoutActionStatus = 'failed';
        state.payoutActionError = action.payload || 'فشل رفض طلب السحب.';
      })
      .addCase(fetchWalletTransactionsModal.pending, (state) => {
        state.walletTransactionsStatus = 'loading';
        state.walletTransactionsError = null;
      })
      .addCase(fetchWalletTransactionsModal.fulfilled, (state, action) => {
        state.walletTransactionsStatus = 'succeeded';
        state.walletTransactions = action.payload.data;
        state.walletTransactionsTotalCount = action.payload.count;
        const limit = action.meta.arg.limit;
        state.walletTransactionsTotalPages = Math.ceil(action.payload.count / limit);
        state.walletTransactionsCurrentPage = action.meta.arg.page;
      })
      .addCase(fetchWalletTransactionsModal.rejected, (state, action) => {
        state.walletTransactionsStatus = 'failed';
        state.walletTransactionsError = action.payload as string;
      })
      .addCase(fetchTransactionsForWalletType.pending, (state, action) => {
        const { walletTypeKey } = action.meta.arg;
        if (!state.filteredTransactionsByWalletType[walletTypeKey]) {
          state.filteredTransactionsByWalletType[walletTypeKey] = {
            transactions: [],
            status: 'idle',
            error: null,
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
          };
        }
        state.filteredTransactionsByWalletType[walletTypeKey].status = 'loading';
        state.filteredTransactionsByWalletType[walletTypeKey].error = null;
      })
      .addCase(fetchTransactionsForWalletType.fulfilled, (state, action) => {
        const { walletTypeKey, data, count, currentPage, limit } = action.payload;
        if (!state.filteredTransactionsByWalletType[walletTypeKey]) {
          // This case should ideally be handled by the pending reducer, but as a safeguard:
          state.filteredTransactionsByWalletType[walletTypeKey] = { transactions: [], status: 'idle', error: null, currentPage: 1, totalPages: 0, totalCount: 0 };
        }
        const typeState = state.filteredTransactionsByWalletType[walletTypeKey];
        typeState.status = 'succeeded';
        typeState.transactions = data;
        typeState.totalCount = count;
        typeState.currentPage = currentPage;
        typeState.totalPages = Math.ceil(count / limit);
      })
      .addCase(fetchTransactionsForWalletType.rejected, (state, action) => {
        // Correctly type action.payload for rejected case based on ThunkApiConfigForFetchTransactions
        const payload = action.payload as { walletTypeKey: string; message: string } | undefined;
        const walletTypeKeyFromMeta = action.meta.arg.walletTypeKey;

        const targetKey = payload?.walletTypeKey || walletTypeKeyFromMeta;
        const errorMessage = payload?.message || action.error.message || 'Unknown error fetching transactions for wallet type';

        if (targetKey && state.filteredTransactionsByWalletType[targetKey]) {
          state.filteredTransactionsByWalletType[targetKey].status = 'failed';
          state.filteredTransactionsByWalletType[targetKey].error = errorMessage;      
        } else if (targetKey) {
          // If the key didn't exist, initialize it with the error state
          state.filteredTransactionsByWalletType[targetKey] = {
            transactions: [],
            status: 'failed',
            error: errorMessage,
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
          };
        } else {
          // Fallback if no key can be determined (should be rare)
          console.error('Failed to update specific walletType transaction state on rejection, key missing:', action);
        }
      })
      .addCase(fetchAllAdminTransactions.pending, (state) => {
        state.allTransactionsStatus = 'loading';
        state.allTransactionsError = null;
      })
      .addCase(fetchAllAdminTransactions.fulfilled, (state, action) => {
        state.allTransactionsStatus = 'succeeded';
        state.allTransactions = action.payload.data;
        state.allTransactionsTotalCount = action.payload.count;
        state.allTransactionsCurrentPage = action.meta.arg.page || 1;
        state.allTransactionsTotalPages = Math.ceil(action.payload.count / (action.meta.arg.limit || 10));
      })
      .addCase(fetchAllAdminTransactions.rejected, (state, action) => {
        state.allTransactionsStatus = 'failed';
        state.allTransactionsError = action.payload as string;
      });
  },
});

export const { 
  clearSelectedWallet, 
  setSelectedWalletTransactionsPage,
  setPayoutRequestsCurrentPage,
  clearPayoutActionStatus,
  resetPayoutActionStatus,
  clearWalletTransactions,
  clearFilteredWalletTypeTransactions
} = paymentsDashboardSlice.actions;

export default paymentsDashboardSlice.reducer;