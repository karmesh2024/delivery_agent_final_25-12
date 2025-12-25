import { supabase } from "@/lib/supabase"; // Corrected path
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js"; // Added import for PostgrestError and SupabaseClient
import {
  DashboardStats,
  PayoutRequest, // Ensure PayoutRequest is imported
  PayoutRequestDetail, // Added PayoutRequestDetail
  TransactionDetail,
  TransactionTrendPoint,
  UserPaymentMethod, // Added UserPaymentMethod for type hints if needed later
  Wallet, // Main Wallet type
  WalletWithUserDetails, // Updated type for wallets with user details
} from "@/domains/payments/types/paymentTypes";

// إضافة النظام الأمني الجديد
import {
  apiLogger,
  authLogger,
  cleanForLog,
  logger,
  validationLogger,
} from "@/lib/logger-safe";
import { validateEnvironment } from "@/lib/environment";

// فحص البيئة
validateEnvironment();

// Define custom interfaces at the top level of the module

// Interface for data to be inserted into the central 'transactions' table
interface CentralTransactionInsertData {
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  initiated_by_user_id: string | null;
  initiator_type: string | null;
  payout_request_id?: string | null;
  admin_notes?: string | null; // تمت الإضافة
}

// Interface for the data returned after inserting a central transaction
interface CentralTransactionReturnData {
  transaction_id: string;
  created_at: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  initiated_by_user_id: string | null;
  initiator_type: string | null;
  // Add other fields from SELECT_TRANSACTIONS_CORE_DETAILS if they are part of this type
}

// Interface for data to be inserted into 'wallet_transactions' table
// This assumes 'source_general_transaction_id' exists in your 'wallet_transactions' table
interface WalletTransactionInsertData {
  wallet_id: string;
  source_general_transaction_id: string;
  transaction_type: string; // e.g., DEBIT, CREDIT, PAYOUT_DEBIT
  amount: number;
  currency: string;
  description: string | null;
  status: string; // e.g., COMPLETED, PENDING
  initiated_by_user_id: string | null; // User whose wallet is affected or admin
  // admin_actor_id?: string | null; // Optional: if you track which admin specifically actioned this wallet tx
}

// Define RawPayoutData at a higher scope to be accessible by multiple functions
interface RawPayoutData {
  id: string;
  user_id: string;
  wallet_id: string;
  amount_requested: number;
  amount_approved?: number | null;
  currency: string;
  status:
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";
  payout_to_user_payment_method_id: string;
  admin_approver_id?: string | null;
  admin_notes?: string | null;
  user_notes?: string | null;
  transaction_reference?: string | null;
  wallet_transaction_id?: string | null;
  requested_at: string;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; email?: string | null; phone?: string | null } | null;
  profile?: {
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  delivery_profile?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  admin_profile?: {
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  wallet?: {
    id: string;
    balance: number;
    currency: string;
    user_id: string;
    wallet_type?: string;
  } | null; // Added wallet_type
  user_payment_method?: {
    id: string;
    details?:
      | Record<string, string | number | boolean | null | undefined>
      | null;
    payment_method?: {
      name?: string | null;
      code?: string | null;
      type?: string | null;
      logo_url?: string | null;
    } | null;
  } | null;
  // Add any other fields that are directly selected or might come from the tables
}

// تعريف أنواع البيانات للمعاملات
interface TransactionItem {
  amount: number;
  [key: string]: string | number | boolean | null;
}

/**
 * جلب إحصائيات لوحة تحكم المدفوعات
 */
export async function getDashboardStats(
  adminId: string,
): Promise<DashboardStats> { // Restored adminId parameter
  try {
    if (!supabase) { // Added a check for supabase client from import
      apiLogger.error("getDashboardStats", {
        error: "Supabase client not available",
      });
      // Return dummy stats or throw error, consistent with previous logic
      return {
        totalRevenue: 0,
        pendingPayoutsCount: 0,
        successfulTransactionsCount: 0,
        activeWalletsCount: 0,
      };
    }
    // 1. إجمالي الإيرادات - مجموع المعاملات من نوع credit مع حالة completed
    const { data: totalRevenueData, error: totalRevenueError } = await supabase!
      .from("wallet_transactions")
      .select("amount")
      .eq("transaction_type", "DEPOSIT")
      .eq("status", "COMPLETED");

    if (totalRevenueError) throw totalRevenueError;

    // تحقق من وجود البيانات قبل استخدامها
    const totalRevenue =
      Array.isArray(totalRevenueData) && totalRevenueData.length > 0
        ? totalRevenueData.reduce(
          (sum: number, item: TransactionItem) =>
            sum + (typeof item.amount === "number" ? item.amount : 0),
          0,
        )
        : 0;

    // 2. عدد طلبات السحب المعلقة
    const { count: pendingPayoutsCount, error: pendingPayoutsError } =
      await supabase!
        .from("payouts")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING_APPROVAL");

    if (pendingPayoutsError) throw pendingPayoutsError;

    // 3. عدد المعاملات الناجحة
    const {
      count: successfulTransactionsCount,
      error: successfulTransactionsError,
    } = await supabase!
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "COMPLETED");

    if (successfulTransactionsError) throw successfulTransactionsError;

    // 4. عدد المحافظ النشطة - محافظ برصيد أكبر من 0
    const { count: activeWalletsCount, error: activeWalletsError } =
      await supabase!
        .from("wallets")
        .select("*", { count: "exact", head: true })
        .gt("balance", 0);

    if (activeWalletsError) throw activeWalletsError;

    const result = {
      totalRevenue,
      pendingPayoutsCount: pendingPayoutsCount || 0,
      successfulTransactionsCount: successfulTransactionsCount || 0,
      activeWalletsCount: activeWalletsCount || 0,
    };

    // تم تجنب طباعة الإحصائيات الحساسة في اللوج
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error in getDashboardStats";
    apiLogger.error("getDashboardStats", { error: errorMessage });

    // إرجاع بيانات وهمية احتياطية في حالة حدوث أي خطأ
    return {
      totalRevenue: 135780.25,
      pendingPayoutsCount: 8,
      successfulTransactionsCount: 2890,
      activeWalletsCount: 920,
    };
  }
}

/**
 * جلب اتجاهات المعاملات
 */
export async function getTransactionTrends(
  period: string,
): Promise<TransactionTrendPoint[]> {
  try {
    if (!supabase) {
      apiLogger.error("getTransactionTrends", {
        error: "Supabase client not available",
      });
      // Return dummy data as per existing logic
      return [
        { name: "يناير", transactions: 4250, revenue: 26000 },
        { name: "فبراير", transactions: 3100, revenue: 17500 },
        { name: "مارس", transactions: 2150, revenue: 19800 },
        { name: "أبريل", transactions: 2900, revenue: 22000 },
        { name: "مايو", transactions: 1950, revenue: 15400 },
        { name: "يونيو", transactions: 2500, revenue: 21000 },
        { name: "يوليو", transactions: 3600, revenue: 28500 },
      ];
    }
    // محاولة تنفيذ استعلام حقيقي (اختياري - يمكن تطويره لاحقًا)
    try {
      // استعلام أساسي للمعاملات في الـ 6 أشهر الأخيرة مجمعة حسب الشهر
      const { data, error } = await supabase!
        .from("wallet_transactions")
        .select("created_at, amount, transaction_type, status")
        .gte(
          "created_at",
          new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        ) // آخر 6 أشهر
        .eq("status", "COMPLETED");

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        // تجميع البيانات حسب الشهر (مثال مبسط)
        const monthlyData: Record<
          string,
          { transactions: number; revenue: number }
        > = {};

        // أسماء الشهور بالعربية
        const arabicMonths = [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ];

        // تجميع البيانات
        data.forEach((item) => {
          const date = new Date(item.created_at);
          const monthKey = date.getMonth(); // 0-11
          const monthName = arabicMonths[monthKey];

          if (!monthlyData[monthName]) {
            monthlyData[monthName] = { transactions: 0, revenue: 0 };
          }

          monthlyData[monthName].transactions += 1;
          monthlyData[monthName].revenue += Number(item.amount) || 0;
        });

        // تحويل إلى المصفوفة المطلوبة
        const result: TransactionTrendPoint[] = Object.entries(monthlyData).map(
          ([name, data]) => ({
            name,
            transactions: data.transactions,
            revenue: data.revenue,
          }),
        );

        return result;
      }
    } catch (dbError) {
      logger.warn("استخدام البيانات الاحتياطية بسبب:", { error: dbError });
      // استمرار إلى البيانات الاحتياطية
    }

    // بيانات احتياطية إذا فشل الاستعلام أو كانت البيانات غير كافية
    return [
      { name: "يناير", transactions: 4250, revenue: 26000 },
      { name: "فبراير", transactions: 3100, revenue: 17500 },
      { name: "مارس", transactions: 2150, revenue: 19800 },
      { name: "أبريل", transactions: 2900, revenue: 22000 },
      { name: "مايو", transactions: 1950, revenue: 15400 },
      { name: "يونيو", transactions: 2500, revenue: 21000 },
      { name: "يوليو", transactions: 3600, revenue: 28500 },
    ];
  } catch (error) {
    apiLogger.error("Error fetching transaction trends:", { error });

    // إرجاع بيانات وهمية في حالة الخطأ
    return [
      { name: "يناير", transactions: 4250, revenue: 26000 },
      { name: "فبراير", transactions: 3100, revenue: 17500 },
      { name: "مارس", transactions: 2150, revenue: 19800 },
      { name: "أبريل", transactions: 2900, revenue: 22000 },
      { name: "مايو", transactions: 1950, revenue: 15400 },
      { name: "يونيو", transactions: 2500, revenue: 21000 },
      { name: "يوليو", transactions: 3600, revenue: 28500 },
    ];
  }
}

/**
 * جلب أحدث المعاملات
 */
