import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

// إخبار Next.js بأن هذا المسار ديناميكي دائماً ولا يجب محاولة بنائه مسبقاً
export const dynamic = "force-dynamic";

// وظيفة لإنشاء عميل Supabase عند الحاجة فقط لضمان عدم الانهيار أثناء البناء
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase URL and Service Key are required for this API route",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// معالجة طلب POST لنسخ بيانات المندوب إلى الجداول الرئيسية
export async function POST(request: Request) {
  try {
    // استخراج معرف المندوب من طلب API
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "معرف المندوب مطلوب" },
        { status: 400 },
      );
    }

    console.log("جاري نسخ بيانات المندوب بمعرف:", id);

    // الحصول على عميل Supabase
    const supabase = getSupabaseClient();

    // استدعاء وظيفة SQL لنسخ البيانات إلى الجداول الرئيسية
    const { data, error } = await supabase.rpc(
      "copy_delivery_boy_to_main_tables",
      {
        delivery_boy_id: id,
      },
    );

    if (error) {
      console.error("خطأ أثناء نسخ بيانات المندوب:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    console.log("تم نسخ بيانات المندوب بنجاح:", data);

    return NextResponse.json({
      success: true,
      message: "تم نسخ بيانات المندوب بنجاح إلى الجداول الرئيسية",
      data,
    });
  } catch (e) {
    console.error("استثناء غير متوقع:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء نسخ بيانات المندوب" },
      { status: 500 },
    );
  }
}
