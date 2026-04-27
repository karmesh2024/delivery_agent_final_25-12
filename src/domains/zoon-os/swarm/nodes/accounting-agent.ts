import { ZoonState } from "../../types/state";
import { getProfitabilityStats } from "@/services/profitabilityService";

export async function accountingAgent(state: ZoonState): Promise<Partial<ZoonState>> {
  console.log(`[Accounting Agent] 💰 Processing real financial request...`);
  const startTime = Date.now();

  try {
    // 1. تحديد الفترة بناءً على رسالة المستخدم
    const userMsg = state.userInput.toLowerCase();
    let period: 'daily' | 'weekly' | 'monthly' = 'daily';
    let periodLabel = "اليوم";

    if (userMsg.includes("شهر") || userMsg.includes("month")) {
      period = 'monthly';
      periodLabel = "هذا الشهر";
    } else if (userMsg.includes("أسبوع") || userMsg.includes("week")) {
      period = 'weekly';
      periodLabel = "هذا الأسبوع";
    }

    // 2. جلب البيانات الحقيقية من Supabase
    const stats = await getProfitabilityStats(period);

    // 3. تجهيز النتيجة
    const result = {
      totalBuy: stats.total_buy,
      totalSell: stats.total_sell,
      totalProfit: stats.total_profit,
      sessionCount: stats.session_count,
      period: period,
      status: "success",
      summary: `إحصائيات ${periodLabel}:
- إجمالي مبيعاتك: ${stats.total_sell.toLocaleString()} جنيه.
- عدد العمليات: ${stats.session_count} عملية.
- صافي الربح التقديري: ${stats.total_profit.toLocaleString()} جنيه.`
    };

    return {
      activeAgent: "accounting",
      agentOutputs: {
        ...state.agentOutputs,
        accounting: {
          agentId: "accounting",
          result: result,
          confidence: 1.0,
          tokensUsed: 0,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      },
      trace: [
        {
          timestamp: new Date().toISOString(),
          agent: "accounting",
          action: `Fetched ${period} stats from database`,
          output: result
        }
      ]
    };
  } catch (error: any) {
    console.error("[Accounting Agent] Database Error:", error);
    return {
      errorState: {
        lastError: `خطأ في جلب بيانات الحسابات: ${error.message}`,
        errorCount: (state.errorState?.errorCount || 0) + 1,
        recoveryAttempted: false
      }
    };
  }
}