export const getRecentTransactions = async (
  adminId: string,
  limit: number = 5,
): Promise<TransactionDetail[]> => {
  if (!supabase) {
    logger.error("Supabase client is not initialized in getRecentTransactions");
    return [];
  }
  try {
    const { data: recentTxData, error: recentTxError } = await supabase!
      .from("transactions")
      .select(SELECT_TRANSACTIONS_CORE_DETAILS) // Uses the same core select details
      .order("created_at", { ascending: false })
      .limit(limit);

    if (recentTxError) {
      apiLogger.error("Error fetching recent transactions:", {
        error: recentTxError,
      });
      return [];
    }

    if (!recentTxData) {
      return [];
    }

    const typedRecentTxData =
      recentTxData as unknown as RecentTransactionRawItem[]; // Apply same casting

    // Logic for fetching user names, similar to getAllCentralTransactions
    const userIdsToFetch = new Set<string>();
    typedRecentTxData.forEach((tx) => {
      if (tx.initiated_by_user_id) {
        userIdsToFetch.add(tx.initiated_by_user_id);
      }
      // Re-enable payouts user_id fetching for recent transactions
      const payoutInfo = tx.payouts;
      if (payoutInfo && payoutInfo.user_id) {
        userIdsToFetch.add(payoutInfo.user_id);
      }
      if (tx.user_id) { // from transactions.user_id
        userIdsToFetch.add(tx.user_id);
      }
    });

    let userDetailsMap = new Map<
      string,
      { fullName: string | null; email: string | null }
    >();
    if (userIdsToFetch.size > 0) {
      userDetailsMap = await fetchUserDetailsInBatch(
        Array.from(userIdsToFetch),
      );
    }

    const transactions: TransactionDetail[] = typedRecentTxData.map((item) => {
      let targetUserName: string | undefined = "System";
      let processingAdminName: string | null = null;

      if (item.initiated_by_user_id && item.initiator_type === "ADMIN") {
        const adminDetail = userDetailsMap.get(item.initiated_by_user_id);
        processingAdminName = adminDetail?.fullName ||
          `Admin: ${item.initiated_by_user_id.substring(0, 8)}`;
      }

      const payoutInfo = item.payouts; // إلغاء التعليق
      if (payoutInfo && payoutInfo.user_id) { // إلغاء التعليق و تعديل الشرط
        const payoutRequesterDetail = userDetailsMap.get(payoutInfo.user_id);
        targetUserName = payoutRequesterDetail?.fullName ||
          `User: ${payoutInfo.user_id.substring(0, 8)}`;
      } else if (
        (item.type === "ADMIN_CREDIT_ADJUSTMENT" ||
          item.type === "ADMIN_DEBIT_ADJUSTMENT") && item.user_id
      ) {
        const affectedUserDetail = userDetailsMap.get(item.user_id);
        targetUserName = affectedUserDetail?.fullName ||
          `User: ${item.user_id.substring(0, 8)}`;
      } else if (item.initiator_type !== "ADMIN" && item.initiated_by_user_id) {
        const initiatorDetail = userDetailsMap.get(item.initiated_by_user_id);
        targetUserName = initiatorDetail?.fullName ||
          `${item.initiator_type || "USER"}: ${
            item.initiated_by_user_id.substring(0, 8)
          }`;
      } else if (item.initiator_type === "ADMIN") {
        targetUserName = "N/A - Admin Action";
      } else if (!item.initiated_by_user_id && !item.user_id) {
        targetUserName = "النظام";
      }

      return {
        id: item.transaction_id,
        date: item.created_at,
        type: translateTransactionType(item.type),
        amount: String(item.amount),
        status: translateStatus(item.status as TransactionDetail["status"]),
        currency: item.currency || "SAR",
        description: item.description || "N/A",
        user: targetUserName,
        processedByAdminName: processingAdminName,
        initiatedBy: item.initiator_type ||
          (item.initiated_by_user_id ? "USER" : "SYSTEM"),
        payoutRequestId: item.payout_request_id || undefined,
        adminNotes: item.admin_notes || undefined,
        metadata: {},
        wallet_id: undefined, // Not in SELECT_TRANSACTIONS_CORE_DETAILS by default for 'transactions' table
        balance_before: null,
        balance_after: null,
        related_order_id: null,
        payment_method: undefined, // Not in SELECT_TRANSACTIONS_CORE_DETAILS
        original_transaction_id: null,
        admin_actor_id: undefined,
        reference_id: null,
        external_payment_id: null,
        related_entity_id: null,
        related_entity_type: null,
      };
    });

    return transactions;
  } catch (error) {
    apiLogger.error("Supabase error in getRecentTransactions:", { error });
    return [];
  }
};

/**
 * يترجم نوع المعاملة من الإنجليزية (كما هو مخزن في قاعدة البيانات) إلى النص العربي.
 */
export const translateTransactionType = (type: string): string => {
  switch (type) {
    case "DEPOSIT":
      return "إيداع";
    case "WITHDRAWAL":
      return "سحب";
    case "ORDER_PAYMENT":
      return "دفع طلب";
    case "ORDER_COLLECTION":
      return "تحصيل طلب";
    case "REFUND":
      return "استرداد";
    case "MANUAL_ADJUSTMENT":
      return "تسوية يدوية";
    case "FEE":
      return "رسوم";
    case "PAYOUT":
      return "سحب أرباح";
    case "INITIAL_BALANCE":
      return "رصيد افتتاحي";
    case "ADMIN_CREDIT_ADJUSTMENT":
      return "تسوية دائنة (إداري)";
    case "ADMIN_DEBIT_ADJUSTMENT":
      return "تسوية مدينة (إداري)";
    case "DELIVERY_PAYMENT_COLLECTION":
      return "تحصيل طلب توصيل";
    case "PAYOUT_TO_USER":
      return "دفع مستحقات للمستخدم";
    case "PAYOUT_APPROVED": // إضافة حالة جديدة
      return "سحب معتمد"; // ترجمة للنوع الجديد
    case "PAYOUT_REJECTED":
      return "طلب سحب مرفوض";
    case "payment": // Added translation for 'payment' type
      return "دفعة عامة";
    default:
      logger.warn(`نوع معاملة غير معروف مستلم من قاعدة البيانات: ${type}`);
      return type;
  }
};

/**
 * يترجم حالة المعاملة من الإنجليزية (كما هو مخزن في قاعدة البيانات) إلى النص العربي.
 */
export function translateStatus(
  status: string,
): "مكتملة" | "قيد الانتظار" | "فاشلة" | "بانتظار الموافقة" {
  switch (status) {
    case "COMPLETED":
      return "مكتملة";
    case "PENDING":
      return "قيد الانتظار";
    case "FAILED":
      return "فاشلة";
    case "PENDING_APPROVAL":
      return "بانتظار الموافقة";
    default:
      logger.warn(`حالة معاملة غير معروفة مستلمة من قاعدة البيانات: ${status}`);
      return "قيد الانتظار";
  }
}

// Define the type for the nested user information from auth_users
interface AssociatedUser {
  id: string;
  // Add other profile fields if needed in the future, but keep it simple for now
}

// Define the type for wallets as returned by the Supabase query including nested auth_users
interface WalletDataFromQuery extends Wallet {
  auth_users: AssociatedUser | null;
}

