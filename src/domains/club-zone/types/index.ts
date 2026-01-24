/**
 * Types and Interfaces for Club Zone System
 * نادي Scope Zone - نظام النقاط والجوائز والرعاة
 */

// =================================================================
// Membership Types
// =================================================================

export enum MembershipLevel {
  COMMUNITY = 'community',
  ACTIVE = 'active',
  AMBASSADOR = 'ambassador',
  PARTNER = 'partner',
}

export interface ClubMembership {
  id: string;
  user_id: string;
  membership_level: MembershipLevel;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

export interface ClubMembershipFormData {
  user_id: string;
  membership_level: MembershipLevel;
  end_date?: string;
  is_active: boolean;
}

// =================================================================
// Points Types
// =================================================================

export interface ClubPointsWallet {
  id: string;
  user_id: string;
  // رصيد النقاط الحالي (للتوافق مع الاسكيما القديمة - يعكس available_points)
  points_balance: number;
  // الحقول الجديدة في V1.3
  pending_points?: number;
  available_points?: number;
  used_points?: number;
  lifetime_points: number;
  updated_at: string;
  // Joined data
  user_name?: string;
}

export enum ClubPointsTransactionType {
  EARNED = 'EARNED',
  USED = 'USED',
  // الأنواع التالية مدعومة في الداتا التاريخية لكنها غير مستخدمة في V1.3
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
  BONUS = 'BONUS',
  CONVERTED = 'CONVERTED',
}

export type PointsSource = 
  | 'waste_collection'
  | 'ad_view'
  | 'event_attendance'
  | 'admin_bonus'
  | 'reward_redeem'
  | 'radio_stream'
  | 'monthly_settlement';

export interface ClubPointsTransaction {
  id: string;
  user_id: string;
  transaction_type: ClubPointsTransactionType;
  points: number;
  points_before: number;
  points_after: number;
  reason?: string;
  source?: PointsSource;
  related_order_id?: string;
  related_offer_id?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  // Joined data
  user_name?: string;
  user_phone?: string;
}

export interface PointsConversionRequest {
  userId: string;
  pointsFromWaste: number;
  conversionRate?: number; // Default: from club_settings
}

export type RecyclingConversionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RecyclingConversionRequest {
  id: string;
  user_id: string;
  recycling_points: number;
  club_points_expected: number;
  status: RecyclingConversionRequestStatus;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  created_at: string;
  // Joined data
  user_name?: string;
  user_phone?: string;
}

// =================================================================
// Partners Types
// =================================================================

export enum PartnerType {
  MERCHANT = 'merchant',
  SPONSOR = 'sponsor',
  RECYCLER = 'recycler',
  MEDIA = 'media',
}

export interface ClubPartner {
  id: string;
  user_id?: string;
  company_name: string;
  partner_type: PartnerType;
  logo_url?: string;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  partnership_start_date?: string;
  partnership_end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Statistics (joined)
  total_rewards?: number;
  total_redemptions?: number;
  total_points_redeemed?: number;
  unique_customers?: number;
}

export interface ClubPartnerFormData {
  user_id?: string;
  company_name: string;
  partner_type: PartnerType;
  logo_url?: string;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  partnership_start_date?: string;
  partnership_end_date?: string;
  is_active: boolean;
}

// =================================================================
// Rewards Types
// =================================================================

export enum RewardType {
  WALLET_CREDIT = 'wallet_credit',
  DISCOUNT_CODE = 'discount_code',
  PRODUCT = 'product',
  SERVICE = 'service',
}

export interface ClubReward {
  id: string;
  partner_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  reward_type: RewardType;
  points_required: number;
  quantity_available?: number;
  quantity_redeemed: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  is_featured: boolean;
  redemption_instructions?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  partner_name?: string;
  total_redemptions?: number;
}

export interface ClubRewardFormData {
  partner_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  reward_type: RewardType;
  points_required: number;
  quantity_available?: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  is_featured: boolean;
  redemption_instructions?: string;
}

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  redemption_code?: string;
  redemption_type: RewardType;
  redemption_data?: any; // JSONB
  status: RedemptionStatus;
  redeemed_at?: string;
  expires_at?: string;
  created_at: string;
  // Joined data
  reward_title?: string;
  reward_image?: string;
  user_name?: string;
  user_phone?: string;
}

