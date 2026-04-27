import { ZoonState } from "../../types/state";
import { supabase } from "@/lib/supabase";

/**
 * وكيل المخازن (Inventory Agent) - النسخة المصححة
 * يقوم بجلب كميات المخزون الحقيقية من جدول warehouse_inventory
 */
export async function inventoryAgent(state: ZoonState): Promise<Partial<ZoonState>> {
  console.log(`[Inventory Agent] 📦 Checking stock levels...`);
  const startTime = Date.now();

  try {
    // 1. جلب بيانات المخزون الفعلي للمخلفات والمنتجات
    const { data: inventoryData, error } = await supabase!
      .from('warehouse_inventory')
      .select('quantity, catalog_waste_id, catalog_product_id');

    if (error) throw error;

    // 2. تحليل البيانات وحساب الإجماليات
    let totalWasteWeight = 0;
    let totalProductCount = 0;

    inventoryData?.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      if (item.catalog_waste_id) {
        totalWasteWeight += qty;
      } else if (item.catalog_product_id) {
        totalProductCount += qty;
      }
    });

    // 3. صياغة الرد النهائي
    let summaryText = `تقرير المخزون المحدث 📦:\n`;
    summaryText += `- إجمالي وزن المخلفات: ${totalWasteWeight.toLocaleString()} كجم.\n`;
    summaryText += `- إجمالي المنتجات الجاهزة: ${totalProductCount.toLocaleString()} قطعة.\n`;
    
    if (totalWasteWeight === 0 && totalProductCount === 0) {
      summaryText += `\n⚠️ تنبيه: المخازن تبدو فارغة حالياً.`;
    } else {
      summaryText += `\n✅ البيانات مستخرجة مباشرة من جدول المخزون الفعلي.`;
    }

    const result = {
      totalWasteWeight,
      productCount: totalProductCount,
      status: "success",
      summary: summaryText
    };

    return {
      activeAgent: "inventory",
      agentOutputs: {
        ...state.agentOutputs,
        inventory: {
          agentId: "inventory",
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
          agent: "inventory",
          action: "real_inventory_queried",
          output: result
        }
      ]
    };
  } catch (error: any) {
    console.error("[Inventory Agent] Database Error:", error);
    return {
      errorState: {
        lastError: `خطأ في جلب بيانات المخزون الفعلي: ${error.message}`,
        errorCount: (state.errorState?.errorCount || 0) + 1,
        recoveryAttempted: false
      }
    };
  }
}