// Define the types for filters and search query
export interface WalletFilters { // Added export keyword
  wallet_type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface UserProfileData {
  id: string; // user_id
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone?: string | null; // إضافة خاصية phone لإصلاح أخطاء النوع
}

interface DeliveryBoyData {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface AdminProfileData {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

// Define the type for items returned by the getWalletTransactions query
type WalletTransactionItem = {
  id: string;
  created_at: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string | null;
  description: string | null;
  wallet_id: string;
  balance_before: number | null;
  balance_after: number | null;
  related_order_id: string | null;
  initiated_by_user_id: string | null;
  metadata: { [key: string]: string | number | boolean | undefined } | null;
};

// تعريف سلسلة الاختيار الأساسية للمعاملات المركزية
const SELECT_TRANSACTIONS_CORE_DETAILS =
  "transaction_id,created_at,type,amount,currency,status,description,initiated_by_user_id,initiator_type,payout_request_id,admin_notes,user_id,payouts!payout_request_id(user_id)"; // إعادة تفعيل الربط مع تحديد العلاقة

// تعريف نوع البيانات الخام للمعاملات
interface RecentTransactionRawItem {
  transaction_id: string;
  created_at: string;
  type: string;
  amount: string; // تم التغيير من number إلى string
  status: string;
  currency: string | null;
  description: string | null;
  initiated_by_user_id: string | null;
  initiator_type: string | null;
  payout_request_id?: string | null;
  admin_notes?: string | null;
  payouts?: { user_id: string | null } | null;
  user_id?: string | null;
}

export async function getWallets(
  page: number,
  limit: number,
  filters?: WalletFilters,
  searchQuery?: string,
): Promise<{ data: WalletWithUserDetails[]; count: number }> {
  logger.debug(
    `[getWallets DEBUG] Called: page=${page}, limit=${limit}, filters=${
      JSON.stringify(filters)
    }, searchQuery="${searchQuery}"`,
  );

  if (!supabase) {
    logger.error("[getWallets DEBUG] Supabase client not initialized.");
    return { data: [], count: 0 };
  }

  try {
    let query = supabase
      .from("wallets")
      .select("*", { count: "exact" });

    // Apply filters
    if (filters?.wallet_type) {
      query = query.eq("wallet_type", filters.wallet_type);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    // Apply search
    if (searchQuery) {
      // Search by wallet ID or user ID
      const looksLikeUuid =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (looksLikeUuid.test(searchQuery)) {
        query = query.or(`id.eq.${searchQuery},user_id.eq.${searchQuery}`);
      }
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: walletsData, error, count } = await query;

    if (error) {
      logger.error("Error fetching wallets:", { error });
      return { data: [], count: 0 };
    }

    if (!walletsData || walletsData.length === 0) {
      return { data: [], count: 0 };
    }

    // Fetch user details for all wallets
    const userIds = walletsData.map((w) => w.user_id).filter((id) => id);
    const userDetailsMap = await fetchUserDetailsInBatch(userIds);

    const enhancedWallets: WalletWithUserDetails[] = walletsData.map(
      (wallet) => {
        const userDetail = userDetailsMap.get(wallet.user_id);

        // Construct user_details object matching the interface
        const userDetailsObject = userDetail
          ? {
            id: userDetail.id,
            full_name: userDetail.fullName,
            email: userDetail.email,
            phone_number: userDetail.phone, // Map phone to phone_number
          }
          : null;

        return {
          ...wallet,
          user_details: userDetailsObject,
          auth_users: null, // As per the interface, if we are using user_details
        } as WalletWithUserDetails;
      },
    );

    return { data: enhancedWallets, count: count || 0 };
  } catch (err) {
    logger.error("[getWallets] Exception:", { error: err });
    return { data: [], count: 0 };
  }
}

/**
 * جلب تفاصيل محفظة واحدة بناءً على معرفها، بما في ذلك معلومات المستخدم.
 */
export async function getWalletDetails(
  walletId: string,
): Promise<WalletWithUserDetails | null> {
  if (!supabase || !walletId) {
    return null;
  }
  try {
    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", walletId)
      .single();

    if (error || !wallet) {
      return null;
    }

    // Fetch user details if user_id exists
    let userDetailsObject = null;
    if (wallet.user_id) {
      const userDetailsMap = await fetchUserDetailsInBatch([wallet.user_id]);
      const userDetail = userDetailsMap.get(wallet.user_id);

      if (userDetail) {
        userDetailsObject = {
          id: userDetail.id,
          full_name: userDetail.fullName,
          email: userDetail.email,
          phone_number: userDetail.phone,
        };
      }
    }

    return {
      ...wallet,
      user_details: userDetailsObject,
      auth_users: null,
    } as WalletWithUserDetails;
  } catch (err) {
    logger.error("[getWalletDetails] Exception:", { error: err });
    return null;
  }
}

export async function updateWalletStatus(
  walletId: string,
  newStatus: string,
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error("Supabase client is not available in updateWalletStatus.");
      return false;
    }

    const { error } = await supabase
      .from("wallets")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", walletId);

    if (error) {
      console.error(`Error updating status for wallet ${walletId}:`, error);
      throw error;
    }

    console.log(`Wallet ${walletId} status updated to ${newStatus}`);
    return true;
  } catch (error) {
    console.error(`Error in updateWalletStatus for wallet ${walletId}:`, error);
    return false;
  }
}

export const getWalletTransactions = async (
  walletIds: string | string[],
  page: number,
  limit: number,
  searchTerm?: string,
  transactionType?: string,
  status?: string,
  startDate?: string,
  endDate?: string,
): Promise<{ data: TransactionDetail[]; count: number }> => {
  if (!supabase) {
    console.error(
      "Supabase client is not initialized in getWalletTransactions",
    );
    return { data: [], count: 0 };
  }

  const walletIdArray = Array.isArray(walletIds) ? walletIds : [walletIds];

  let query = supabase
    .from("wallet_transactions")
    // Select specific columns from wallet_transactions, including initiated_by_user_id
    .select(
      "id, created_at, transaction_type, amount, status, currency, description, wallet_id, balance_before, balance_after, related_order_id, initiated_by_user_id, metadata",
      { count: "exact" },
    )
    .in("wallet_id", walletIdArray)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (searchTerm) {
    const searchCondition =
      `description.ilike.%${searchTerm}%,related_order_id.ilike.%${searchTerm}%`;
    query = query.or(searchCondition);
  }
  if (transactionType) {
    query = query.eq("transaction_type", transactionType);
  }
  if (status) {
    // Assuming status in DB matches the one used for filtering or needs mapping
    query = query.eq("status", status);
  }
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching wallet transactions:", error);
    // Consider how to handle the error, maybe rethrow or return an empty/error state
    return { data: [], count: 0 }; // Default fallback
  }

  // Explicitly type `item` in the map function if `data` is not correctly typed by Supabase
  // Also, cast `data` to `WalletTransactionItem[]` to bypass the linter error temporarily,
  // as we are confident in the runtime structure based on the query and WalletTransactionItem type.
  const transactionsRaw = data as unknown as WalletTransactionItem[] || [];

  // Step 1: Extract all unique user IDs
  const userIds = [
    ...new Set(
      transactionsRaw.map((t) => t.initiated_by_user_id).filter((id) => id),
    ),
  ] as string[];

  // Step 2: Fetch user details in batch
  const userDetailsMap = await fetchUserDetailsInBatch(userIds);

  const transactions = transactionsRaw.map((item: WalletTransactionItem) => {
    const userDetail = item.initiated_by_user_id
      ? userDetailsMap.get(item.initiated_by_user_id)
      : null;
    let userNameToShow = item.initiated_by_user_id || "System/Automated"; // Default to ID or 'System/Automated'

    if (userDetail) {
      if (userDetail.fullName) {
        userNameToShow = userDetail.fullName;
      } else if (userDetail.email) {
        userNameToShow = userDetail.email; // Fallback to email if fullName is not available
      } else if (userDetail.id) {
        userNameToShow = userDetail.id; // Fallback to ID if no other info
      }
    } else if (!item.initiated_by_user_id) {
      userNameToShow = "System/Automated";
    } else {
      userNameToShow = "Unknown User"; // If user_id was present but not found in map
    }

    return {
      id: item.id,
      date: new Date(item.created_at).toISOString().split("T")[0],
      type: translateTransactionType(item.transaction_type),
      amount: item.amount.toString(), // Ensure amount is string as per TransactionDetail
      status: translateStatus(item.status),
      user: userNameToShow, // Temporarily, this will be the user ID or a placeholder
      description: item.description || "-", // Ensure description is always a string
      currency: item.currency || undefined,
      balance_before: item.balance_before ?? undefined,
      balance_after: item.balance_after ?? undefined,
      order_id: item.related_order_id || undefined,
      wallet_id: item.wallet_id,
      payment_method_details: (item.metadata as {
        [key: string]: string | number | boolean | undefined;
      }) || {},
      // Adding new fields as undefined for now, they will be populated by specific transaction creation functions
      payoutRequestId: undefined,
      adminNotes: undefined,
    };
  });

  return { data: transactions, count: count ?? 0 };
};

/**
 * إنشاء معاملة يدوية (إيداع أو سحب) وتحديث رصيد المحفظة.
 */
export async function createManualTransaction(
  walletId: string,
  type: "ADMIN_CREDIT_ADJUSTMENT" | "ADMIN_DEBIT_ADJUSTMENT",
  amount: number,
  currency: string,
  description: string,
  adminId: string,
  paymentDetails?: { [key: string]: string | number | boolean | undefined },
): Promise<TransactionDetail> {
  if (!supabase) {
    console.error(
      "Supabase client is not initialized in createManualTransaction",
    );
    throw new Error("Supabase client is not initialized");
  }

  // 1. Fetch wallet details (for balance_before)
  const { data: walletData, error: walletError } = await supabase
    .from("wallets")
    .select("balance, user_id") // also get user_id if available for the central transaction
    .eq("id", walletId)
    .maybeSingle();

  if (walletError || !walletData) {
    console.error("Error fetching wallet balance:", walletError);
    throw walletError || new Error("Wallet not found");
  }

  const balanceBefore = walletData.balance;
  let balanceAfter;

  if (type === "ADMIN_CREDIT_ADJUSTMENT") {
    balanceAfter = balanceBefore + amount;
  } else if (type === "ADMIN_DEBIT_ADJUSTMENT") {
    balanceAfter = balanceBefore - amount;
    if (balanceAfter < 0) {
      throw new Error("Insufficient funds for debit adjustment.");
    }
  } else {
    throw new Error("Invalid manual transaction type.");
  }

  // 2. Create central transaction record
  const centralTransactionData = {
    user_id: walletData.user_id,
    amount,
    currency,
    type: type,
    status: "COMPLETED",
    description,
    initiated_by_user_id: adminId,
    initiator_type: "ADMIN",
    // No external_payment_id, reference_id etc.
  };

  const { data: centralTx, error: centralTxError } = await supabase
    .from("transactions")
    .insert(centralTransactionData)
    .select(SELECT_TRANSACTIONS_CORE_DETAILS) // Use the defined select string
    .single(); // Expect a single record

  if (centralTxError || !centralTx) {
    console.error(
      "Error creating central transaction:",
      JSON.stringify(centralTxError, null, 2),
    ); // Enhanced logging
    throw centralTxError ||
      new Error("Failed to create central transaction record.");
  }

  // 3. Create wallet transaction record, linking to the central transaction
  const walletTransactionData = {
    // id will be auto-generated by DB
    wallet_id: walletId,
    transaction_type: type, // This type refers to WalletTransactionType enum if different
    amount,
    currency,
    status: "COMPLETED",
    description,
    initiated_by_user_id: adminId,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    source_general_transaction_id: centralTx.transaction_id, // Link to the central transaction
    metadata: {
      ...(paymentDetails || {}),
      admin_id: adminId,
      initiated_by_role: "ADMIN",
      // You might not need to duplicate all metadata from centralTx here
    },
  };

  const { data: walletTx, error: walletTxError } = await supabase
    .from("wallet_transactions")
    .insert(walletTransactionData)
    .select("id, created_at") // Select minimal fields needed, or more if required for return
    .single();

  if (walletTxError || !walletTx) {
    console.error("Error creating wallet transaction:", walletTxError);
    // Potentially roll back the central transaction here if needed, or mark it as failed/requiring attention
    throw walletTxError ||
      new Error("Failed to create wallet transaction record.");
  }

  // 4. Update wallet balance
  const { error: updateWalletError } = await supabase
    .from("wallets")
    .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq("id", walletId);

  if (updateWalletError) {
    console.error(
      "Error updating wallet balance after manual transaction:",
      updateWalletError,
    );
    // This is critical. Consider how to handle this (e.g., logging, marking transactions for review)
    throw updateWalletError;
  }

  // 5. Return TransactionDetail based on the central transaction primarily
  const adminUserProfile = await fetchUserDetailsInBatch([adminId]);
  const adminName = adminUserProfile.get(adminId)?.fullName || adminId;

  return {
    id: centralTx.transaction_id,
    date: new Date(centralTx.created_at).toISOString(),
    type: translateTransactionType(centralTx.type),
    amount: String(centralTx.amount),
    status: translateStatus(centralTx.status),
    user: adminName,
    description: centralTx.description || "-", // Ensure description is always a string
    currency: centralTx.currency || undefined,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    order_id: undefined,
    wallet_id: walletId,
    related_transaction_id: walletTx.id,
    payment_method_details: paymentDetails
      ? paymentDetails as Record<string, unknown>
      : undefined,
    initiatedBy: centralTx.initiator_type || "ADMIN",
    admin_id: centralTx.initiated_by_user_id || undefined,
    notes: centralTx.description, // Or a specific notes field if added to centralTx for manual ops
    payoutRequestId: undefined, // Not applicable for manual transactions
    adminNotes: centralTx.description, // For manual transactions, the main description can serve as admin notes
  } as TransactionDetail;
}

/**
 * يترجم حالة طلب السحب من الإنجليزية إلى النص العربي.
 */
export function translatePayoutStatus(status: string): string {
  switch (status) {
    case "PENDING_APPROVAL":
      return "بانتظار الموافقة";
    case "APPROVED":
      return "موافق عليه";
    case "REJECTED":
      return "مرفوض";
    case "PROCESSING":
      return "قيد التنفيذ";
    case "COMPLETED":
      return "مكتمل";
    case "FAILED":
      return "فشل";
    default:
      console.warn(`حالة طلب سحب غير معروفة: ${status}`);
      return status; // Ensure a value is always returned
  }
}

/**
 * يترجم نوع المحفظة من الإنجليزية إلى النص العربي.
 */
export function translateWalletType(walletType: string): string {
  switch (walletType) {
    case "CLIENT":
      return "عميل";
    case "DELIVERY_BOY":
      return "مندوب توصيل";
    case "AGENT":
      return "وكيل";
    case "INTERNAL":
      return "داخلي";
    case "CUSTOMER_HOME":
      return "منزل العميل";
    case "COMPANY":
      return "شركة";
    case "SYSTEM_FLOAT":
      return "رصيد النظام";
    case "SYSTEM_REVENUE":
      return "إيرادات النظام";
    case "SYSTEM_FEES":
      return "رسوم النظام";
    default:
      console.warn(`نوع محفظة غير معروف: ${walletType}`);
      return walletType; // Ensure a value is always returned
  }
}

/**
 * يترجم حالة المحفظة من الإنجليزية إلى النص العربي.
 */
export function translateWalletStatus(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "نشط";
    case "INACTIVE":
      return "غير نشط";
    case "PENDING_VERIFICATION":
      return "بانتظار التحقق";
    case "VERIFIED":
      return "تم التحقق";
    case "REJECTED":
      return "مرفوض";
    case "FROZEN":
      return "مجمد";
    case "SUSPENDED":
      return "معلق";
    case "CLOSED":
      return "مغلق";
    default:
      console.warn(`حالة محفظة غير معروفة: ${status}`);
      return status;
  }
}

