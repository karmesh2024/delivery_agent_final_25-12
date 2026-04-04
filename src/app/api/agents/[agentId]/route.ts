import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/agents/[agentId]
 *
 * يقوم بجلب بيانات المندوب بناء على معرفه
 * يستخدم في صفحة ملخص بيانات المندوب
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: "معرف المندوب مطلوب" }, { status: 400 });
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: "فشل الاتصال بقاعدة البيانات" }, {
        status: 500,
      });
    }

    // استعلام لجلب بيانات المندوب مع المستندات
    const { data, error } = await supabase
      .from("delivery_boys")
      .select(`
        *
      `)
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("خطأ في جلب بيانات المندوب:", error);
      return NextResponse.json({ error: "فشل في جلب بيانات المندوب" }, {
        status: 500,
      });
    }

    if (!data) {
      return NextResponse.json({ error: "لم يتم العثور على المندوب" }, {
        status: 404,
      });
    }

    // تنسيق البيانات لإرجاعها للواجهة
    const formattedData = {
      id: data.id,
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      profile_image_url: data.profile_image_url,
      status: data.status,
      driver_license_number: data.license_number,
      national_id: data.national_id,
      birth_date: data.date_of_birth,
      preferred_vehicle: data.preferred_vehicle,
      created_at: data.created_at,
      delivery_code: data.delivery_code,
      documents: [], // Temporarily set to empty array
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, {
      status: 500,
    });
  }
}

/**
 * PUT /api/agents/[agentId]
 *
 * يقوم بتحديث بيانات المندوب بناء على معرفه
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  if (!agentId) {
    return NextResponse.json({ error: "معرف المندوب مطلوب" }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log(`[API PUT /api/agents/${agentId}] Received body:`, body);

    if (!supabaseServiceRole) {
      return NextResponse.json({
        error: "فشل الاتصال بقاعدة البيانات (service role)",
      }, { status: 500 });
    }

    const {
      name,
      phone,
      delivery_code,
      license_number,
      preferred_vehicle,
      status,
    } = body;

    // Define a more specific type for updateData
    interface DeliveryBoyUpdateData {
      full_name?: string;
      phone?: string;
      delivery_code?: string;
      license_number?: string;
      preferred_vehicle?: string;
      online_status?: string;
      updated_at?: string;
      // Add other potential fields from delivery_boys table if needed
    }

    const updateData: DeliveryBoyUpdateData = {};
    if (name !== undefined) updateData.full_name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (delivery_code !== undefined) updateData.delivery_code = delivery_code;
    if (license_number !== undefined) {
      updateData.license_number = license_number;
    }
    if (preferred_vehicle !== undefined) {
      updateData.preferred_vehicle = preferred_vehicle;
    }

    if (status !== undefined) {
      // Map frontend status to database enum for online_status
      let dbOnlineStatus: string | undefined = undefined;
      switch (status) {
        case "active":
          dbOnlineStatus = "online";
          break;
        case "inactive":
          dbOnlineStatus = "offline";
          break;
        case "offline":
          dbOnlineStatus = "offline";
          break;
        case "on-trip":
          dbOnlineStatus = "online"; // Assuming 'on-trip' means the agent is working and online
          break;
        // 'pending' and 'banned' are not handled here for online_status
        // If they need to be set for delivery_boy_online_status,
        // this enum must support them or they belong to another field.
        default:
          // If status is something else (like 'pending' or 'banned'),
          // we don't set online_status to avoid errors with the enum.
          // This might need further clarification based on requirements.
          console.warn(
            `[API PUT /api/agents/${agentId}] Unhandled status for online_status mapping: ${status}`,
          );
      }
      if (dbOnlineStatus) {
        updateData.online_status = dbOnlineStatus;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات لتحديثها" }, {
        status: 400,
      });
    }

    updateData.updated_at = new Date().toISOString();

    console.log(
      `[API PUT /api/agents/${agentId}] Updating with data:`,
      updateData,
    );

    const { data, error } = await supabaseServiceRole
      .from("delivery_boys")
      .update(updateData)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.error(
        `[API PUT /api/agents/${agentId}] Error updating agent:`,
        error,
      );
      return NextResponse.json({
        error: "فشل في تحديث بيانات المندوب",
        details: error.message,
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        error: "لم يتم العثور على المندوب بعد التحديث",
      }, { status: 404 });
    }

    console.log(
      `[API PUT /api/agents/${agentId}] Agent updated successfully:`,
      data,
    );
    return NextResponse.json(data);
  } catch (err: unknown) { // Use unknown for error type
    console.error(`[API PUT /api/agents/${agentId}] Unexpected error:`, err);
    let errorMessage = "حدث خطأ غير متوقع أثناء معالجة الطلب";
    let errorDetails: string | undefined = undefined;

    if (err instanceof Error) {
      errorDetails = err.message;
      if (
        err.message.includes("Unexpected token") ||
        err.message.includes("JSON at position")
      ) {
        errorMessage = "بيانات الطلب غير صالحة (Invalid JSON)";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }
    return NextResponse.json({ error: errorMessage, details: errorDetails }, {
      status: 500,
    });
  }
}

/**
 * DELETE /api/agents/[agentId]
 * 
 * يقوم بحذف المندوب (حذف ناعم عن طريق تغيير الحالة) بصورة افتراضية
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: "معرف المندوب مطلوب" }, { status: 400 });
  }

  try {
    if (!supabaseServiceRole) {
      return NextResponse.json({ error: "فشل الاتصال بقاعدة البيانات" }, { status: 500 });
    }

    const { data: agent, error: fetchError } = await supabaseServiceRole
      .from("delivery_boys")
      .select("id, status")
      .eq("id", agentId)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({ error: "المندوب غير موجود" }, { status: 404 });
    }

    const { error: updateError } = await supabaseServiceRole
      .from("delivery_boys")
      .update({ 
        status: "inactive",
        online_status: "offline",
        updated_at: new Date().toISOString()
      })
      .eq("id", agentId);

    if (updateError) {
      return NextResponse.json({ 
        error: "فشل تحديث حالة المندوب",
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: "تم حذف المندوب بنجاح" });

  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء الحذف" }, { status: 500 });
  }
}
