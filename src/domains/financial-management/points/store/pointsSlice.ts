/**
 * Redux Slice for Points Management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pointsService } from '../services/pointsService';
import { pointsTransactionsService } from '../services/pointsTransactionsService';
import { pointsPricingService } from '../services/pointsPricingService';
import { pointsReportsService } from '../services/pointsReportsService';
import {
  PointsConfiguration,
  PointsConfigurationFormData,
  StorePointsConfiguration,
  StorePointsConfigurationFormData,
  PointsTransaction,
  PointsReport,
  PointsSummary,
} from '../types';
import { storePointsConfigService } from '../services/storePointsConfigService';

interface PointsState {
  configurations: PointsConfiguration[];
  storeConfigurations: StorePointsConfiguration[];
  transactions: PointsTransaction[];
  transactionsCount: number;
  report: PointsReport | null;
  summary: PointsSummary | null;
  loading: boolean;
  loadingStore: boolean;
  error: string | null;
  selectedConfiguration: PointsConfiguration | null;
}

const initialState: PointsState = {
  configurations: [],
  storeConfigurations: [],
  transactions: [],
  transactionsCount: 0,
  report: null,
  summary: null,
  loading: false,
  loadingStore: false,
  error: null,
  selectedConfiguration: null,
};

// Async Thunks
export const fetchPointsConfigurations = createAsyncThunk(
  'points/fetchConfigurations',
  async () => {
    return await pointsService.getPointsConfigurations();
  }
);

export const createPointsConfiguration = createAsyncThunk(
  'points/createConfiguration',
  async (config: PointsConfigurationFormData) => {
    return await pointsService.createPointsConfiguration(config);
  }
);

export const updatePointsConfiguration = createAsyncThunk(
  'points/updateConfiguration',
  async ({ id, config }: { id: string; config: Partial<PointsConfigurationFormData> }) => {
    return await pointsService.updatePointsConfiguration(id, config);
  }
);

export const deletePointsConfiguration = createAsyncThunk(
  'points/deleteConfiguration',
  async (id: string) => {
    await pointsService.deletePointsConfiguration(id);
    return id;
  }
);

// ========== إعدادات النقاط للمتجر (منفصلة عن المخلفات) ==========
export const fetchStorePointsConfigurations = createAsyncThunk(
  'points/fetchStoreConfigurations',
  async () => storePointsConfigService.getStorePointsConfigurations()
);

export const createStorePointsConfiguration = createAsyncThunk(
  'points/createStoreConfiguration',
  async (config: StorePointsConfigurationFormData) =>
    storePointsConfigService.createStorePointsConfiguration(config)
);

export const updateStorePointsConfiguration = createAsyncThunk(
  'points/updateStoreConfiguration',
  async ({ id, config }: { id: string; config: Partial<StorePointsConfigurationFormData> }) =>
    storePointsConfigService.updateStorePointsConfiguration(id, config)
);

export const deleteStorePointsConfiguration = createAsyncThunk(
  'points/deleteStoreConfiguration',
  async (id: string) => {
    await storePointsConfigService.deleteStorePointsConfiguration(id);
    return id;
  }
);

export const fetchPointsTransactions = createAsyncThunk(
  'points/fetchTransactions',
  async (filters?: {
    profile_id?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await pointsTransactionsService.getPointsTransactions(filters);
  }
);

export const fetchPointsReport = createAsyncThunk(
  'points/fetchReport',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    return await pointsReportsService.getPointsReport(startDate, endDate);
  }
);

export const fetchPointsSummary = createAsyncThunk(
  'points/fetchSummary',
  async () => {
    return await pointsReportsService.getPointsSummary();
  }
);

const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    setSelectedConfiguration: (state, action: PayloadAction<PointsConfiguration | null>) => {
      state.selectedConfiguration = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch configurations
    builder
      .addCase(fetchPointsConfigurations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsConfigurations.fulfilled, (state, action) => {
        state.loading = false;
        state.configurations = action.payload;
      })
      .addCase(fetchPointsConfigurations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب إعدادات النقاط';
      });

    // Create configuration
    builder
      .addCase(createPointsConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPointsConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        state.configurations.unshift(action.payload);
      })
      .addCase(createPointsConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في إنشاء إعدادات النقاط';
      });

    // Update configuration
    builder
      .addCase(updatePointsConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePointsConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.configurations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.configurations[index] = action.payload;
        }
        if (state.selectedConfiguration?.id === action.payload.id) {
          state.selectedConfiguration = action.payload;
        }
      })
      .addCase(updatePointsConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في تحديث إعدادات النقاط';
      });

    // Delete configuration
    builder
      .addCase(deletePointsConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePointsConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        state.configurations = state.configurations.filter(c => c.id !== action.payload);
        if (state.selectedConfiguration?.id === action.payload) {
          state.selectedConfiguration = null;
        }
      })
      .addCase(deletePointsConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في حذف إعدادات النقاط';
      });

    // Fetch transactions
    builder
      .addCase(fetchPointsTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data;
        state.transactionsCount = action.payload.count;
      })
      .addCase(fetchPointsTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب معاملات النقاط';
      });

    // Fetch report
    builder
      .addCase(fetchPointsReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.report = action.payload;
      })
      .addCase(fetchPointsReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب تقرير النقاط';
      });

    // Fetch summary
    builder
      .addCase(fetchPointsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchPointsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب ملخص النقاط';
      });

    // ========== إعدادات النقاط للمتجر ==========
    builder
      .addCase(fetchStorePointsConfigurations.pending, (state) => {
        state.loadingStore = true;
        state.error = null;
      })
      .addCase(fetchStorePointsConfigurations.fulfilled, (state, action) => {
        state.loadingStore = false;
        state.storeConfigurations = action.payload;
      })
      .addCase(fetchStorePointsConfigurations.rejected, (state, action) => {
        state.loadingStore = false;
        state.error = action.error.message || 'فشل في جلب إعدادات نقاط المتجر';
      });

    builder
      .addCase(createStorePointsConfiguration.pending, (state) => {
        state.loadingStore = true;
        state.error = null;
      })
      .addCase(createStorePointsConfiguration.fulfilled, (state, action) => {
        state.loadingStore = false;
        state.storeConfigurations.unshift(action.payload);
      })
      .addCase(createStorePointsConfiguration.rejected, (state, action) => {
        state.loadingStore = false;
        state.error = action.error.message || 'فشل في إنشاء إعدادات نقاط المتجر';
      });

    builder
      .addCase(updateStorePointsConfiguration.pending, (state) => {
        state.loadingStore = true;
        state.error = null;
      })
      .addCase(updateStorePointsConfiguration.fulfilled, (state, action) => {
        state.loadingStore = false;
        const idx = state.storeConfigurations.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.storeConfigurations[idx] = action.payload;
      })
      .addCase(updateStorePointsConfiguration.rejected, (state, action) => {
        state.loadingStore = false;
        state.error = action.error.message || 'فشل في تحديث إعدادات نقاط المتجر';
      });

    builder
      .addCase(deleteStorePointsConfiguration.pending, (state) => {
        state.loadingStore = true;
        state.error = null;
      })
      .addCase(deleteStorePointsConfiguration.fulfilled, (state, action) => {
        state.loadingStore = false;
        state.storeConfigurations = state.storeConfigurations.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteStorePointsConfiguration.rejected, (state, action) => {
        state.loadingStore = false;
        state.error = action.error.message || 'فشل في حذف إعدادات نقاط المتجر';
      });
  },
});

export const { setSelectedConfiguration, clearError } = pointsSlice.actions;
export default pointsSlice.reducer;