// Export PayoutRequestFilters to be used in other modules like slices
export interface PayoutRequestFilters {
  status?: string;
  user_id?: string; // للفلترة بمستخدم معين
  payment_method_code?: string; // للفلترة بنوع طريقة الدفع (مثل VODAFONE_CASH)
  start_date?: string;
  end_date?: string;
}

/**
 * جلب قائمة طلبات السحب مع تفاصيل موسعة.
 */
export async function getPayoutRequests(
  page: number = 1,
  limit: number = 10,
  filters?: PayoutRequestFilters,
  searchQuery?: string,
): Promise<{ data: PayoutRequestDetail[]; count: number }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getPayoutRequests");
    return { data: [], count: 0 };
  }

  try {
    let query = supabase
      .from("payouts")
      .select(
        "*, user_id, user_payment_method:user_payment_methods(*,payment_method:payment_methods(name,code,type,logo_url))",
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // تطبيق الفلاتر
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.user_id) {
      query = query.eq("user_id", filters.user_id);
    }
    if (filters?.start_date) {
      query = query.gte("requested_at", filters.start_date);
    }
    if (filters?.end_date) {
      const endDateWithTime = filters.end_date.includes("T")
        ? filters.end_date
        : `${filters.end_date}T23:59:59.999Z`;
      query = query.lte("requested_at", endDateWithTime);
    }
    if (filters?.payment_method_code) {
      // This will be handled post-fetch as before
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.or(
        `id.ilike.${searchPattern},` +
          `transaction_reference.ilike.${searchPattern},` +
          `user_notes.ilike.${searchPattern},` +
          `admin_notes.ilike.${searchPattern}`,
      );
    }

    const { data: rawPayouts, error, count } = await query;

    if (error) {
      console.error("Error fetching payout requests:", error);
      throw error;
    }

    if (!rawPayouts) {
      return { data: [], count: 0 };
    }

    const userIds = rawPayouts.map((p) => p.user_id).filter((id) =>
      id
    ) as string[];
    const userProfilesMap: Map<string, UserProfileData> = new Map();

    if (userIds.length > 0) {
      // Fetch from auth.users (base layer for email/phone/name) via RPC
      for (const userId of userIds) {
        // Standardized to use user_id_param
        const { data: authUser, error: authUserError } = await supabase
          .rpc("get_user_details_by_id", { user_id_to_fetch: userId })
          .maybeSingle<
            {
              id: string;
              email: string | null;
              phone: string | null;
              full_name: string | null;
            }
          >();

        if (authUserError) {
          console.error(
            `Error fetching auth.users details for ${userId} via RPC in getPayoutRequests:`,
            authUserError,
          );
        } else if (authUser) {
          if (!userProfilesMap.has(userId)) {
            userProfilesMap.set(userId, {
              id: userId,
              full_name: null,
              email: null,
              phone: null,
              phone_number: null,
            });
          }
          const profile = userProfilesMap.get(userId)!;
          profile.email = authUser.email ?? profile.email;
          profile.phone = authUser.phone ?? profile.phone;
          profile.full_name = authUser.full_name ?? profile.full_name;
        }
      }

      // Fetch from new_profiles (customers/general users)
      const { data: newProfiles, error: newProfilesError } = await supabase
        .from("new_profiles")
        .select("id, full_name, email, phone_number") // Uses 'id' as its link to auth.users.id
        .in("id", userIds);
      if (newProfilesError) {
        console.error(
          "Error fetching from new_profiles for payouts:",
          newProfilesError,
        );
      } else {newProfiles?.forEach((p) => {
          const existingProfile = userProfilesMap.get(p.id);
          const baseProfile: UserProfileData = existingProfile || {
            id: p.id,
            full_name: null,
            email: null,
            phone: null,
            phone_number: null,
          };
          userProfilesMap.set(p.id, {
            id: p.id,
            full_name: p.full_name || baseProfile.full_name,
            email: baseProfile.email || p.email,
            phone: baseProfile.phone || p.phone_number,
            phone_number: p.phone_number || baseProfile.phone_number,
          });
        });}

      // Fetch from new_profiles_delivery (delivery personnel)
      const { data: deliveryProfiles, error: deliveryProfilesError } =
        await supabase
          .from("new_profiles_delivery")
          .select("user_id, full_name, email, phone") // Uses 'user_id' to link to auth.users.id
          .in("user_id", userIds);
      if (deliveryProfilesError) {
        console.error(
          "Error fetching from new_profiles_delivery for payouts:",
          deliveryProfilesError,
        );
      } else {deliveryProfiles?.forEach((dp) => {
          const existingProfile = userProfilesMap.get(dp.user_id);
          const baseProfile: UserProfileData = existingProfile || {
            id: dp.user_id,
            full_name: null,
            email: null,
            phone: null,
            phone_number: null,
          };
          userProfilesMap.set(dp.user_id, {
            id: dp.user_id,
            full_name: dp.full_name || baseProfile.full_name,
            email: baseProfile.email || dp.email,
            phone: baseProfile.phone || dp.phone,
          });
        });}

      // Fetch from admins table for payouts
      const { data: adminProfiles, error: adminProfilesError } = await supabase
        .from("admins")
        .select("user_id, full_name, email, phone") // Uses 'user_id'
        .in("user_id", userIds);
      if (adminProfilesError) {
        console.error(
          "Error fetching from admins for payouts:",
          adminProfilesError,
        );
      } else {adminProfiles?.forEach((ap) => {
          const existingProfile = userProfilesMap.get(ap.user_id);
          const baseProfile: UserProfileData = existingProfile || {
            id: ap.user_id,
            full_name: null,
            email: null,
            phone: null,
            phone_number: null,
          };
          userProfilesMap.set(ap.user_id, {
            id: ap.user_id,
            full_name: ap.full_name || baseProfile.full_name,
            email: baseProfile.email || ap.email,
            phone: baseProfile.phone || ap.phone,
          });
        });}
    }

    let processedPayouts = (rawPayouts as RawPayoutData[]).map(
      (payout: RawPayoutData): PayoutRequestDetail => {
        const userProfile = userProfilesMap.get(payout.user_id);

        const userName: string | null = userProfile?.full_name || null;
        const userEmail: string | null = userProfile?.email || null; // Ensure null if undefined
        const userPhone: string | null = userProfile?.phone ||
          userProfile?.phone_number || null; // Ensure null if undefined

        let userType: string = "غير معروف"; // Default value
        // Placeholder for more robust user type determination logic
        if (userProfile?.full_name) {
          userType = "مستخدم معرف"; // Example, replace with actual logic
        }

        return {
          ...payout,
          user_name: userName,
          userEmail: userEmail,
          userPhone: userPhone,
          userType: userType,
          paymentMethodName: payout.user_payment_method?.payment_method?.name ??
            null,
          paymentMethodCode: payout.user_payment_method?.payment_method?.code ??
            null,
          paymentMethodType: payout.user_payment_method?.payment_method?.type ??
            null,
          paymentMethodDetails: payout.user_payment_method?.details
            ? JSON.stringify(payout.user_payment_method.details)
            : null,
          walletBalance: payout.wallet?.balance ?? null,
          walletType: payout.wallet?.wallet_type
            ? translateWalletType(payout.wallet.wallet_type)
            : undefined, // walletType in PayoutRequestDetail can be string | undefined
          adminName: null, // Placeholder
          translatedStatus: translatePayoutStatus(payout.status),
        } as PayoutRequestDetail;
      },
    );

    // Post-fetch filtering for joined fields if necessary
    if (filters?.payment_method_code) {
      // Use a type assertion if confident, or ensure PayoutRequestDetail has paymentMethodCode
      processedPayouts = processedPayouts.filter((p) =>
        (p as PayoutRequestDetail).paymentMethodCode ===
          filters.payment_method_code
      );
    }

    // Post-fetch search for user details if searchQuery was provided
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      processedPayouts = processedPayouts.filter((p) => {
        const detail = p as PayoutRequestDetail;
        const alreadyMatched =
          detail.id.toLowerCase().includes(lowerSearchQuery) ||
          (detail.transaction_reference &&
            detail.transaction_reference.toLowerCase().includes(
              lowerSearchQuery,
            )) ||
          (detail.user_notes &&
            detail.user_notes.toLowerCase().includes(lowerSearchQuery)) ||
          (detail.admin_notes &&
            detail.admin_notes.toLowerCase().includes(lowerSearchQuery));

        if (alreadyMatched) return true;

        return (detail.user_name &&
          detail.user_name.toLowerCase().includes(lowerSearchQuery)) ||
          (detail.userEmail &&
            detail.userEmail.toLowerCase().includes(lowerSearchQuery)) || // Corrected to userEmail
          (detail.userPhone &&
            detail.userPhone.toLowerCase().includes(lowerSearchQuery)); // Corrected to userPhone
      });
    }

    return { data: processedPayouts, count: count || 0 };
  } catch (error) {
    console.error("Error processing getPayoutRequests:", error);
    // Return an empty array and 0 count in case of an unhandled error during processing
    return { data: [], count: 0 };
  }
}