export interface RewardRedemptionRequest {
  userId: string;
  rewardId: string;
}

// =================================================================
// Settings Types
// =================================================================

export interface ClubSetting {
  key: string;
  value: any; // JSONB
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface WasteToClubConversionSetting {
  rate: number;
  enabled: boolean;
}

export interface MembershipUpgradeThresholds {
  active: number;
  ambassador: number;
}

// =================================================================
// Dashboard Statistics Types
// =================================================================

export interface ClubDashboardStats {
  total_members: number;
  active_members: number;
  total_points_balance: number;
  total_points_spent: number;
  active_rewards: number;
  active_partners: number;
  top_reward: {
    id: string;
    title: string;
    redemptions_count: number;
  } | null;
  weekly_activity: {
    date: string;
    points_earned: number;
    redemptions: number;
  }[];
}

export interface MembershipStats {
  community: number;
  active: number;
  ambassador: number;
  partner: number;
}

export interface PointsStats {
  total_balance: number;
  total_earned: number;
  total_used: number;
  total_pending: number;
  by_source: {
    source: PointsSource;
    points: number;
  }[];
}

// =================================================================
// Activities Types (لاحقاً)
// =================================================================

export interface ClubActivity {
  id: string;
  activity_type?: string;
  title?: string;
  scheduled_at?: string;
  partner_id?: string;
  points_reward: number;
  is_active: boolean;
  created_at: string;
  // Radio streaming fields
  stream_url?: string;
  station_id?: number;
  listen_url?: string;
  current_listeners?: number;
  max_listeners?: number;
  is_live?: boolean;
  stream_type?: 'mp3' | 'aac' | 'ogg';
  description?: string;
  updated_at?: string;
  planned_duration_minutes?: number;
  // Always-On Stream fields
  broadcast_mode?: 'live_event' | 'always_on';
  playlist_engine_url?: string;
  auto_switch_enabled?: boolean;
  // Joined data
  partner_name?: string;
}

// =================================================================
// Radio Streaming Types
// =================================================================

export interface RadioStream {
  id: string;
  title: string;
  stream_url: string;
  listen_url: string;
  current_listeners: number;
  max_listeners: number;
  is_live: boolean;
  partner_id?: string;
  started_at?: string;
  stream_type?: 'mp3' | 'aac' | 'ogg';
  partner_name?: string;
  partner_logo?: string;
  points_per_minute?: number;
  planned_duration_minutes?: number;
  description?: string;
  // Always-On Stream fields
  broadcast_mode?: 'live_event' | 'always_on';
  playlist_engine_url?: string;
  auto_switch_enabled?: boolean;
}

export interface RadioListener {
  id: string;
  user_id: string;
  activity_id: string;
  started_listening_at: string;
  last_active_at: string;
  duration_minutes: number;  // V1.5: دقائق صافية (بعد خصم أوقات التوقف)
  points_earned: number;     // V1.5: نقاط مستحقة حتى هذه اللحظة
  is_playing?: boolean;      // ✅ V1.5: حالة التشغيل اللحظية (true = يستمع الآن، false = توقف مؤقت)
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  // الشكل الجديد: location JSONB
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    address?: string;
    source?: 'gps' | 'district' | 'address';
    [key: string]: any;
  } | null;
  // الشكل القديم: حقول منفصلة (للتوافق)
  current_latitude?: number;
  current_longitude?: number;
  location_updated_at?: string;
  location_source?: 'gps' | 'district' | 'address';
  location_accuracy?: number;
}

export interface RadioListenerWithDetails extends RadioListener {
  user_name?: string;
  user_phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    area?: string;
    source?: 'gps' | 'district' | 'address';
  };
}

export interface RadioSession {
  id: string;
  activity_id: string;
  started_at: string;
  ended_at?: string;
  total_listeners: number;
  peak_listeners: number;
  total_duration_minutes: number;
  partner_id?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface RadioStreamFormData {
  title: string;
  scheduled_at: string;
  partner_id?: string;
  stream_url: string;
  listen_url: string;
  max_listeners?: number;
  stream_type?: 'mp3' | 'aac' | 'ogg';
  description?: string;
  points_per_minute?: number;
  planned_duration_minutes?: number;
}
