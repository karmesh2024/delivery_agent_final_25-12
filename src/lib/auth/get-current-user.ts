import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiLogger, logger } from "../logger-safe";

/**
 * الحصول على معرف المستخدم الحالي (user_id) من الطلب
 */
export async function getCurrentUserId(
  request: NextRequest,
): Promise<string | null> {
  try {
    logger.debug("[getCurrentUserId] Starting to get user ID...");
    // محاولة الحصول من headers أولاً (الأولوية للتوكن في Authorization header)
    const authHeader = request.headers.get("authorization") ||
      request.headers.get("Authorization");
    logger.debug("[getCurrentUserId] Auth header exists:", {
      exists: !!authHeader,
      length: authHeader?.length || 0,
    });

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      logger.debug("[getCurrentUserId] Token extracted", {
        length: token?.length || 0,
        isValid: !!(token && token !== "null" && token !== "undefined"),
      });

      if (token && token !== "null" && token !== "undefined") {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          );

          logger.debug(
            "[getCurrentUserId] Calling supabase.auth.getUser with token...",
          );
          const { data: { user }, error } = await supabase.auth.getUser(token);

          if (!error && user) {
            logger.debug("[getCurrentUserId] User found from token:", {
              userId: user.id,
            });
            return user.id;
          } else if (error) {
            apiLogger.warn(
              "[getCurrentUserId] Error getting user from token:",
              { error: error.message },
            );
          } else {
            logger.warn("[getCurrentUserId] No user returned from token");
          }
        } catch (tokenError) {
          apiLogger.warn("[getCurrentUserId] Error processing token:", {
            error: tokenError,
          });
        }
      } else {
        logger.warn("[getCurrentUserId] Token is invalid or empty");
      }
    } else {
      logger.warn("[getCurrentUserId] No auth header found");
    }

    // محاولة الحصول من cookies (للطلبات من المتصفح)
    // Supabase يستخدم عدة أنواع من cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    // البحث عن access token في cookies
    const possibleTokenKeys = [
      "sb-access-token",
      "sb-auth-token",
      "supabase.auth.token",
      "sb-" +
      process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] +
      "-auth-token",
    ];

    for (const key of possibleTokenKeys) {
      const token = cookies[key];
      if (token) {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            },
          );

          // محاولة parse الـ token إذا كان JSON
          let parsedToken = token;
          try {
            const parsed = JSON.parse(token);
            if (parsed.access_token) {
              parsedToken = parsed.access_token;
            }
          } catch {
            // إذا لم يكن JSON، استخدمه كما هو
          }

          const { data: { user }, error } = await supabase.auth.getUser(
            parsedToken,
          );
          if (!error && user) {
            return user.id;
          }
        } catch (cookieError) {
          // تجاهل الأخطاء والانتقال للـ cookie التالي
        }
      }
    }

    // محاولة استخدام cookies مباشرة مع Supabase client
    try {
      // إنشاء Supabase client مع cookies من الطلب
      const cookieString = request.headers.get("cookie") || "";
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Cookie: cookieString,
            },
          },
        },
      );

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return user.id;
      }
    } catch (cookieError) {
      apiLogger.warn("[getCurrentUserId] Error using cookies:", {
        error: cookieError,
      });
    }

    return null;
  } catch (error) {
    apiLogger.error("[getCurrentUserId] Error getting current user:", {
      error,
    });
    return null;
  }
}

/**
 * الحصول على معرف المسؤول (admin.id) من user_id
 */
export async function getCurrentAdminId(
  request: NextRequest,
): Promise<string | null> {
  try {
    logger.debug("[getCurrentAdminId] Starting to get admin ID...");

    // الحصول على التوكن أولاً
    const authHeader = request.headers.get("authorization") ||
      request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    logger.debug("[getCurrentAdminId] Token check:", {
      exists: !!token,
      length: token?.length || 0,
    });

    if (!token || token === "null" || token === "undefined") {
      logger.warn("[getCurrentAdminId] No valid token found");
      return null;
    }

    // استخدام التوكن للحصول على user_id مباشرة
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // الحصول على user من التوكن
    logger.debug("[getCurrentAdminId] Calling supabase.auth.getUser...");
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token,
    );

    if (userError) {
      apiLogger.error("[getCurrentAdminId] Error getting user from token:", {
        error: userError.message,
      });
      return null;
    }

    if (!user) {
      logger.warn("[getCurrentAdminId] No user returned from token");
      return null;
    }

    logger.debug("[getCurrentAdminId] User ID from token:", {
      userId: user.id,
    });

    // البحث عن admin.id من user_id
    // استخدام Service Role Key مباشرة لتجنب مشاكل RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      logger.debug(
        "[getCurrentAdminId] Using service role key to query admins table",
      );
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError) {
        apiLogger.error(
          "[getCurrentAdminId] Error fetching admin with service role:",
          { error: adminError },
        );
        return null;
      }

      logger.debug("[getCurrentAdminId] Admin data found:", { adminData });
      const adminId = adminData?.id || null;
      logger.debug("[getCurrentAdminId] Returning admin ID:", { adminId });
      return adminId;
    } else {
      // Fallback: استخدام Supabase client مع التوكن
      logger.debug(
        "[getCurrentAdminId] Service role key not found, using token-based query",
      );
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        apiLogger.error("[getCurrentAdminId] Error fetching admin:", { error });
        return null;
      }

      logger.debug("[getCurrentAdminId] Admin data found:", { adminData });
      const adminId = adminData?.id || null;
      logger.debug("[getCurrentAdminId] Returning admin ID:", { adminId });
      return adminId;
    }
  } catch (error) {
    apiLogger.error("[getCurrentAdminId] Error getting admin ID:", { error });
    return null;
  }
}