/**
 * الموافقة على طلب سحب.
 */
export async function approvePayoutRequest(
  payoutRequestId: string,
  adminId: string,
  amountApproved: number,
  adminNotes?: string,
): Promise<PayoutRequestDetail> {
  if (!supabase) {
    console.error("Supabase client is not initialized in approvePayoutRequest");
    throw new Error("Supabase client is not initialized");
  }

  const { data: payoutRequest, error: fetchError } = await supabase
    .from("payouts")
    .select("*, wallet:wallets(*)")
    .eq("id", payoutRequestId)
    .maybeSingle<RawPayoutData>();

  if (fetchError || !payoutRequest) {
    console.error(
      "Error fetching payout request or wallet for approval:",
      fetchError,
    );
    throw fetchError ||
      new Error("Payout request or associated wallet not found.");
  }

  if (payoutRequest.status !== "PENDING_APPROVAL") {
    throw new Error("Payout request is not pending approval.");
  }

  const wallet = payoutRequest.wallet;
  if (!wallet) {
    console.error(
      "Wallet details not found for payout request:",
      payoutRequestId,
    );
    throw new Error("Wallet details not found for payout request.");
  }

  if (amountApproved <= 0) {
    throw new Error("Approved amount must be positive.");
  }
  if (amountApproved > payoutRequest.amount_requested) {
    console.warn(
      `Approved amount (${amountApproved}) is greater than requested amount (${payoutRequest.amount_requested}). Proceeding with approved amount.`,
    );
  }
  if (amountApproved > wallet.balance) {
    throw new Error(
      `Insufficient wallet balance. Wallet: ${wallet.id}, Balance: ${wallet.balance}, Amount Approved: ${amountApproved}`,
    );
  }

  // Fetch user details for a more descriptive message
  let userNameForDescription = payoutRequest.user_id;
  let userIdentifierForDescription = payoutRequest.user_id.substring(0, 8); // Default to shortened ID

  if (payoutRequest.user_id) {
    const { data: userProfileForDesc, error: userProfileErrorForDesc } =
      await supabase
        .from("new_profiles") // Assuming new_profiles is the primary source for user names
        .select("full_name")
        .eq("id", payoutRequest.user_id)
        .maybeSingle<{ full_name: string | null }>();
    if (userProfileForDesc?.full_name) {
      userNameForDescription = userProfileForDesc.full_name;
      userIdentifierForDescription = userProfileForDesc.full_name; // Use full name if available
    } else {
      // Fallback to delivery profile if new_profile not found or no name
      const { data: deliveryProfileForDesc } = await supabase
        .from("new_profiles_delivery")
        .select("full_name")
        .eq("user_id", payoutRequest.user_id)
        .maybeSingle<{ full_name: string | null }>();
      if (deliveryProfileForDesc?.full_name) {
        userNameForDescription = deliveryProfileForDesc.full_name;
        userIdentifierForDescription = deliveryProfileForDesc.full_name; // Use full name if available
      }
    }
  }

  const shortPayoutRequestId = payoutRequestId.substring(0, 8);
  const shortAdminId = adminId.substring(0, 8);
  // const adminNotesOrFallback = adminNotes || 'لا يوجد'; // لم نعد بحاجة لهذا هنا

  // وصف مختصر الآن، حيث أن الملاحظات ستكون في عمود منفصل
  const centralTransactionDescription =
    `سحب أرباح للمستخدم: ${userIdentifierForDescription}. طلب رقم: ${shortPayoutRequestId}. تمت الموافقة بواسطة المسؤول: ${shortAdminId}.`;

  const centralTransactionData: CentralTransactionInsertData = {
    type: "PAYOUT_APPROVED",
    amount: amountApproved,
    currency: payoutRequest.currency,
    status: "COMPLETED",
    description: centralTransactionDescription,
    initiated_by_user_id: adminId,
    initiator_type: "ADMIN",
    payout_request_id: payoutRequestId,
    admin_notes: adminNotes || null, // إضافة admin_notes هنا
  };

  const { data: centralTransaction, error: centralTxError } = await supabase
    .from("transactions")
    .insert(centralTransactionData)
    .select(SELECT_TRANSACTIONS_CORE_DETAILS + ", transaction_id")
    .single<CentralTransactionReturnData>();

  if (centralTxError || !centralTransaction) {
    console.error(
      "Error creating central transaction for payout:",
      centralTxError,
    );
    throw centralTxError ||
      new Error("Failed to create central transaction for payout.");
  }

  const newCentralTransactionId = centralTransaction.transaction_id;

  const walletTransactionDescription =
    `خصم لسحب أرباح للمستخدم: ${userIdentifierForDescription} (طلب رقم: ${shortPayoutRequestId}). ملاحظات المسؤول: ${
      adminNotes || "لا يوجد"
    }`;

  const walletTransactionData: WalletTransactionInsertData = {
    wallet_id: wallet.id,
    source_general_transaction_id: newCentralTransactionId,
    transaction_type: "PAYOUT_TO_USER", // Corrected enum value
    amount: amountApproved,
    currency: wallet.currency,
    description: walletTransactionDescription, // Use the new descriptive message
    status: "COMPLETED",
    initiated_by_user_id: payoutRequest.user_id,
  };

  const { error: walletTxError } = await supabase
    .from("wallet_transactions")
    .insert(walletTransactionData);

  if (walletTxError) {
    console.error(
      "Error creating wallet transaction for payout:",
      walletTxError,
    );
    await supabase.from("transactions").delete().eq(
      "transaction_id",
      newCentralTransactionId,
    );
    console.error(
      "Rolled back central transaction due to wallet transaction failure.",
    );
    throw walletTxError;
  }

  const newBalance = wallet.balance - amountApproved;
  const { error: walletUpdateError } = await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  if (walletUpdateError) {
    console.error(
      "Error updating wallet balance after payout:",
      walletUpdateError,
    );
    await supabase.from("wallet_transactions").delete().eq(
      "source_general_transaction_id",
      newCentralTransactionId,
    );
    await supabase.from("transactions").delete().eq(
      "transaction_id",
      newCentralTransactionId,
    );
    console.error(
      "Rolled back central and wallet transactions due to wallet update failure.",
    );
    throw walletUpdateError;
  }

  const { data: updatedPayoutRequest, error: payoutUpdateError } =
    await supabase
      .from("payouts")
      .update({
        status: "APPROVED",
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        admin_approver_id: adminId, // Changed admin_id to admin_approver_id
        related_transaction_id: newCentralTransactionId,
      })
      .eq("id", payoutRequestId)
      .select(
        "*, wallet:wallets(*), user_payment_method:user_payment_methods(*, payment_method:payment_methods(*))",
      )
      .single<RawPayoutData>();

  if (payoutUpdateError || !updatedPayoutRequest) {
    console.error("Error updating payout request status:", payoutUpdateError);
    throw payoutUpdateError ||
      new Error("Failed to update payout request status.");
  }

  let userName: string | undefined = undefined;
  let userPhone: string | undefined = undefined;
  let userEmail: string | undefined = undefined;

  if (payoutRequest.user_id) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from("new_profiles")
      .select("full_name, email, phone_number") // Removed phone, kept phone_number
      .eq("id", payoutRequest.user_id)
      .maybeSingle<Partial<UserProfileData>>();

    if (userProfileError) {
      console.warn(
        `Error fetching user profile for ${payoutRequest.user_id}:`,
        userProfileError.message,
      );
    } else if (userProfile) {
      userName = userProfile.full_name || undefined;
      userEmail = userProfile.email || undefined;
      userPhone = userProfile.phone_number || undefined; // Changed from userProfile.phone
    }

    if (!userName && payoutRequest.user_id) {
      const { data: deliveryProfile, error: deliveryProfileError } =
        await supabase
          .from("new_profiles_delivery")
          .select("full_name, email, phone")
          .eq("user_id", payoutRequest.user_id)
          .maybeSingle<Partial<DeliveryBoyData>>();

      if (deliveryProfileError) {
        console.warn(
          `Error fetching delivery profile for ${payoutRequest.user_id}:`,
          deliveryProfileError.message,
        );
      } else if (deliveryProfile) {
        userName = deliveryProfile.full_name || userName;
        userEmail = deliveryProfile.email || userEmail;
        userPhone = deliveryProfile.phone || userPhone;
      }
    }
  }

  const result: PayoutRequestDetail = {
    id: updatedPayoutRequest.id,
    user_id: updatedPayoutRequest.user_id,
    wallet_id: updatedPayoutRequest.wallet_id,
    amount_requested: updatedPayoutRequest.amount_requested,
    amount_approved: amountApproved,
    currency: updatedPayoutRequest.currency,
    status: updatedPayoutRequest.status,
    payout_to_user_payment_method_id:
      updatedPayoutRequest.payout_to_user_payment_method_id,
    admin_approver_id: updatedPayoutRequest.admin_approver_id || undefined,
    admin_notes: updatedPayoutRequest.admin_notes || undefined,
    user_notes: updatedPayoutRequest.user_notes || undefined,
    transaction_reference: updatedPayoutRequest.transaction_reference ||
      undefined,
    wallet_transaction_id: updatedPayoutRequest.wallet_transaction_id ||
      undefined,
    requested_at: updatedPayoutRequest.requested_at,
    processed_at: updatedPayoutRequest.processed_at || undefined,
    created_at: updatedPayoutRequest.created_at,
    updated_at: updatedPayoutRequest.updated_at,

    user_name: userName ?? null,
    userEmail: userEmail ?? null, // Ensure null if undefined
    userPhone: userPhone ?? null, // Ensure null if undefined
    userType: "مستخدم معتمد",

    walletBalance: newBalance ?? null,
    walletType: updatedPayoutRequest.wallet?.wallet_type
      ? translateWalletType(updatedPayoutRequest.wallet.wallet_type)
      : undefined,

    paymentMethodName:
      updatedPayoutRequest.user_payment_method?.payment_method?.name ?? null,
    paymentMethodCode:
      updatedPayoutRequest.user_payment_method?.payment_method?.code ?? null,
    paymentMethodType:
      updatedPayoutRequest.user_payment_method?.payment_method?.type ?? null,
    paymentMethodDetails: updatedPayoutRequest.user_payment_method?.details
      ? JSON.stringify(updatedPayoutRequest.user_payment_method.details)
      : null,

    adminName: null,
    translatedStatus: translatePayoutStatus(updatedPayoutRequest.status),
  };

  return result;
}

