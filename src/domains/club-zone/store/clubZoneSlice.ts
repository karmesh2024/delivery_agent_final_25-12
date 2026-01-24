/**
 * Redux Slice for Club Zone
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clubMembershipService } from '../services/clubMembershipService';
import { clubPointsService } from '../services/clubPointsService';
import { clubPartnersService } from '../services/clubPartnersService';
import { clubRewardsService } from '../services/clubRewardsService';
import {
  ClubMembership,
  ClubMembershipFormData,
  MembershipLevel,
  ClubPointsWallet,
  ClubPointsTransaction,
  ClubPointsTransactionType,
  PointsSource,
  PointsStats,
  ClubPartner,
  ClubPartnerFormData,
  ClubReward,
  ClubRewardFormData,
  RewardRedemption,
  RewardRedemptionRequest,
  ClubDashboardStats,
  RadioStream,
  RadioSession,
} from '../types';
import { clubRadioService } from '../services/clubRadioService';

interface ClubZoneState {
  // Memberships
  memberships: ClubMembership[];
  membershipsCount: number;
  selectedMembership: ClubMembership | null;

  // Points
  pointsWallet: ClubPointsWallet | null;
  pointsTransactions: ClubPointsTransaction[];
  pointsTransactionsCount: number;
  pointsStats: PointsStats | null;
  userPointsSummary: {
    pending_points: number;
    available_points: number;
    used_points: number;
    total_balance: number;
    lifetime_points: number;
  } | null;

  // Partners
  partners: ClubPartner[];
  partnersCount: number;
  selectedPartner: ClubPartner | null;

  // Rewards
  rewards: ClubReward[];
  rewardsCount: number;
  selectedReward: ClubReward | null;
  redemptions: RewardRedemption[];
  redemptionsCount: number;

  // Dashboard
  dashboardStats: ClubDashboardStats | null;

  // Radio
  currentStream: RadioStream | null;
  radioSessions: RadioSession[];
  radioSessionsCount: number;

  // UI State
  loading: boolean;
  error: string | null;
}

const initialState: ClubZoneState = {
  memberships: [],
  membershipsCount: 0,
  selectedMembership: null,
  pointsWallet: null,
  pointsTransactions: [],
  pointsTransactionsCount: 0,
  pointsStats: null,
  userPointsSummary: null,
  partners: [],
  partnersCount: 0,
  selectedPartner: null,
  rewards: [],
  rewardsCount: 0,
  selectedReward: null,
  redemptions: [],
  redemptionsCount: 0,
  dashboardStats: null,
  currentStream: null,
  radioSessions: [],
  radioSessionsCount: 0,
  loading: false,
  error: null,
};

// =================================================================
// Async Thunks - Memberships
// =================================================================

export const fetchMemberships = createAsyncThunk(
  'clubZone/fetchMemberships',
  async (filters?: {
    membership_level?: MembershipLevel;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    return await clubMembershipService.getMemberships(filters);
  }
);

export const updateMembershipLevel = createAsyncThunk(
  'clubZone/updateMembershipLevel',
  async ({ userId, newLevel, endDate }: { userId: string; newLevel: MembershipLevel; endDate?: string }) => {
    return await clubMembershipService.updateMembershipLevel(userId, newLevel, endDate);
  }
);

// =================================================================
// Async Thunks - Points
// =================================================================

export const fetchPointsWallet = createAsyncThunk(
  'clubZone/fetchPointsWallet',
  async (userId: string) => {
    return await clubPointsService.getPointsWallet(userId);
  }
);

export const fetchPointsTransactions = createAsyncThunk(
  'clubZone/fetchPointsTransactions',
  async (filters?: {
    user_id?: string;
    transaction_type?: ClubPointsTransactionType;
    source?: PointsSource;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await clubPointsService.getPointsTransactions(filters);
  }
);

export const addPoints = createAsyncThunk(
  'clubZone/addPoints',
  async (params: {
    userId: string;
    points: number;
    transactionType: ClubPointsTransactionType;
    source?: PointsSource;
    reason?: string;
    description?: string;
    createdBy?: string;
  }) => {
    const transactionId = await clubPointsService.addPoints(
      params.userId,
      params.points,
      params.transactionType,
      params.source,
      params.reason,
      params.description,
      params.createdBy
    );
    return { transactionId, userId: params.userId };
  }
);

export const convertWastePoints = createAsyncThunk(
  'clubZone/convertWastePoints',
  async (request: { userId: string; pointsFromWaste: number; conversionRate?: number }) => {
    // V1.3: تحويل المخلفات يتم عبر \"طلب تحويل\" (Request Only)
    // ملاحظة: سنستخدم نفس thunk name للحفاظ على التوافق مع الواجهة الحالية،
    // لكن التنفيذ أصبح إنشاء طلب تحويل فقط.
    return await clubPointsService.createRecyclingConversionRequest({
      userId: request.userId,
      recyclingPoints: request.pointsFromWaste,
      conversionRate: request.conversionRate,
    });
  }
);

export const fetchPointsStats = createAsyncThunk(
  'clubZone/fetchPointsStats',
  async (userId?: string) => {
    return await clubPointsService.getPointsStats(userId);
  }
);

export const fetchUserPointsSummary = createAsyncThunk(
  'clubZone/fetchUserPointsSummary',
  async (userId: string) => {
    return await clubPointsService.getUserPointsSummary(userId);
  }
);

export const activateMonthlyPoints = createAsyncThunk(
  'clubZone/activateMonthlyPoints',
  async (params: {
    settlementMonth: string; // 'YYYY-MM'
    processedBy: string;
    notes?: string;
  }) => {
    return await clubPointsService.activateMonthlyPoints(params);
  }
);

// =================================================================
// Async Thunks - Partners
// =================================================================

export const fetchPartners = createAsyncThunk(
  'clubZone/fetchPartners',
  async (filters?: {
    partner_type?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    return await clubPartnersService.getPartners(filters);
  }
);

export const createPartner = createAsyncThunk(
  'clubZone/createPartner',
  async (partnerData: ClubPartnerFormData) => {
    return await clubPartnersService.createPartner(partnerData);
  }
);

export const updatePartner = createAsyncThunk(
  'clubZone/updatePartner',
  async ({ id, updates }: { id: string; updates: Partial<ClubPartnerFormData> }) => {
    return await clubPartnersService.updatePartner(id, updates);
  }
);

export const deletePartner = createAsyncThunk(
  'clubZone/deletePartner',
  async (id: string) => {
    await clubPartnersService.deletePartner(id);
    return id;
  }
);

// =================================================================
// Async Thunks - Rewards
// =================================================================

export const fetchRewards = createAsyncThunk(
  'clubZone/fetchRewards',
  async (filters?: {
    partner_id?: string;
    reward_type?: string;
    is_active?: boolean;
    is_featured?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    return await clubRewardsService.getRewards(filters);
  }
);

export const createReward = createAsyncThunk(
  'clubZone/createReward',
  async (rewardData: ClubRewardFormData) => {
    return await clubRewardsService.createReward(rewardData);
  }
);

export const updateReward = createAsyncThunk(
  'clubZone/updateReward',
  async ({ id, updates }: { id: string; updates: Partial<ClubRewardFormData> }) => {
    return await clubRewardsService.updateReward(id, updates);
  }
);

export const deleteReward = createAsyncThunk(
  'clubZone/deleteReward',
  async (id: string) => {
    await clubRewardsService.deleteReward(id);
    return id;
  }
);

export const redeemReward = createAsyncThunk(
  'clubZone/redeemReward',
  async (request: RewardRedemptionRequest) => {
    return await clubRewardsService.redeemReward(request);
  }
);

export const fetchRedemptions = createAsyncThunk(
  'clubZone/fetchRedemptions',
  async (filters?: {
    user_id?: string;
    reward_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await clubRewardsService.getRedemptions(filters);
  }
);

// =================================================================
// Async Thunks - Radio
// =================================================================

export const fetchCurrentStream = createAsyncThunk(
  'clubZone/fetchCurrentStream',
  async () => {
    return await clubRadioService.getCurrentStream();
  }
);

export const startLiveStream = createAsyncThunk(
  'clubZone/startLiveStream',
  async (activityId: string) => {
    await clubRadioService.startLiveStream(activityId);
    return await clubRadioService.getCurrentStream();
  }
);

export const stopLiveStream = createAsyncThunk(
  'clubZone/stopLiveStream',
  async (activityId: string) => {
    await clubRadioService.stopLiveStream(activityId);
    return null;
  }
);

export const fetchRadioSessions = createAsyncThunk(
  'clubZone/fetchRadioSessions',
  async (filters?: {
    activity_id?: string;
    status?: 'active' | 'completed' | 'cancelled';
    limit?: number;
  }) => {
    return await clubRadioService.getSessions(filters);
  }
);

export const updateStreamUrl = createAsyncThunk(
  'clubZone/updateStreamUrl',
  async (params: {
    activityId: string;
    streamUrl: string;
    listenUrl?: string;
  }) => {
    await clubRadioService.updateStreamUrl(params.activityId, params.streamUrl, params.listenUrl);
    // إعادة جلب البث المحدث
    return await clubRadioService.getCurrentStream();
  }
);

// =================================================================
// Slice
// =================================================================

const clubZoneSlice = createSlice({
  name: 'clubZone',
  initialState,
  reducers: {
    setSelectedMembership: (state, action: PayloadAction<ClubMembership | null>) => {
      state.selectedMembership = action.payload;
    },
    setSelectedPartner: (state, action: PayloadAction<ClubPartner | null>) => {
      state.selectedPartner = action.payload;
    },
    setSelectedReward: (state, action: PayloadAction<ClubReward | null>) => {
      state.selectedReward = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Memberships
      .addCase(fetchMemberships.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberships.fulfilled, (state, action: PayloadAction<{ data: ClubMembership[]; count: number }>) => {
        state.loading = false;
        state.memberships = action.payload.data;
        state.membershipsCount = action.payload.count;
      })
      .addCase(fetchMemberships.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch memberships';
      })
      .addCase(updateMembershipLevel.fulfilled, (state, action: PayloadAction<ClubMembership>) => {
        const index = state.memberships.findIndex(m => m.user_id === action.payload.user_id);
        if (index !== -1) {
          state.memberships[index] = action.payload;
        }
      })

      // Points
      .addCase(fetchPointsWallet.fulfilled, (state, action: PayloadAction<ClubPointsWallet | null>) => {
        state.pointsWallet = action.payload;
      })
      .addCase(fetchPointsTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsTransactions.fulfilled, (state, action: PayloadAction<{ data: ClubPointsTransaction[]; count: number }>) => {
        state.loading = false;
        state.pointsTransactions = action.payload.data;
        state.pointsTransactionsCount = action.payload.count;
      })
      .addCase(fetchPointsTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch points transactions';
      })
      .addCase(addPoints.fulfilled, (state, action) => {
        // Refresh wallet after adding points
        if (state.pointsWallet?.user_id === action.payload.userId) {
          // Wallet will be refreshed by fetchPointsWallet
        }
      })
      .addCase(fetchPointsStats.fulfilled, (state, action: PayloadAction<PointsStats>) => {
        state.pointsStats = action.payload;
      })
      .addCase(fetchUserPointsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPointsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.userPointsSummary = action.payload;
      })
      .addCase(fetchUserPointsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user points summary';
      })
      .addCase(activateMonthlyPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateMonthlyPoints.fulfilled, (state) => {
        state.loading = false;
        // Refresh user points summary after activation
        if (state.userPointsSummary) {
          // Summary will be refreshed by calling fetchUserPointsSummary again
        }
      })
      .addCase(activateMonthlyPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to activate monthly points';
      })

      // Partners
      .addCase(fetchPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartners.fulfilled, (state, action: PayloadAction<{ data: ClubPartner[]; count: number }>) => {
        state.loading = false;
        state.partners = action.payload.data;
        state.partnersCount = action.payload.count;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch partners';
      })
      .addCase(createPartner.fulfilled, (state, action: PayloadAction<ClubPartner>) => {
        state.partners.unshift(action.payload);
        state.partnersCount++;
      })
      .addCase(updatePartner.fulfilled, (state, action: PayloadAction<ClubPartner>) => {
        const index = state.partners.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.partners[index] = action.payload;
        }
      })
      .addCase(deletePartner.fulfilled, (state, action: PayloadAction<string>) => {
        state.partners = state.partners.filter(p => p.id !== action.payload);
        state.partnersCount--;
      })

      // Rewards
      .addCase(fetchRewards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action: PayloadAction<{ data: ClubReward[]; count: number }>) => {
        state.loading = false;
        state.rewards = action.payload.data;
        state.rewardsCount = action.payload.count;
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rewards';
      })
      .addCase(createReward.fulfilled, (state, action: PayloadAction<ClubReward>) => {
        state.rewards.unshift(action.payload);
        state.rewardsCount++;
      })
      .addCase(updateReward.fulfilled, (state, action: PayloadAction<ClubReward>) => {
        const index = state.rewards.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rewards[index] = action.payload;
        }
      })
      .addCase(deleteReward.fulfilled, (state, action: PayloadAction<string>) => {
        state.rewards = state.rewards.filter(r => r.id !== action.payload);
        state.rewardsCount--;
      })
      .addCase(redeemReward.fulfilled, (state, action: PayloadAction<RewardRedemption>) => {
        state.redemptions.unshift(action.payload);
        state.redemptionsCount++;
        // Update reward quantity_redeemed
        const rewardIndex = state.rewards.findIndex(r => r.id === action.payload.reward_id);
        if (rewardIndex !== -1) {
          state.rewards[rewardIndex].quantity_redeemed++;
        }
      })
      .addCase(fetchRedemptions.fulfilled, (state, action: PayloadAction<{ data: RewardRedemption[]; count: number }>) => {
        state.redemptions = action.payload.data;
        state.redemptionsCount = action.payload.count;
      })

      // Radio
      .addCase(fetchCurrentStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentStream.fulfilled, (state, action: PayloadAction<RadioStream | null>) => {
        state.loading = false;
        state.currentStream = action.payload;
      })
      .addCase(fetchCurrentStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch current stream';
      })
      .addCase(startLiveStream.fulfilled, (state, action: PayloadAction<RadioStream | null>) => {
        state.currentStream = action.payload;
      })
      .addCase(stopLiveStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopLiveStream.fulfilled, (state) => {
        state.loading = false;
        state.currentStream = null;
      })
      .addCase(stopLiveStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to stop live stream';
      })
      .addCase(fetchRadioSessions.fulfilled, (state, action: PayloadAction<RadioSession[]>) => {
        state.radioSessions = action.payload;
        state.radioSessionsCount = action.payload.length;
      })
      .addCase(updateStreamUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStreamUrl.fulfilled, (state, action: PayloadAction<RadioStream | null>) => {
        state.loading = false;
        state.currentStream = action.payload;
      })
      .addCase(updateStreamUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update stream URL';
      });
  },
});

export const { setSelectedMembership, setSelectedPartner, setSelectedReward, clearError } = clubZoneSlice.actions;
export default clubZoneSlice.reducer;