/**
 * رفض طلب سحب.
 */
export async function rejectPayoutRequest(
  payoutRequestId: string,
  adminId: string,
  adminNotes: string,
): Promise<PayoutRequestDetail> {
  if (!supabase) {
    console.error("Supabase client is not initialized in rejectPayoutRequest");
    throw new Error("Supabase client is not initialized");
  }

  if (!adminNotes || adminNotes.trim() === "") {
    throw new Error("Admin notes (reason for rejection) are mandatory.");
  }

  const { data: payoutRequestBeforeReject, error: fetchError } = await supabase
    .from("payouts")
    .select("status, user_id, amount_requested, currency") // Added user_id, amount_requested, currency
    .eq("id", payoutRequestId)
    .maybeSingle();

  if (fetchError || !payoutRequestBeforeReject) {
    console.error("Error fetching payout request for rejection:", fetchError);
    throw fetchError || new Error("Payout request not found.");
  }

  if (payoutRequestBeforeReject.status !== "PENDING_APPROVAL") {
    throw new Error(
      "Payout request is not pending approval and cannot be rejected.",
    );
  }

  // 1. Create a central transaction log for the rejection
  const shortPayoutRequestId = payoutRequestId.substring(0, 8);
  const shortAdminId = adminId.substring(0, 8);
  const rejectionTransactionDescription =
    `تم رفض طلب السحب رقم: ${shortPayoutRequestId} للمستخدم ${
      payoutRequestBeforeReject.user_id?.substring(0, 8) || "غير معروف"
    }. بواسطة المسؤول: ${shortAdminId}. السبب: ${adminNotes}`;

  const centralTransactionData: CentralTransactionInsertData = {
    type: "PAYOUT_REJECTED", // New transaction type
    amount: 0, // No monetary value for rejection, or payoutRequestBeforeReject.amount_requested if needed for info
    currency: payoutRequestBeforeReject.currency,
    status: "COMPLETED", // The rejection action itself is completed
    description: rejectionTransactionDescription,
    initiated_by_user_id: adminId,
    initiator_type: "ADMIN",
    payout_request_id: payoutRequestId,
    admin_notes: adminNotes, // Storing the rejection reason here as well
  };

  const { data: centralTransaction, error: centralTxError } = await supabase // Renamed to centralTransaction
    .from("transactions")
    .insert(centralTransactionData)
    .select("transaction_id") // Minimal select, or more if needed
    .single(); // Added .single() to get the object directly

  if (centralTxError || !centralTransaction) { // Check for centralTransaction as well
    console.error(
      "Error creating central transaction for payout rejection:",
      centralTxError,
    );
    throw centralTxError ||
      new Error("Failed to create central transaction for rejection");
  }

  // 2. Update the payout request status
  const payoutUpdateData = {
    status: "REJECTED" as const,
    admin_approver_id: adminId,
    admin_notes: adminNotes,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related_transaction_id: centralTransaction.transaction_id, // Corrected to use centralTransaction.transaction_id
  };

  const { data: updatedPayoutRequestData, error: updatePayoutError } =
    await supabase
      .from("payouts")
      .update(payoutUpdateData)
      .eq("id", payoutRequestId)
      .select(
        "*, user_payment_method:user_payment_methods(*, payment_method:payment_methods(*))",
      )
      .maybeSingle();

  if (updatePayoutError || !updatedPayoutRequestData) {
    console.error("Error updating payout request status:", updatePayoutError);
    throw updatePayoutError ||
      new Error("Failed to update payout request status.");
  }

  const rawRejectedPayout = updatedPayoutRequestData as RawPayoutData;

  let userName: string | null = null;
  let userEmail: string | null = null;
  let userPhone: string | null = null;

  if (rawRejectedPayout.user_id) {
    const userId = rawRejectedPayout.user_id;
    const { data: authUser, error: authUserError } = await supabase
      .rpc("get_user_details_by_id", { user_id_to_fetch: userId })
      .maybeSingle<
        {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string | null;
        }
      >();

    if (!authUserError && authUser) {
      userEmail = authUser.email || userEmail;
      userPhone = authUser.phone || userPhone;
      userName = authUser.full_name || userName;
    } else if (authUserError) {
      console.error(
        `Error fetching auth.users for ${userId} in rejectPayoutRequest via RPC:`,
        authUserError,
      );
    }

    const { data: newProfile, error: newProfileError } = await supabase.from(
      "new_profiles",
    ).select("id, full_name, email, phone_number").eq("id", userId)
      .maybeSingle();
    if (!newProfileError && newProfile) {
      userName = newProfile.full_name || userName;
      userEmail = newProfile.email || userEmail;
      userPhone = newProfile.phone_number || userPhone;
    } else if (newProfileError && newProfileError.code !== "PGRST116") {
      console.error(
        "Error fetching new_profiles in rejectPayoutRequest:",
        newProfileError,
      );
    }

    const { data: deliveryProfile, error: deliveryProfileError } =
      await supabase.from("new_profiles_delivery").select(
        "user_id, full_name, email, phone",
      ).eq("user_id", userId).maybeSingle();
    if (!deliveryProfileError && deliveryProfile) {
      userName = deliveryProfile.full_name || userName;
      userEmail = deliveryProfile.email || userEmail;
      userPhone = deliveryProfile.phone || userPhone;
    } else if (
      deliveryProfileError && deliveryProfileError.code !== "PGRST116"
    ) {
      console.error(
        "Error fetching new_profiles_delivery in rejectPayoutRequest:",
        deliveryProfileError,
      );
    }

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("admins").select("user_id, full_name, email, phone").eq(
        "user_id",
        userId,
      ).maybeSingle();
    if (!adminProfileError && adminProfile) {
      userName = adminProfile.full_name || userName;
      userEmail = adminProfile.email || userEmail;
      userPhone = adminProfile.phone || userPhone;
    } else if (adminProfileError && adminProfileError.code !== "PGRST116") {
      console.error(
        "Error fetching admins in rejectPayoutRequest:",
        adminProfileError,
      );
    }
  }
  // if (!userName && rawRejectedPayout.user_id) {
  //    userName = `User (${rawRejectedPayout.user_id.substring(0,8)}...)`;
  // }

  return {
    id: rawRejectedPayout.id!,
    user_id: rawRejectedPayout.user_id!,
    wallet_id: rawRejectedPayout.wallet_id!,
    amount_requested: rawRejectedPayout.amount_requested!,
    amount_approved: rawRejectedPayout.amount_approved,
    currency: rawRejectedPayout.currency!,
    status: rawRejectedPayout.status!,
    payout_to_user_payment_method_id: rawRejectedPayout
      .payout_to_user_payment_method_id!,
    admin_approver_id: rawRejectedPayout.admin_approver_id,
    admin_notes: rawRejectedPayout.admin_notes,
    user_notes: rawRejectedPayout.user_notes,
    transaction_reference: rawRejectedPayout.transaction_reference,
    wallet_transaction_id: rawRejectedPayout.wallet_transaction_id,
    requested_at: rawRejectedPayout.requested_at!,
    processed_at: rawRejectedPayout.processed_at,
    created_at: rawRejectedPayout.created_at!,
    updated_at: rawRejectedPayout.updated_at!,

    user_name: userName, // Will be null if not found
    userEmail: userEmail, // Will be null if not found
    userPhone: userPhone, // Will be null if not found
    userType: "مستخدم مرفوض",

    walletBalance: undefined,
    walletType: rawRejectedPayout.wallet?.wallet_type
      ? translateWalletType(rawRejectedPayout.wallet.wallet_type)
      : undefined,

    paymentMethodName:
      rawRejectedPayout.user_payment_method?.payment_method?.name ?? null,
    paymentMethodCode:
      rawRejectedPayout.user_payment_method?.payment_method?.code ?? null,
    paymentMethodType:
      rawRejectedPayout.user_payment_method?.payment_method?.type ?? null,
    paymentMethodDetails: rawRejectedPayout.user_payment_method?.details
      ? JSON.stringify(rawRejectedPayout.user_payment_method.details)
      : null,

    adminName: null,
    translatedStatus: translatePayoutStatus(rawRejectedPayout.status!),
  } as PayoutRequestDetail;
}

// Helper function to fetch user details in batch
interface RpcUserDetailsResponse {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  phone_number?: string | null; // Added phone_number as optional
}

async function fetchUserDetailsInBatch(
  userIds: string[],
): Promise<
  Map<
    string,
    {
      id: string;
      email: string | null;
      fullName: string | null;
      phone?: string | null;
    }
  >
> {
  const userDetailsMap = new Map<
    string,
    {
      id: string;
      email: string | null;
      fullName: string | null;
      phone?: string | null;
    }
  >();
  if (!supabase || userIds.length === 0) return userDetailsMap;

  // Example priority: new_profiles, then new_profiles_delivery, then admins, then rpc as fallback
  const { data: npData, error: npError } = await supabase.from("new_profiles")
    .select("id, full_name, email, phone_number").in("id", userIds);
  if (npError) console.error("Batch fetch new_profiles error:", npError);
  else {npData?.forEach((p) =>
      userDetailsMap.set(p.id, {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        phone: p.phone_number,
      })
    );}

  const { data: dpData, error: dpError } = await supabase.from(
    "new_profiles_delivery",
  ).select("user_id, full_name, email, phone").in("user_id", userIds);
  if (dpError) {
    console.error("Batch fetch new_profiles_delivery error:", dpError);
  } else {dpData?.forEach((p) => {
      if (
        !userDetailsMap.has(p.user_id) ||
        !userDetailsMap.get(p.user_id)?.fullName
      ) { // Prioritize already fetched or more specific names
        const existing = userDetailsMap.get(p.user_id) ||
          { id: p.user_id, email: null, fullName: null, phone: null };
        userDetailsMap.set(p.user_id, {
          ...existing,
          fullName: p.full_name || existing.fullName,
          email: p.email || existing.email,
          phone: p.phone || existing.phone,
        });
      }
    });}
  // ... Add admins fetch similarly if needed

  // RPC as a final fallback or for initial seeding if it provides different info
  for (const userId of userIds) {
    if (!userDetailsMap.has(userId) || !userDetailsMap.get(userId)?.email) { // Only fetch if email is missing for example
      // Standardized to use user_id_param
      const { data: authUser } = await supabase.rpc("get_user_details_by_id", {
        user_id_to_fetch: userId,
      }).single<RpcUserDetailsResponse>();
      if (authUser) {
        const existing = userDetailsMap.get(userId) ||
          { id: userId, email: null, fullName: null, phone: null };
        userDetailsMap.set(userId, {
          ...existing,
          fullName: authUser.full_name || existing.fullName,
          email: authUser.email || existing.email,
          phone: authUser.phone || existing.phone,
        });
      }
    }
  }
  return userDetailsMap;
}

// Constants for default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// Define the default select string for wallet transactions
// prettier-ignore
const defaultSelectStringSimplified = "*"; // Simplest possible select

// Helper function to build the Supabase query for transactions
const buildTransactionsQuery = (
  supabaseClient: SupabaseClient, // Type is now correctly referenced
  filters: AllTransactionsFilters,
  isCountQuery: boolean = false,
) => {
  let query = supabaseClient
    .from("wallet_transactions")
    // When counting, select only 'id' to simplify the query and avoid potential parser errors with complex selects + head:true.
    // For data fetching, use the full defaultSelectString.
    .select(
      isCountQuery ? "id" : defaultSelectStringSimplified, // Use the SIMPLIFIED string
      isCountQuery ? { count: "exact", head: true } : { count: "exact" },
    );

  if (filters.searchQuery) {
    // To search by ID effectively, ensure it's a valid UUID format or handle potential errors if not.
    const looksLikeUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let orFilter =
      `description.ilike.%${filters.searchQuery}%,user_profiles.full_name.ilike.%${filters.searchQuery}%,delivery_boys.full_name.ilike.%${filters.searchQuery}%`;
    if (looksLikeUuid.test(filters.searchQuery)) {
      orFilter += `,id.eq.${filters.searchQuery}`;
    }
    query = query.or(orFilter);
  }
  if (filters.transactionType) {
    query = query.eq("transaction_type", filters.transactionType);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    // Add 1 day to endDate to include the whole day, and format to YYYY-MM-DD for the query
    const endDateObj = new Date(filters.endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    query = query.lt("created_at", endDateObj.toISOString().split("T")[0]);
  }
  if (filters.userId) {
    query = query.eq("initiated_by_user_id", filters.userId);
  }
  if (filters.walletId) {
    query = query.eq("wallet_id", filters.walletId);
  }

  return query;
};

// Interface for getAllTransactions filters
export interface AllTransactionsFilters {
  page?: number;
  limit?: number;
  searchQuery?: string;
  transactionType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  walletId?: string;
  managementActivityType?: "PAYOUT_MANAGEMENT" | "WALLET_MANAGEMENT"; // Added for new filter
}

/**
 * Fetches all transactions with pagination, search, and filtering.
 */
export const getAllTransactions = async (
  filters: AllTransactionsFilters,
): Promise<{ data: TransactionDetail[]; count: number }> => {
  const page = filters.page || DEFAULT_PAGE;
  const limit = filters.limit || DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  if (!supabase) {
    console.error("Supabase client is not initialized in getAllTransactions.");
    return {
      data: [{
        id: "txn_dummy_1",
        date: new Date().toISOString(),
        type: "DUMMY_ORDER_PAYMENT",
        amount: "150.00",
        status: "مكتملة",
        user: "مستخدم تجريبي 1",
        description: "بيانات تجريبية (Supabase غير متصل)",
        currency: "ج.م",
        wallet_id: undefined, // Corrected
      }],
      count: 1,
    };
  }

  try {
    const countQuery = buildTransactionsQuery(supabase, filters, true);
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error fetching transactions count:", countError);
      throw countError;
    }

    let dataQuery = buildTransactionsQuery(supabase, filters, false);
    dataQuery = dataQuery.range(offset, offset + limit - 1).order(
      "created_at",
      { ascending: false },
    );

    const { data: rawTransactionsData, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("Error fetching transactions data:", dataError);
      throw dataError;
    }

    const transactions: TransactionDetail[] =
      (rawTransactionsData as RawTransactionData[])?.map(
        (tx: RawTransactionData): TransactionDetail => {
          let userNameDisplay = "System";
          if (
            tx.initiated_by_user_id === "SYSTEM" || !tx.initiated_by_user_id
          ) {
            userNameDisplay = "النظام";
          } else if (tx.initiated_by_user_id) {
            userNameDisplay = `User ID: ${
              tx.initiated_by_user_id.substring(0, 8)
            }`;
          }

          const adminId = tx.admin_actor_id;

          const transactionDetail: TransactionDetail = {
            id: tx.id,
            date: tx.created_at,
            type: translateTransactionType(tx.transaction_type),
            amount: String(tx.amount),
            status: translateStatus(tx.status),
            description: tx.description || "-",
            currency: tx.currency || "SAR",
            balance_before: tx.balance_before,
            balance_after: tx.balance_after,
            order_id: tx.related_order_id || undefined,
            wallet_id: tx.wallet_id,
            related_transaction_id: tx.related_transaction_id || undefined, // Assuming related_transaction_id might exist on tx
            payment_method_details: undefined, // Keep as undefined if not directly available
            initiatedBy: tx.initiated_by_user_id
              ? (tx.initiator_type || "USER")
              : "SYSTEM", // Use initiator_type if available
            admin_id: adminId || undefined,
            notes: tx.notes || undefined, // Assuming general notes might exist on tx as 'notes'
            user: userNameDisplay,
            payoutRequestId: tx.payout_request_id || undefined, // Use payout_request_id from RawTransactionData
            adminNotes: tx.admin_notes || undefined, // Use admin_notes from RawTransactionData
          };
          return transactionDetail;
        },
      ) || [];

    return { data: transactions, count: count || 0 };
  } catch (error) {
    console.error("Error in getAllTransactions:", error);
    return {
      data: [{
        id: "txn_err_1",
        date: new Date().toISOString(),
        type: "ERROR_TYPE",
        amount: "0.00",
        status: "فاشلة",
        user: "نظام الخطأ",
        description: "حدث خطأ أثناء جلب المعاملات.",
        currency: "ج.م",
        wallet_id: undefined, // Corrected
      }],
      count: 1,
    };
  }
};

interface RawTransactionData {
  id: string;
  created_at: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string | null;
  description: string | null;
  wallet_id: string;
  balance_before: number | null;
  balance_after: number | null;
  related_order_id: string | null;
  initiated_by_user_id: string | null;
  admin_actor_id: string | null;
  original_transaction_id: string | null;
  related_transaction_id?: string | null; // Added: assuming this might come from DB
  notes?: string | null; // Added: general notes field
  payout_request_id?: string | null; // Added: for payout request ID
  admin_notes?: string | null; // Added: for admin notes on payouts
  initiator_type?: string | null; // Added: to specify if user is CLIENT, DELIVERY_AGENT etc.
  user_profiles?: UserProfileData | null;
  delivery_boys?: DeliveryBoyData | null;
  admin_profile?: AdminProfileData | null;
}

// Helper function to build the Supabase query for CENTRAL transactions
const buildCentralTransactionsQuery = (
  supabaseClient: SupabaseClient,
  filters: AllTransactionsFilters,
  isCountQuery: boolean = false,
) => {
  console.log(
    "[buildCentralTransactionsQuery] Received filters:",
    JSON.stringify(filters, null, 2),
  ); // Log received filters
  let query = supabaseClient
    .from("transactions")
    .select(
      isCountQuery ? "transaction_id" : SELECT_TRANSACTIONS_CORE_DETAILS, // استخدام الثابت هنا
      isCountQuery ? { count: "exact", head: true } : { count: "exact" },
    );

  if (filters.searchQuery) {
    const looksLikeUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    // تعديل البحث ليشمل الحقول ذات الصلة في جدول transactions
    // قد نحتاج إلى تعديل هذا بناءً على الأعمدة الفعلية التي يتم البحث فيها
    let orFilter = `description.ilike.%${filters.searchQuery}%`;
    if (looksLikeUuid.test(filters.searchQuery)) {
      orFilter += `,transaction_id.eq.${filters.searchQuery}`;
      if (filters.userId) { // إذا كان البحث UUID وقد يكون userId
        orFilter += `,initiated_by_user_id.eq.${filters.searchQuery}`;
      }
    }
    // TODO: Consider adding search for user names if joined or available directly
    query = query.or(orFilter);
  }
  if (filters.transactionType) {
    query = query.eq("type", filters.transactionType); // الحقل هو 'type' في جدول transactions
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    const endDateObj = new Date(filters.endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    query = query.lt("created_at", endDateObj.toISOString().split("T")[0]);
  }
  if (filters.userId) {
    query = query.eq("initiated_by_user_id", filters.userId);
  }
  // لا يوجد walletId كفلتر مباشر على جدول transactions الرئيسي عادة

  // Apply managementActivityType filter
  if (filters.managementActivityType) {
    if (filters.managementActivityType === "PAYOUT_MANAGEMENT") {
      // Filter for payout-related transactions
      // This can be transactions with a payout_request_id OR specific types like PAYOUT_APPROVED, PAYOUT_REJECTED
      query = query.or(
        'payout_request_id.not.is.null,type.in.("PAYOUT_APPROVED","PAYOUT_REJECTED")',
      );
    } else if (filters.managementActivityType === "WALLET_MANAGEMENT") {
      // Filter for admin-driven wallet management transactions
      // These are direct adjustments or deposits by an admin.
      query = query.eq("initiator_type", "ADMIN");
      query = query.in("type", [
        "ADMIN_CREDIT_ADJUSTMENT",
        "ADMIN_DEBIT_ADJUSTMENT",
        "DEPOSIT",
      ]);
      // For DEPOSIT, we might need a more specific condition if non-admin deposits should be excluded.
      // The current logic includes DEPOSIT if initiator_type is ADMIN.
    }
  }

  return query;
};

/**
 * Fetches all CENTRAL transactions with pagination, search, and filtering.
 */
export const getAllCentralTransactions = async (
  filters: AllTransactionsFilters,
): Promise<{ data: TransactionDetail[]; count: number }> => {
  console.log(
    "[getAllCentralTransactions] Received filters at entry:",
    JSON.stringify(filters, null, 2),
  ); // Log filters at function entry
  const page = filters.page || DEFAULT_PAGE;
  const limit = filters.limit || DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  if (!supabase) {
    console.error(
      "Supabase client is not initialized in getAllCentralTransactions.",
    );
    return {
      data: [{
        id: "txn_dummy_central_1",
        date: new Date().toISOString(),
        type: "DUMMY_CENTRAL_PAYMENT",
        amount: "250.00",
        status: "مكتملة",
        user: "مستخدم مركزي تجريبي 1",
        description: "بيانات تجريبية (Supabase غير متصل)",
        currency: "ج.م",
        wallet_id: undefined, // Corrected
        payoutRequestId: "dummy-payout-req-id",
        adminNotes: "Dummy admin notes for central transaction",
        processedByAdminName: "Admin Dummy",
      }],
      count: 1,
    };
  }

  try {
    const countQuery = buildCentralTransactionsQuery(supabase, filters, true);
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error fetching central transactions count:", countError);
      console.log(
        "[getAllCentralTransactions] Count Query that failed:",
        countQuery.toString(),
      ); // Log the failed query
      throw countError;
    }

    let dataQuery = buildCentralTransactionsQuery(supabase, filters, false);
    // The select string in buildCentralTransactionsQuery already includes the join `payouts(user_id)`
    // so we don't need to add it here again.
    dataQuery = dataQuery.range(offset, offset + limit - 1).order(
      "created_at",
      { ascending: false },
    );

    const { data: rawTransactionsData, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("Error fetching central transactions data:", dataError);
      console.log(
        "[getAllCentralTransactions] Data Query that failed:",
        dataQuery.toString(),
      ); // Log the failed query
      throw dataError;
    }

    const typedRawTransactions =
      rawTransactionsData as unknown as RecentTransactionRawItem[] || [];
    // console.log('Raw transactions data from Supabase:', typedRawTransactions);

    // Extract all relevant user IDs for name fetching
    const userIdsToFetch = new Set<string>();
    typedRawTransactions.forEach((tx) => {
      if (tx.initiated_by_user_id) {
        userIdsToFetch.add(tx.initiated_by_user_id);
      }
      // Re-enable payouts user_id fetching
      if (tx.payouts && tx.payouts.user_id) {
        userIdsToFetch.add(tx.payouts.user_id);
      }
      if (tx.user_id) { // from transactions.user_id
        userIdsToFetch.add(tx.user_id);
      }
    });

    // console.log('User IDs to fetch for names:', Array.from(userIdsToFetch));

    let userDetailsMap = new Map<
      string,
      { fullName: string | null; email: string | null }
    >();
    if (userIdsToFetch.size > 0) {
      userDetailsMap = await fetchUserDetailsInBatch(
        Array.from(userIdsToFetch),
      );
    }
    console.log("Fetched userDetailsMap:", userDetailsMap);

    const transactions: TransactionDetail[] = typedRawTransactions?.map(
      (tx: RecentTransactionRawItem): TransactionDetail => {
        let targetUserName: string | undefined = "System";
        let processingAdminName: string | null = null;

        // Determine Processing Admin Name
        if (tx.initiated_by_user_id && tx.initiator_type === "ADMIN") {
          const adminDetail = userDetailsMap.get(tx.initiated_by_user_id);
          processingAdminName = adminDetail?.fullName ||
            `Admin: ${tx.initiated_by_user_id.substring(0, 8)}`;
        }

        // Determine Target User Name
        const payoutInfo = tx.payouts; // tx.payouts is now a single object or null

        if (payoutInfo && payoutInfo.user_id) {
          const payoutRequesterDetail = userDetailsMap.get(
            payoutInfo.user_id,
          );
          targetUserName = payoutRequesterDetail?.fullName ||
            `User: ${payoutInfo.user_id.substring(0, 8)}`;
        } else if (
          (tx.type === "ADMIN_CREDIT_ADJUSTMENT" ||
            tx.type === "ADMIN_DEBIT_ADJUSTMENT") && tx.user_id
        ) {
          const targetUserDetail = userDetailsMap.get(tx.user_id);
          targetUserName = targetUserDetail?.fullName ||
            `User: ${tx.user_id.substring(0, 8)}`;
        } else if (
          tx.initiator_type !== "ADMIN" && tx.initiator_type !== "SYSTEM" &&
          tx.initiated_by_user_id
        ) {
          const initiatorDetail = userDetailsMap.get(tx.initiated_by_user_id);
          targetUserName = initiatorDetail?.fullName ||
            `User: ${tx.initiated_by_user_id.substring(0, 8)}`;
        } else if (
          tx.initiator_type === "ADMIN" && !tx.user_id &&
          !(payoutInfo && payoutInfo.user_id)
        ) {
          targetUserName = "N/A - Admin Action";
        } else if (tx.initiator_type === "SYSTEM") {
          targetUserName = "System";
        }

        const transactionDetail: TransactionDetail = {
          id: tx.transaction_id,
          date: tx.created_at,
          type: translateTransactionType(tx.type),
          amount: String(tx.amount),
          status: translateStatus(tx.status),
          description: tx.description || "-",
          currency: tx.currency || "SAR",
          user: targetUserName, // This is the target user or a placeholder
          processedByAdminName: processingAdminName, // Name of the admin who processed
          payoutRequestId: tx.payout_request_id || undefined,
          adminNotes: tx.admin_notes || undefined,
          initiatedBy: tx.initiated_by_user_id
            ? (tx.initiator_type || "USER")
            : "SYSTEM",
          // Fields to keep as null/undefined or map if data becomes available:
          balance_before: null,
          balance_after: null,
          order_id: undefined,
          wallet_id: undefined,
          related_transaction_id: undefined,
          payment_method_details: undefined,
          admin_id: tx.initiator_type === "ADMIN"
            ? tx.initiated_by_user_id
            : undefined,
          notes: undefined,
          metadata: undefined,
        };
        return transactionDetail;
      },
    ) || [];

    return { data: transactions, count: count || 0 };
  } catch (error) {
    console.error("Error in getAllCentralTransactions:", error);
    return {
      data: [{
        id: "txn_err_central_1",
        date: new Date().toISOString(),
        type: "ERROR_TYPE_CENTRAL",
        amount: "0.00",
        status: "فاشلة",
        user: "نظام الخطأ المركزي",
        description: "حدث خطأ أثناء جلب المعاملات المركزية.",
        currency: "ج.م",
        wallet_id: undefined, // Corrected
        payoutRequestId: "error-payout-id",
        adminNotes: "Error fetching central transaction notes",
        processedByAdminName: "Admin Error",
      }],
      count: 1,
    };
  }
};

// Define getPagination directly in this file as '../utils/paginationUtils' is not found
const getPagination = (page: number, limit: number) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1; // Supabase range is inclusive
  return { from, to };
};
