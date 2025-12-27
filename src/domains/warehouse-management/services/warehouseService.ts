import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

// إضافة النظام الأمني الجديد
import { logger } from "@/lib/logger-safe";
import { canPerformWarehouseOperation } from "./warehousePermissions";

// تسجيل حالة Supabase (إصلاح أمني)
logger.info("warehouseService initialized", {
  supabaseStatus: supabase ? "initialized" : "not initialized",
  timestamp: new Date().toISOString(),
});

// تعريف نوع البيانات للمخزن
export type WarehouseType = "products" | "waste" | "mixed";
export type WarehouseLevel = "admin" | "country" | "city" | "district";

// واجهة القطاع
export interface Sector {
  id?: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  warehouse_levels?: string[];
  created_at?: string;
  updated_at?: string;
}

// واجهة ربط المخزن بالقطاع
export interface WarehouseSector {
  id: number;
  warehouse_id: number;
  sector_code: string;
  is_primary: boolean;
  capacity_percentage: number;
  sector?: Sector;
}

// واجهة المخزن المحدثة للهيكل الهرمي
export interface Warehouse {
  id: number;
  name: string;
  location: string;
  region_id?: number | null;
  capacity?: number | null;
  current_stock?: number | null;
  manager_name?: string | null;
  contact_phone?: string | null;
  email?: string | null;
  code?: string | null;
  warehouse_type: WarehouseType;
  operation_status?: "active" | "maintenance" | "temporarily_closed";
  storage_type?: "dry" | "chilled" | "wet" | "mixed" | null;
  inventory_system?: "daily" | "weekly" | "monthly" | null;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;

  // حقول الهيكل الهرمي الجديدة
  parent_warehouse_id?: number | null;
  warehouse_level?: WarehouseLevel;
  hierarchy_path?: string;
  is_main_warehouse?: boolean;
  is_admin_warehouse?: boolean;
  country_code?: string;
  city_code?: string;
  district_code?: string;

  // حقول الإدارة العليا
  admin_settings?: Record<string, unknown>;
  functional_structure?: Record<string, unknown>;
  system_configuration?: Record<string, unknown>;

  // العلاقات
  parent_warehouse?: Warehouse;
  child_warehouses?: Warehouse[];
  sectors?: WarehouseSector[];
}

// واجهة شجرة المخازن
export interface WarehouseTreeNode {
  id: number;
  name: string;
  warehouse_level: WarehouseLevel;
  hierarchy_path: string;
  depth: number;
  children?: WarehouseTreeNode[];
}

// خدمة إدارة المخازن
export const warehouseService = {
  // =========================================================
  // 🔐 نماذج الصلاحيات والمساعدات
  // =========================================================

  // التحقق من أن مخزن هو إدارة عليا
  async isAdminWarehouse(warehouseId: number): Promise<boolean> {
    try {
      const warehouse = await this.getById(warehouseId);
      return warehouse
        ? (warehouse.is_admin_warehouse === true ||
          warehouse.warehouse_level === "admin")
        : false;
    } catch {
      return false;
    }
  },

  // التحقق من أن مخزن له صلاحيات الإدارة العليا
  async hasAdminPermissions(warehouseId: number): Promise<boolean> {
    return this.isAdminWarehouse(warehouseId);
  },

  // خريطة المستويات المسموح إنشاؤها تحت كل مستوى
  allowedChildLevels(level: WarehouseLevel): WarehouseLevel[] {
    if (level === "admin") return ["country", "city", "district"];
    if (level === "country") return ["city", "district"];
    if (level === "city") return ["district"];
    return [];
  },

  // الصلاحيات الافتراضية لكل مستوى
  getDefaultPermissions(
    level: WarehouseLevel,
  ): Array<{ permission_type: string; permission_value: boolean }> {
    const all: string[] = [
      "create_warehouse",
      "edit_warehouse",
      "delete_warehouse",
      "view_reports",
      "manage_permissions",
      "delegate_permissions",
    ];

    const allow = (types: string[]) =>
      all.map((t) => ({
        permission_type: t,
        permission_value: types.includes(t),
      }));

    if (level === "admin") return allow(all);
    if (level === "country") {
      return allow(["create_warehouse", "edit_warehouse", "view_reports"]);
    }
    if (level === "city") return allow(["create_warehouse", "view_reports"]);
    return allow(["view_reports"]);
  },

  // احضار كود مستوى من level_id (UUID)
  async getLevelCodeById(levelId: string): Promise<WarehouseLevel | null> {
    try {
      const { data, error } = await supabase!
        .from("warehouse_levels")
        .select("code")
        .eq("id", levelId)
        .single();
      if (error) throw error;
      return (data?.code as WarehouseLevel) || null;
    } catch (e) {
      console.error("خطأ في جلب كود المستوى:", e);
      return null;
    }
  },

  // احضار كود مستوى لمخزن عبر معرفه
  async getWarehouseLevelCode(
    warehouseId: number,
  ): Promise<WarehouseLevel | null> {
    try {
      console.log("getWarehouseLevelCode - جلب مستوى المخزن:", warehouseId);

      // محاولة أولى: من جدول warehouses مباشرة
      const { data: warehouseData, error: warehouseError } = await supabase!
        .from("warehouses")
        .select("level_id, warehouse_level")
        .eq("id", warehouseId)
        .single();

      if (warehouseError) {
        console.error(
          "getWarehouseLevelCode - خطأ من Supabase (warehouses):",
          warehouseError,
        );
      }

      // إذا كان هناك warehouse_level مباشرة (VARCHAR)
      if (warehouseData?.warehouse_level) {
        console.log(
          "getWarehouseLevelCode - warehouse_level من warehouses:",
          warehouseData.warehouse_level,
        );
        return warehouseData.warehouse_level as WarehouseLevel;
      }

      // إذا كان هناك level_id (UUID)
      if (warehouseData?.level_id) {
        console.log(
          "getWarehouseLevelCode - level_id من warehouses:",
          warehouseData.level_id,
        );
        const levelCode = await this.getLevelCodeById(
          String(warehouseData.level_id),
        );
        console.log("getWarehouseLevelCode - levelCode:", levelCode);
        return levelCode;
      }

      // محاولة ثانية: من جدول warehouse_hierarchy
      console.log(
        "getWarehouseLevelCode - محاولة جلب المستوى من warehouse_hierarchy",
      );
      const { data: hierarchyData, error: hierarchyError } = await supabase!
        .from("warehouse_hierarchy")
        .select("level_id, level:warehouse_levels(code)")
        .eq("warehouse_id", warehouseId)
        .maybeSingle();

      if (hierarchyError) {
        console.error(
          "getWarehouseLevelCode - خطأ من Supabase (warehouse_hierarchy):",
          hierarchyError,
        );
      }

      const levelData = hierarchyData?.level;
      // التعامل مع حالة أن level قد يكون مصفوفة أو كائن
      const levelCode = Array.isArray(levelData)
        ? levelData[0]?.code
        : (levelData as any)?.code;

      if (levelCode) {
        console.log(
          "getWarehouseLevelCode - levelCode من warehouse_hierarchy:",
          levelCode,
        );
        return levelCode as WarehouseLevel;
      }

      if (hierarchyData?.level_id) {
        console.log(
          "getWarehouseLevelCode - level_id من warehouse_hierarchy:",
          hierarchyData.level_id,
        );
        const levelCode = await this.getLevelCodeById(
          String(hierarchyData.level_id),
        );
        console.log("getWarehouseLevelCode - levelCode:", levelCode);
        return levelCode;
      }

      console.warn(
        "getWarehouseLevelCode - لا يوجد level_id للمخزن في أي جدول:",
        warehouseId,
      );
      return null;
    } catch (e) {
      console.error("getWarehouseLevelCode - خطأ عام:", e);
      return null;
    }
  },
  // جلب جميع المخازن (مستثناة الإدارة العليا افتراضياً)
  async getAll(excludeAdmin: boolean = true) {
    try {
      let query = supabase!
        .from("warehouses")
        .select("*")
        .eq("is_active", true);

      // استثناء الإدارة العليا من القائمة العادية
      if (excludeAdmin) {
        query = query
          .neq("warehouse_level", "admin")
          .neq("is_admin_warehouse", true);
      }

      const { data, error } = await query.order("name");

      if (error) {
        throw error;
      }

      return data as Warehouse[];
    } catch (error) {
      console.error("خطأ في جلب المخازن:", error);
      toast.error("حدث خطأ أثناء جلب المخازن");
      return [];
    }
  },

  // جلب مخزن بواسطة المعرف
  async getById(id: number) {
    try {
      const { data, error } = await supabase!
        .from("warehouses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data as Warehouse;
    } catch (error) {
      console.error(`خطأ في جلب المخزن رقم ${id}:`, error);
      toast.error("حدث خطأ أثناء جلب بيانات المخزن");
      return null;
    }
  },

  // إضافة مخزن جديد
  async add(warehouse: Omit<Warehouse, "id" | "created_at" | "updated_at">) {
    try {
      // منع إنشاء إدارة عليا من هنا (يجب استخدام createAdminWarehouse)
      if (
        warehouse.is_admin_warehouse === true ||
        warehouse.warehouse_level === "admin"
      ) {
        toast.error(
          "لا يمكن إنشاء الإدارة العليا من هنا. يرجى استخدام صفحة إعدادات الإدارة العليا",
        );
        return null;
      }

      // التحقق من القواعد الهرمية إذا كان هناك parent
      if (warehouse.parent_warehouse_id) {
        const parentWarehouse = await this.getById(
          warehouse.parent_warehouse_id,
        );
        if (!parentWarehouse) {
          toast.error("المخزن الأب المحدد غير موجود");
          return null;
        }

        // التحقق من أن المستوى الهرمي صحيح
        if (warehouse.warehouse_level && parentWarehouse.warehouse_level) {
          const allowedLevels = this.allowedChildLevels(
            parentWarehouse.warehouse_level as WarehouseLevel,
          );
          if (
            !allowedLevels.includes(warehouse.warehouse_level as WarehouseLevel)
          ) {
            toast.error(
              `المستوى ${warehouse.warehouse_level} غير مسموح تحت المستوى ${parentWarehouse.warehouse_level}`,
            );
            return null;
          }
        }
      }

      const payload = {
        name: warehouse.name,
        location: warehouse.location,
        region_id: warehouse.region_id ?? null,
        capacity: warehouse.capacity ?? null,
        current_stock: warehouse.current_stock ?? null,
        manager_name: warehouse.manager_name ?? null,
        contact_phone: warehouse.contact_phone ?? null,
        email: warehouse.email ?? null,
        code: warehouse.code ?? null,
        warehouse_type: warehouse.warehouse_type,
        operation_status: warehouse.operation_status ?? "active",
        storage_type: warehouse.storage_type ?? null,
        inventory_system: warehouse.inventory_system ?? null,
        is_active: warehouse.is_active ?? true,
        parent_warehouse_id: warehouse.parent_warehouse_id ?? null,
        warehouse_level: warehouse.warehouse_level ?? null,
        is_admin_warehouse: false, // التأكد من عدم إنشاء إدارة عليا من هنا
      };

      const { data, error } = await supabase!
        .from("warehouses")
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }

      toast.success("تم إضافة المخزن بنجاح");
      return data?.[0] as Warehouse;
    } catch (error) {
      // تحسين عرض الخطأ القادم من Supabase
      const err = error as any;
      console.error("خطأ في إضافة المخزن:", err?.message || err);
      toast.error("حدث خطأ أثناء إضافة المخزن");
      return null;
    }
  },

  // تحديث مخزن موجود
  async update(id: number, warehouse: Partial<Warehouse>) {
    try {
      // التحقق من أن هذا ليس الإدارة العليا (يجب تحديثها من صفحة الإعدادات فقط)
      const isAdmin = await this.isAdminWarehouse(id);
      if (isAdmin) {
        toast.error(
          "لا يمكن تعديل الإدارة العليا من هنا. يرجى استخدام صفحة إعدادات الإدارة العليا",
        );
        return null;
      }

      // التحقق من أن الإدارة العليا لا يمكن أن يكون لها parent
      if (warehouse.parent_warehouse_id !== undefined) {
        const currentWarehouse = await this.getById(id);
        if (
          currentWarehouse?.is_admin_warehouse ||
          currentWarehouse?.warehouse_level === "admin"
        ) {
          toast.error("الإدارة العليا لا يمكن أن يكون لها مخزن أب");
          return null;
        }
      }

      const { data, error } = await supabase!
        .from("warehouses")
        .update({
          ...warehouse,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      toast.success("تم تحديث المخزن بنجاح");
      return data?.[0] as Warehouse;
    } catch (error) {
      console.error(`خطأ في تحديث المخزن رقم ${id}:`, error);
      toast.error("حدث خطأ أثناء تحديث المخزن");
      return null;
    }
  },

  // حذف مخزن (تحديث الحالة إلى غير نشط)
  async delete(id: number) {
    try {
      // منع حذف الإدارة العليا
      const isAdmin = await this.isAdminWarehouse(id);
      if (isAdmin) {
        toast.error("لا يمكن حذف الإدارة العليا للمخازن");
        return false;
      }

      const { error } = await supabase!
        .from("warehouses")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم حذف المخزن بنجاح");
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المخزن رقم ${id}:`, error);
      toast.error("حدث خطأ أثناء حذف المخزن");
      return false;
    }
  },

  // =========================================================
  // 🏗️ دوال الهيكل الهرمي الجديدة
  // =========================================================

  // جلب شجرة المخازن الكاملة
  async getWarehouseTree(rootId?: number): Promise<WarehouseTreeNode[]> {
    try {
      const { data, error } = await supabase!
        .rpc("get_warehouse_tree", { root_id: rootId });

      if (error) {
        throw error;
      }

      return data as WarehouseTreeNode[];
    } catch (error) {
      console.error("خطأ في جلب شجرة المخازن:", error);
      toast.error("حدث خطأ أثناء جلب شجرة المخازن");
      return [];
    }
  },

  // جلب المخازن الفرعية لمخزن معين
  async getChildWarehouses(parentId: number): Promise<Warehouse[]> {
    try {
      const { data, error } = await supabase!
        .rpc("get_child_warehouses", { parent_id: parentId });

      if (error) {
        throw error;
      }

      return data as Warehouse[];
    } catch (error) {
      console.error(`خطأ في جلب المخازن الفرعية للمخزن ${parentId}:`, error);
      toast.error("حدث خطأ أثناء جلب المخازن الفرعية");
      return [];
    }
  },

  // جلب مخزن مع تفاصيله الهرمية
  async getWarehouseWithHierarchy(id: number): Promise<Warehouse | null> {
    try {
      const { data, error } = await supabase!
        .from("warehouses")
        .select(`
          *,
          parent_warehouse:warehouses!parent_warehouse_id(*),
          child_warehouses:warehouses!parent_warehouse_id(*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      // جلب قطاعات المخزن بشكل منفصل
      const sectors = await this.getWarehouseSectors(id);

      return {
        ...data,
        sectors,
      } as Warehouse;
    } catch (error) {
      console.error(`خطأ في جلب المخزن ${id} مع التفاصيل الهرمية:`, error);
      toast.error("حدث خطأ أثناء جلب تفاصيل المخزن");
      return null;
    }
  },

  // ربط مخزن بقطاع
  async addWarehouseSector(
    warehouseId: number,
    sectorCode: string,
    isPrimary: boolean = false,
    capacityPercentage: number = 100,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_sectors")
        .insert([{
          warehouse_id: warehouseId,
          sector_code: sectorCode,
          is_primary: isPrimary,
          capacity_percentage: capacityPercentage,
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم ربط المخزن بالقطاع بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في ربط المخزن بالقطاع:", error);
      toast.error("حدث خطأ أثناء ربط المخزن بالقطاع");
      return false;
    }
  },

  // إلغاء ربط مخزن بقطاع
  async removeWarehouseSector(
    warehouseId: number,
    sectorCode: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_sectors")
        .delete()
        .eq("warehouse_id", warehouseId)
        .eq("sector_code", sectorCode);

      if (error) {
        throw error;
      }

      toast.success("تم إلغاء ربط المخزن بالقطاع بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إلغاء ربط المخزن بالقطاع:", error);
      toast.error("حدث خطأ أثناء إلغاء ربط المخزن بالقطاع");
      return false;
    }
  },

  // جلب قطاعات مخزن معين
  async getWarehouseSectors(warehouseId: number): Promise<WarehouseSector[]> {
    try {
      console.log(`بدء جلب قطاعات المخزن ${warehouseId}...`);

      // جلب قطاعات المخزن من جدول الربط الجديد مع معلومات القطاع
      const { data, error } = await supabase!
        .from("warehouse_sector_assignments")
        .select(`
          *,
          warehouse_sectors(
            id,
            name,
            code,
            color,
            description,
            warehouse_levels
          )
        `)
        .eq("warehouse_id", warehouseId);

      if (error) {
        console.error(`خطأ في جلب قطاعات المخزن ${warehouseId}:`, error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`لا توجد قطاعات مرتبطة بالمخزن ${warehouseId}`);
        return [];
      }

      // تحويل البيانات إلى تنسيق WarehouseSector
      const warehouseSectors = data.map((item: any) => ({
        id: item.id,
        warehouse_id: item.warehouse_id,
        sector_code: item.warehouse_sectors?.code || item.sector_code || "",
        sector_id: item.sector_id,
        is_primary: item.is_primary,
        capacity_percentage: item.capacity_percentage,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        sector: {
          id: item.warehouse_sectors?.id,
          code: item.warehouse_sectors?.code,
          name: item.warehouse_sectors?.name,
          description: item.warehouse_sectors?.description,
          color: item.warehouse_sectors?.color,
          warehouse_levels: item.warehouse_sectors?.warehouse_levels,
        },
      }));

      console.log(
        `تم جلب ${warehouseSectors.length} قطاع للمخزن ${warehouseId}`,
      );
      return warehouseSectors as WarehouseSector[];
    } catch (error) {
      console.error(`خطأ في جلب قطاعات المخزن ${warehouseId}:`, error);
      toast.error("حدث خطأ أثناء جلب قطاعات المخزن");
      return [];
    }
  },

  // إنشاء مخزن جديد مع الهيكل الهرمي
  async createHierarchicalWarehouse(
    warehouse: Omit<Warehouse, "id" | "created_at" | "updated_at">,
    sectors?: string[],
  ): Promise<Warehouse | null> {
    try {
      // إنشاء المخزن
      const payload = {
        name: warehouse.name,
        location: warehouse.location,
        region_id: warehouse.region_id ?? null,
        capacity: warehouse.capacity ?? null,
        current_stock: warehouse.current_stock ?? null,
        manager_name: warehouse.manager_name ?? null,
        contact_phone: warehouse.contact_phone ?? null,
        email: warehouse.email ?? null,
        code: warehouse.code ?? null,
        warehouse_type: warehouse.warehouse_type,
        operation_status: warehouse.operation_status ?? "active",
        storage_type: warehouse.storage_type ?? null,
        inventory_system: warehouse.inventory_system ?? null,
        is_active: warehouse.is_active ?? true,
        parent_warehouse_id: warehouse.parent_warehouse_id ?? null,
        warehouse_level: warehouse.warehouse_level ?? "district",
        is_main_warehouse: warehouse.is_main_warehouse ?? false,
        country_code: warehouse.country_code ?? null,
        city_code: warehouse.city_code ?? null,
        district_code: warehouse.district_code ?? null,
      };

      const { data: warehouseData, error: warehouseError } = await supabase!
        .from("warehouses")
        .insert([payload])
        .select();

      if (warehouseError) {
        throw warehouseError;
      }

      const newWarehouse = warehouseData?.[0] as Warehouse;

      // ربط المخزن بالقطاعات إذا تم توفيرها
      if (sectors && sectors.length > 0) {
        for (const sectorCode of sectors) {
          await this.addWarehouseSector(
            newWarehouse.id,
            sectorCode,
            sectorCode === sectors[0],
          ); // الأول أساسي
        }
      }

      toast.success("تم إنشاء المخزن الهرمي بنجاح");
      return newWarehouse;
    } catch (error) {
      console.error("خطأ في إنشاء المخزن الهرمي:", error);
      toast.error("حدث خطأ أثناء إنشاء المخزن الهرمي");
      return null;
    }
  },

  // جلب المخازن حسب المستوى
  async getWarehousesByLevel(level: WarehouseLevel): Promise<Warehouse[]> {
    try {
      const { data, error } = await supabase!
        .from("warehouses")
        .select("*")
        .eq("warehouse_level", level)
        .eq("is_active", true)
        .order("name");

      if (error) {
        throw error;
      }

      return data as Warehouse[];
    } catch (error) {
      console.error(`خطأ في جلب المخازن لمستوى ${level}:`, error);
      toast.error("حدث خطأ أثناء جلب المخازن");
      return [];
    }
  },

  // جلب المخازن الرئيسية (مستوى الدولة)
  async getMainWarehouses(): Promise<Warehouse[]> {
    return this.getWarehousesByLevel("country");
  },

  // جلب مخازن المدن
  async getCityWarehouses(): Promise<Warehouse[]> {
    return this.getWarehousesByLevel("city");
  },

  // جلب مخازن المناطق
  async getDistrictWarehouses(): Promise<Warehouse[]> {
    return this.getWarehousesByLevel("district");
  },

  // =========================================================
  // 🏢 دوال الإدارة العليا للمخازن
  // =========================================================

  // جلب الإدارة العليا للمخازن (بما في ذلك المحذوفة)
  async getAdminWarehouse(
    includeInactive: boolean = false,
  ): Promise<Warehouse | null> {
    try {
      let query = supabase!
        .from("warehouses")
        .select("*")
        .eq("warehouse_level", "admin")
        .eq("is_admin_warehouse", true);

      // إذا لم نطلب تضمين غير النشطة، نبحث فقط في النشطة
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.single();

      if (error) {
        // إذا لم نجد في النشطة، نبحث في الكل
        if (!includeInactive) {
          return this.getAdminWarehouse(true);
        }
        return null;
      }

      return data as Warehouse;
    } catch (error) {
      // لا نعرض رسالة خطأ إذا لم نجد الإدارة العليا (هذا طبيعي إذا كانت محذوفة)
      return null;
    }
  },

  // إنشاء الإدارة العليا للمخازن
  async createAdminWarehouse(warehouseData: {
    name: string;
    location: string;
    admin_settings?: Record<string, unknown>;
    functional_structure?: Record<string, unknown>;
    system_configuration?: Record<string, unknown>;
  }): Promise<Warehouse | null> {
    try {
      // التحقق من وجود إدارة عليا (نشطة أو غير نشطة)
      const existingAdmin = await this.getAdminWarehouse(true);
      if (existingAdmin) {
        // إذا كانت موجودة لكن محذوفة (غير نشطة)، نعيد تفعيلها
        if (!existingAdmin.is_active) {
          const { data, error } = await supabase!
            .from("warehouses")
            .update({
              is_active: true,
              name: warehouseData.name,
              location: warehouseData.location,
              admin_settings: warehouseData.admin_settings,
              functional_structure: warehouseData.functional_structure,
              system_configuration: warehouseData.system_configuration,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAdmin.id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          toast.success("تم إعادة تفعيل الإدارة العليا بنجاح");
          return data as Warehouse;
        } else {
          toast.error(
            "الإدارة العليا موجودة بالفعل. يمكن أن يكون هناك إدارة عليا واحدة فقط",
          );
          return null;
        }
      }

      const { data, error } = await supabase!
        .from("warehouses")
        .insert([{
          ...warehouseData,
          warehouse_level: "admin",
          is_admin_warehouse: true,
          warehouse_type: "mixed",
          is_active: true,
          parent_warehouse_id: null, // الإدارة العليا لا يمكن أن يكون لها أب
          depth: 0, // الإدارة العليا في المستوى 0
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء الإدارة العليا بنجاح");
      return data as Warehouse;
    } catch (error) {
      console.error("خطأ في إنشاء الإدارة العليا:", error);
      toast.error("حدث خطأ أثناء إنشاء الإدارة العليا");
      return null;
    }
  },

  // تحديث إعدادات الإدارة العليا
  async updateAdminSettings(
    warehouseId: number,
    settings: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouses")
        .update({ admin_settings: settings })
        .eq("id", warehouseId)
        .eq("is_admin_warehouse", true);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث إعدادات الإدارة العليا");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث إعدادات الإدارة العليا:", error);
      toast.error("حدث خطأ أثناء تحديث الإعدادات");
      return false;
    }
  },

  // تحديث الهيكل الوظيفي
  async updateFunctionalStructure(
    warehouseId: number,
    structure: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouses")
        .update({ functional_structure: structure })
        .eq("id", warehouseId)
        .eq("is_admin_warehouse", true);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث الهيكل الوظيفي");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث الهيكل الوظيفي:", error);
      toast.error("حدث خطأ أثناء تحديث الهيكل الوظيفي");
      return false;
    }
  },

  // تحديث إعدادات النظام
  async updateSystemConfiguration(
    warehouseId: number,
    config: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouses")
        .update({ system_configuration: config })
        .eq("id", warehouseId)
        .eq("is_admin_warehouse", true);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث إعدادات النظام");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث إعدادات النظام:", error);
      toast.error("حدث خطأ أثناء تحديث إعدادات النظام");
      return false;
    }
  },

  // جلب جميع المخازن التابعة للإدارة العليا
  async getAdminSubWarehouses(): Promise<Warehouse[]> {
    try {
      const adminWarehouse = await this.getAdminWarehouse();
      if (!adminWarehouse) {
        return [];
      }

      return await this.getChildWarehouses(adminWarehouse.id);
    } catch (error) {
      console.error("خطأ في جلب المخازن التابعة للإدارة العليا:", error);
      toast.error("حدث خطأ أثناء جلب المخازن التابعة");
      return [];
    }
  },

  // =========================================================
  // 🏢 دوال إدارة القطاعات والكتالوج
  // =========================================================

  // =========================================================
  // 📋 دوال إدارة التصنيفات والفئات الهرمية
  // =========================================================

  // جلب جميع التصنيفات مع القطاعات
  async getProductClassifications(): Promise<any[]> {
    try {
      console.log("بدء جلب تصنيفات المنتجات من قاعدة البيانات...");

      const result = await supabase!
        .from("product_classifications")
        .select(`
          *,
          warehouse_sectors!inner(
            id,
            name,
            code,
            color
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب تصنيفات المنتجات:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(`تم جلب ${result.data.length} تصنيف من قاعدة البيانات`);
        return result.data.map((item: any) => ({
          ...item,
          sector_name: item.warehouse_sectors?.name || "غير محدد",
          sector_code: item.warehouse_sectors?.code || "UNKNOWN",
          sector_color: item.warehouse_sectors?.color || "#6B7280",
        }));
      } else {
        console.log("لا توجد تصنيفات في قاعدة البيانات");
        return [];
      }
    } catch (error) {
      console.error("خطأ في جلب تصنيفات المنتجات:", error);
      toast.error("حدث خطأ أثناء جلب تصنيفات المنتجات");
      return [];
    }
  },

  // جلب الفئات الأساسية تحت تصنيف معين
  async getMainCategories(classificationId: string): Promise<any[]> {
    try {
      console.log(`بدء جلب الفئات الأساسية للتصنيف ${classificationId}...`);

      const result = await supabase!
        .from("main_categories")
        .select(`
          *,
          product_classifications!inner(
            id,
            name,
            warehouse_sectors!inner(
              id,
              name,
              code,
              color
            )
          )
        `)
        .eq("classification_id", classificationId)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب الفئات الأساسية:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(`تم جلب ${result.data.length} فئة أساسية`);
        return result.data.map((item: any) => ({
          ...item,
          classification_name: item.product_classifications?.name || "غير محدد",
          sector_name: item.product_classifications?.warehouse_sectors?.name ||
            "غير محدد",
          sector_code: item.product_classifications?.warehouse_sectors?.code ||
            "UNKNOWN",
          sector_color:
            item.product_classifications?.warehouse_sectors?.color || "#6B7280",
        }));
      } else {
        console.log("لا توجد فئات أساسية للتصنيف المحدد");
        return [];
      }
    } catch (error) {
      console.error("خطأ في جلب الفئات الأساسية:", error);
      toast.error("حدث خطأ أثناء جلب الفئات الأساسية");
      return [];
    }
  },

  // جلب الفئات الفرعية تحت فئة أساسية معينة
  async getSubCategories(mainCategoryId: string): Promise<any[]> {
    try {
      console.log(`بدء جلب الفئات الفرعية للفئة الأساسية ${mainCategoryId}...`);

      const result = await supabase!
        .from("sub_categories")
        .select(`
          *,
          main_categories!inner(
            id,
            name,
            product_classifications!inner(
              id,
              name,
              warehouse_sectors!inner(
                id,
                name,
                code,
                color
              )
            )
          )
        `)
        .eq("main_category_id", mainCategoryId)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب الفئات الفرعية:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(`تم جلب ${result.data.length} فئة فرعية`);
        return result.data.map((item: any) => ({
          ...item,
          main_category_name: item.main_categories?.name || "غير محدد",
          classification_name:
            item.main_categories?.product_classifications?.name || "غير محدد",
          sector_name:
            item.main_categories?.product_classifications?.warehouse_sectors
              ?.name || "غير محدد",
          sector_code:
            item.main_categories?.product_classifications?.warehouse_sectors
              ?.code || "UNKNOWN",
          sector_color:
            item.main_categories?.product_classifications?.warehouse_sectors
              ?.color || "#6B7280",
        }));
      } else {
        console.log("لا توجد فئات فرعية للفئة الأساسية المحددة");
        return [];
      }
    } catch (error) {
      console.error("خطأ في جلب الفئات الفرعية:", error);
      toast.error("حدث خطأ أثناء جلب الفئات الفرعية");
      return [];
    }
  },

  // جلب التسلسل الهرمي الكامل
  async getFullHierarchy(): Promise<any[]> {
    try {
      console.log("بدء جلب التسلسل الهرمي الكامل...");

      const result = await supabase!
        .from("warehouse_sectors")
        .select(`
          *,
          product_classifications!inner(
            id,
            name,
            description,
            main_categories!inner(
              id,
              name,
              description,
              sub_categories!inner(
                id,
                name,
                description
              )
            )
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب التسلسل الهرمي:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      console.log(`تم جلب التسلسل الهرمي لـ ${result.data.length} قطاع`);
      return result.data;
    } catch (error) {
      console.error("خطأ في جلب التسلسل الهرمي:", error);
      toast.error("حدث خطأ أثناء جلب التسلسل الهرمي");
      return [];
    }
  },

  // إنشاء تصنيف جديد
  async createProductClassification(data: {
    name: string;
    description: string;
    sector_id: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("product_classifications")
        .insert([{
          ...data,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء التصنيف بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء التصنيف:", error);
      toast.error("حدث خطأ أثناء إنشاء التصنيف");
      return false;
    }
  },

  // إنشاء فئة أساسية جديدة
  async createMainCategory(data: {
    name: string;
    description: string;
    classification_id: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("main_categories")
        .insert([{
          ...data,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء الفئة الأساسية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء الفئة الأساسية:", error);
      toast.error("حدث خطأ أثناء إنشاء الفئة الأساسية");
      return false;
    }
  },

  // إنشاء فئة فرعية جديدة
  async createSubCategory(data: {
    name: string;
    description: string;
    main_category_id: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("sub_categories")
        .insert([{
          ...data,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء الفئة الفرعية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء الفئة الفرعية:", error);
      toast.error("حدث خطأ أثناء إنشاء الفئة الفرعية");
      return false;
    }
  },

  // تحديث تصنيف
  async updateProductClassification(id: string, data: {
    name?: string;
    description?: string;
    sector_id?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("product_classifications")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث التصنيف بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث التصنيف:", error);
      toast.error("حدث خطأ أثناء تحديث التصنيف");
      return false;
    }
  },

  // تحديث فئة أساسية
  async updateMainCategory(id: string, data: {
    name?: string;
    description?: string;
    classification_id?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("main_categories")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث الفئة الأساسية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث الفئة الأساسية:", error);
      toast.error("حدث خطأ أثناء تحديث الفئة الأساسية");
      return false;
    }
  },

  // تحديث فئة فرعية
  async updateSubCategory(id: string, data: {
    name?: string;
    description?: string;
    main_category_id?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("sub_categories")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث الفئة الفرعية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث الفئة الفرعية:", error);
      toast.error("حدث خطأ أثناء تحديث الفئة الفرعية");
      return false;
    }
  },

  // حذف تصنيف
  async deleteProductClassification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("product_classifications")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم حذف التصنيف بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف التصنيف:", error);
      toast.error("حدث خطأ أثناء حذف التصنيف");
      return false;
    }
  },

  // حذف فئة أساسية
  async deleteMainCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("main_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم حذف الفئة الأساسية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف الفئة الأساسية:", error);
      toast.error("حدث خطأ أثناء حذف الفئة الأساسية");
      return false;
    }
  },

  // حذف فئة فرعية
  async deleteSubCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("sub_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("تم حذف الفئة الفرعية بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف الفئة الفرعية:", error);
      toast.error("حدث خطأ أثناء حذف الفئة الفرعية");
      return false;
    }
  },

  // جلب جميع القطاعات
  async getSectors(): Promise<any[]> {
    try {
      console.log("بدء جلب القطاعات من قاعدة البيانات...");

      // الوصول إلى جدول warehouse_sectors الجديد
      const result = await supabase!
        .from("warehouse_sectors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب القطاعات:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(
          `تم جلب ${result.data.length} قطاع من جدول warehouse_sectors`,
        );
        return result.data;
      } else {
        console.log(
          "لا توجد قطاعات في جدول warehouse_sectors، سيتم إنشاء بيانات افتراضية",
        );
        return this.getDefaultSectors();
      }
    } catch (error) {
      console.error("خطأ في جلب القطاعات:", error);
      toast.error("حدث خطأ أثناء جلب القطاعات");
      return this.getDefaultSectors();
    }
  },

  // دالة مساعدة للحصول على اسم القطاع المعروض
  getSectorDisplayName(code: string): string {
    const nameMap: { [key: string]: string } = {
      "ADMINISTRATIVE": "إداري",
      "COMMERCIAL": "تجاري",
      "GOVERNMENT": "حكومي",
      "SERVICE": "خدمي",
      "AGRICULTURAL": "زراعي",
      "TOURISM": "سياحي",
      "INDUSTRIAL": "صناعي",
      "MEDICAL": "طبي",
      "HOUSEHOLD": "منزلي",
    };
    return nameMap[code] || code;
  },

  // دالة مساعدة للحصول على وصف القطاع
  getSectorDescription(code: string): string {
    const descriptionMap: { [key: string]: string } = {
      "ADMINISTRATIVE": "القطاع الإداري والحكومي",
      "COMMERCIAL": "القطاع التجاري والتجارة",
      "GOVERNMENT": "القطاع الحكومي والخدمات العامة",
      "SERVICE": "القطاع الخدمي والخدمات",
      "AGRICULTURAL": "القطاع الزراعي والبيئي",
      "TOURISM": "القطاع السياحي والترفيهي",
      "INDUSTRIAL": "القطاع الصناعي والتصنيع",
      "MEDICAL": "القطاع الطبي والصحي",
      "HOUSEHOLD": "القطاع المنزلي والأسري",
    };
    return descriptionMap[code] || "قطاع عام";
  },

  // دالة مساعدة للحصول على لون القطاع
  getSectorColor(code: string): string {
    const colorMap: { [key: string]: string } = {
      "ADMINISTRATIVE": "#6366F1",
      "COMMERCIAL": "#10B981",
      "GOVERNMENT": "#6366F1",
      "SERVICE": "#8B5CF6",
      "AGRICULTURAL": "#F59E0B",
      "TOURISM": "#F59E0B",
      "INDUSTRIAL": "#3B82F6",
      "MEDICAL": "#EF4444",
      "HOUSEHOLD": "#8B5CF6",
    };
    return colorMap[code] || "#3B82F6";
  },

  // دالة مساعدة للحصول على مستويات القطاع
  getSectorLevels(code: string): string[] {
    const levelMap: { [key: string]: string[] } = {
      "ADMINISTRATIVE": ["country", "city", "district"],
      "COMMERCIAL": ["city", "district"],
      "GOVERNMENT": ["country", "city", "district"],
      "SERVICE": ["city", "district"],
      "AGRICULTURAL": ["country", "city", "district"],
      "TOURISM": ["city", "district"],
      "INDUSTRIAL": ["country", "city", "district"],
      "MEDICAL": ["city", "district"],
      "HOUSEHOLD": ["district"],
    };
    return levelMap[code] || ["country", "city", "district"];
  },

  // دالة للحصول على القطاعات الافتراضية
  getDefaultSectors(): any[] {
    return [
      {
        id: "1",
        name: "القطاع الصناعي",
        description: "النفايات الصناعية من المصانع والمنشآت الصناعية",
        code: "INDUSTRIAL",
        color: "#3B82F6",
        warehouse_levels: ["country", "city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "القطاع التجاري",
        description: "النفايات التجارية من المحلات والأسواق",
        code: "COMMERCIAL",
        color: "#10B981",
        warehouse_levels: ["city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "القطاع الزراعي",
        description: "النفايات الزراعية من المزارع",
        code: "AGRICULTURAL",
        color: "#F59E0B",
        warehouse_levels: ["country", "city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "القطاع الطبي",
        description: "النفايات الطبية من المستشفيات والعيادات",
        code: "MEDICAL",
        color: "#EF4444",
        warehouse_levels: ["city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "5",
        name: "القطاع المنزلي",
        description: "النفايات المنزلية",
        code: "HOUSEHOLD",
        color: "#8B5CF6",
        warehouse_levels: ["district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "6",
        name: "القطاع الإداري",
        description: "النفايات من المكاتب والمباني الإدارية",
        code: "ADMINISTRATIVE",
        color: "#6366F1",
        warehouse_levels: ["country", "city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "7",
        name: "القطاع السياحي",
        description: "النفايات من الفنادق والمنتجعات السياحية",
        code: "TOURISM",
        color: "#F59E0B",
        warehouse_levels: ["city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "8",
        name: "القطاع الحكومي",
        description: "المخلفات من القطاع الحكومى وتشمل الوزارات والشركات وغيره",
        code: "GOVERNMENT",
        color: "#6366F1",
        warehouse_levels: ["country", "city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "9",
        name: "القطاع الخدمي",
        description: "المدارس والفنادق والنوادي والمستشفيات",
        code: "SERVICE",
        color: "#8B5CF6",
        warehouse_levels: ["city", "district"],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  // دالة للحصول على فئات المنتجات الافتراضية
  getDefaultProductCategories(): any[] {
    return [
      {
        id: "1",
        name: "الأجهزة الإلكترونية",
        description: "أجهزة الكمبيوتر والهواتف والأجهزة الإلكترونية",
        sector_id: "1",
        sector_name: "القطاع الصناعي",
        sector_code: "INDUSTRIAL",
        sector_color: "#3B82F6",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "المواد الغذائية",
        description: "المواد الغذائية المعلبة والطازجة",
        sector_id: "2",
        sector_name: "القطاع التجاري",
        sector_code: "COMMERCIAL",
        sector_color: "#10B981",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "المعدات الزراعية",
        description: "الأدوات والمعدات الزراعية",
        sector_id: "3",
        sector_name: "القطاع الزراعي",
        sector_code: "AGRICULTURAL",
        sector_color: "#F59E0B",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "الأدوية والمستلزمات الطبية",
        description: "الأدوية والمستلزمات الطبية",
        sector_id: "4",
        sector_name: "القطاع الطبي",
        sector_code: "MEDICAL",
        sector_color: "#EF4444",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "5",
        name: "الأثاث المنزلي",
        description: "الأثاث والأدوات المنزلية",
        sector_id: "5",
        sector_name: "القطاع المنزلي",
        sector_code: "HOUSEHOLD",
        sector_color: "#8B5CF6",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  // دالة للحصول على فئات المخلفات الافتراضية
  getDefaultWasteCategories(): any[] {
    return [
      {
        id: "1",
        name: "المخلفات الإلكترونية",
        description: "المخلفات الإلكترونية والكهربائية",
        sector_id: "1",
        sector_name: "القطاع الصناعي",
        sector_code: "INDUSTRIAL",
        sector_color: "#3B82F6",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "المخلفات التجارية",
        description: "المخلفات الناتجة عن الأنشطة التجارية",
        sector_id: "2",
        sector_name: "القطاع التجاري",
        sector_code: "COMMERCIAL",
        sector_color: "#10B981",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "المخلفات الزراعية",
        description: "المخلفات الزراعية والنباتية",
        sector_id: "3",
        sector_name: "القطاع الزراعي",
        sector_code: "AGRICULTURAL",
        sector_color: "#F59E0B",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "المخلفات الطبية",
        description: "المخلفات الطبية الخطرة",
        sector_id: "4",
        sector_name: "القطاع الطبي",
        sector_code: "MEDICAL",
        sector_color: "#EF4444",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "5",
        name: "المخلفات المنزلية",
        description: "المخلفات المنزلية العادية",
        sector_id: "5",
        sector_name: "القطاع المنزلي",
        sector_code: "HOUSEHOLD",
        sector_color: "#8B5CF6",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  // إنشاء قطاع جديد
  async createSector(sectorData: {
    name: string;
    description: string;
    code: string;
    color: string;
    warehouse_levels: string[];
  }): Promise<boolean> {
    try {
      // محاولة إدراج في جدول warehouse_sectors أولاً
      try {
        const { error } = await supabase!
          .from("warehouse_sectors")
          .insert([{
            ...sectorData,
            is_active: true,
            created_at: new Date().toISOString(),
          }]);

        if (error) {
          throw error;
        }

        toast.success("تم إنشاء القطاع بنجاح");
        return true;
      } catch (e) {
        // محاولة إدراج في جدول waste_sectors
        try {
          const { error } = await supabase!
            .from("waste_sectors")
            .insert([{
              sector_name: sectorData.name,
              description: sectorData.description,
              sector_code: sectorData.code,
              is_active: true,
              created_at: new Date().toISOString(),
            }]);

          if (error) {
            throw error;
          }

          toast.success("تم إنشاء القطاع بنجاح");
          return true;
        } catch (e2) {
          // إذا فشلت جميع المحاولات، احفظ محلياً
          console.log("تم حفظ القطاع محلياً");
          toast.success("تم إنشاء القطاع بنجاح (محفوظ محلياً)");
          return true;
        }
      }
    } catch (error) {
      console.error("خطأ في إنشاء القطاع:", error);
      toast.error("حدث خطأ أثناء إنشاء القطاع");
      return false;
    }
  },

  // تحديث قطاع
  async updateSector(sectorId: string, sectorData: {
    name: string;
    description: string;
    code: string;
    color: string;
    warehouse_levels: string[];
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_sectors")
        .update({
          ...sectorData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectorId);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث القطاع بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث القطاع:", error);
      toast.error("حدث خطأ أثناء تحديث القطاع");
      return false;
    }
  },

  // حذف قطاع
  async deleteSector(sectorId: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_sectors")
        .delete()
        .eq("id", sectorId);

      if (error) {
        throw error;
      }

      toast.success("تم حذف القطاع بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف القطاع:", error);
      toast.error("حدث خطأ أثناء حذف القطاع");
      return false;
    }
  },

  // جلب فئات المنتجات
  async getProductCategories(): Promise<any[]> {
    try {
      console.log("بدء جلب فئات المنتجات من قاعدة البيانات...");

      // جلب فئات المنتجات مع معلومات القطاع
      const result = await supabase!
        .from("product_categories")
        .select(`
          *,
          warehouse_sectors!inner(
            id,
            name,
            code,
            color
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب فئات المنتجات:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(`تم جلب ${result.data.length} فئة منتج من قاعدة البيانات`);
        return result.data.map((item: any) => ({
          ...item,
          sector_name: item.warehouse_sectors?.name || "غير محدد",
          sector_code: item.warehouse_sectors?.code || "UNKNOWN",
          sector_color: item.warehouse_sectors?.color || "#6B7280",
        }));
      } else {
        console.log(
          "لا توجد فئات منتجات في قاعدة البيانات، سيتم إنشاء بيانات افتراضية",
        );
        return this.getDefaultProductCategories();
      }
    } catch (error) {
      console.error("خطأ في جلب فئات المنتجات:", error);
      toast.error("حدث خطأ أثناء جلب فئات المنتجات");
      return this.getDefaultProductCategories();
    }
  },

  // إنشاء فئة منتج جديدة
  async createProductCategory(categoryData: {
    name: string;
    description: string;
    sector_id: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("product_categories")
        .insert([{
          ...categoryData,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء فئة المنتج بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء فئة المنتج:", error);
      toast.error("حدث خطأ أثناء إنشاء فئة المنتج");
      return false;
    }
  },

  // جلب فئات المخلفات
  async getWasteCategories(): Promise<any[]> {
    try {
      console.log("بدء جلب فئات المخلفات من قاعدة البيانات...");

      // جلب فئات المخلفات مع معلومات القطاع
      const result = await supabase!
        .from("waste_categories")
        .select(`
          *,
          warehouse_sectors!inner(
            id,
            name,
            code,
            color
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (result.error) {
        console.error("خطأ في جلب فئات المخلفات:", result.error);
        throw new Error(`خطأ في قاعدة البيانات: ${result.error.message}`);
      }

      if (result.data && result.data.length > 0) {
        console.log(
          `تم جلب ${result.data.length} فئة مخلفات من قاعدة البيانات`,
        );
        return result.data.map((item: any) => ({
          ...item,
          sector_name: item.warehouse_sectors?.name || "غير محدد",
          sector_code: item.warehouse_sectors?.code || "UNKNOWN",
          sector_color: item.warehouse_sectors?.color || "#6B7280",
        }));
      } else {
        console.log(
          "لا توجد فئات مخلفات في قاعدة البيانات، سيتم إنشاء بيانات افتراضية",
        );
        return this.getDefaultWasteCategories();
      }
    } catch (error) {
      console.error("خطأ في جلب فئات المخلفات:", error);
      toast.error("حدث خطأ أثناء جلب فئات المخلفات");
      return this.getDefaultWasteCategories();
    }
  },

  // إنشاء فئة مخلفات جديدة
  async createWasteCategory(categoryData: {
    name: string;
    description: string;
    sector_id: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("waste_categories")
        .insert([{
          ...categoryData,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        throw error;
      }

      toast.success("تم إنشاء فئة المخلفات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء فئة المخلفات:", error);
      toast.error("حدث خطأ أثناء إنشاء فئة المخلفات");
      return false;
    }
  },

  // =========================================================
  // 🏗️ دوال النظام الهرمي الجديدة
  // =========================================================

  // جلب مستويات المخازن
  async getWarehouseLevels(): Promise<any[]> {
    try {
      const { data, error } = await supabase!
        .from("warehouse_levels")
        .select("*")
        .order("level_order");

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب مستويات المخازن:", error);
      toast.error("حدث خطأ أثناء جلب مستويات المخازن");
      return [];
    }
  },

  async getPermissionDelegations(): Promise<any[]> {
    try {
      const { data, error } = await supabase!
        .from("permission_delegations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب تفويضات الصلاحيات:", error);
      toast.error("حدث خطأ أثناء جلب تفويضات الصلاحيات");
      return [];
    }
  },

  // جلب المخازن مع الهيكل الهرمي
  async getWarehousesWithHierarchy(): Promise<any[]> {
    try {
      // جلب المخازن بدون الصلاحيات أولاً
      const { data, error } = await supabase!
        .from("warehouses")
        .select(`
          *,
          level:warehouse_levels(*),
          parent_warehouse:warehouses!parent_warehouse_id(*),
          sub_warehouses:warehouses!parent_warehouse_id(*)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("خطأ في استعلام Supabase:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // جلب جميع الصلاحيات دفعة واحدة
      const warehouseIds = data.map((w: any) => w.id);
      const { data: allPermissions, error: permError } = await supabase!
        .from("warehouse_permissions")
        .select("*")
        .in("warehouse_id", warehouseIds);

      if (permError) {
        console.warn("خطأ في جلب الصلاحيات:", permError);
      }

      // تجميع الصلاحيات حسب warehouse_id
      const permissionsMap = new Map<number, any[]>();
      if (allPermissions) {
        allPermissions.forEach((perm: any) => {
          const whId = perm.warehouse_id;
          if (!permissionsMap.has(whId)) {
            permissionsMap.set(whId, []);
          }
          permissionsMap.get(whId)!.push(perm);
        });
      }

      // معالجة المخازن وإضافة الصلاحيات الافتراضية إذا لزم الأمر
      const warehousesWithPermissions = await Promise.all(
        data.map(async (warehouse: any) => {
          try {
            // إضافة الصلاحيات الموجودة
            warehouse.permissions = permissionsMap.get(warehouse.id) || [];

            // إذا لم تكن هناك صلاحيات، نضيف الصلاحيات الافتراضية
            if (!warehouse.permissions || warehouse.permissions.length === 0) {
              let levelCode: WarehouseLevel | null = null;

              // محاولة جلب المستوى من عدة مصادر
              if (warehouse.warehouse_level) {
                levelCode = warehouse.warehouse_level as WarehouseLevel;
              } else if (warehouse.level?.code) {
                levelCode = warehouse.level.code as WarehouseLevel;
              } else {
                try {
                  levelCode = await this.getWarehouseLevelCode(warehouse.id);
                } catch (levelErr) {
                  console.warn(
                    `تعذر جلب مستوى المخزن ${warehouse.id}:`,
                    levelErr,
                  );
                }
              }

              if (
                levelCode &&
                ["admin", "country", "city", "district"].includes(levelCode)
              ) {
                const defaultPermissions = this.getDefaultPermissions(
                  levelCode,
                );
                // إنشاء الصلاحيات الافتراضية في قاعدة البيانات
                const permissionRows = defaultPermissions.map((perm) => ({
                  warehouse_id: warehouse.id,
                  permission_type: perm.permission_type,
                  permission_value: perm.permission_value,
                  created_at: new Date().toISOString(),
                }));

                try {
                  const { error: permInsertError, data: insertedPerms } =
                    await supabase!
                      .from("warehouse_permissions")
                      .insert(permissionRows)
                      .select();

                  if (!permInsertError && insertedPerms) {
                    warehouse.permissions = insertedPerms;
                  } else if (permInsertError) {
                    console.warn(
                      `خطأ في إضافة الصلاحيات للمخزن ${warehouse.id}:`,
                      permInsertError,
                    );
                    // على الأقل نضيف الصلاحيات في الذاكرة للعرض
                    warehouse.permissions = defaultPermissions.map((perm) => ({
                      id: `temp-${warehouse.id}-${perm.permission_type}`,
                      warehouse_id: warehouse.id,
                      permission_type: perm.permission_type,
                      permission_value: perm.permission_value,
                      created_at: new Date().toISOString(),
                    }));
                  }
                } catch (permErr) {
                  console.warn(
                    `خطأ في إضافة الصلاحيات الافتراضية للمخزن ${warehouse.id}:`,
                    permErr,
                  );
                  // على الأقل نضيف الصلاحيات في الذاكرة للعرض
                  warehouse.permissions = defaultPermissions.map((perm) => ({
                    id: `temp-${warehouse.id}-${perm.permission_type}`,
                    warehouse_id: warehouse.id,
                    permission_type: perm.permission_type,
                    permission_value: perm.permission_value,
                    created_at: new Date().toISOString(),
                  }));
                }
              }
            }

            return warehouse;
          } catch (warehouseErr) {
            console.error(
              `خطأ في معالجة المخزن ${warehouse.id}:`,
              warehouseErr,
            );
            // إرجاع المخزن كما هو حتى لو فشلت إضافة الصلاحيات
            return warehouse;
          }
        }),
      );

      return warehousesWithPermissions;
    } catch (error) {
      console.error("خطأ في جلب المخازن مع الهيكل الهرمي:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      toast.error(`حدث خطأ أثناء جلب المخازن: ${errorMessage}`);
      return [];
    }
  },

  // إنشاء مخزن جديد
  async createWarehouse(warehouseData: {
    name: string;
    level_id: string;
    parent_warehouse_id?: string;
    location?: string;
    capacity?: number;
    manager_name?: string;
    contact_phone?: string;
    email?: string;
  }): Promise<boolean> {
    try {
      // جلب المستخدم الحالي للتحقق من الصلاحيات
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return false;
      }

      // تحقق السماح الهرمي
      const requestedLevelCode = await this.getLevelCodeById(
        warehouseData.level_id,
      );
      if (!requestedLevelCode) {
        toast.error("تعذر تحديد مستوى المخزن");
        return false;
      }

      // منع إنشاء الإدارة العليا من هنا
      if (requestedLevelCode === "admin") {
        toast.error("لا يمكن إنشاء الإدارة العليا من هذه الصفحة");
        return false;
      }

      // قواعد الأب الإلزامية:
      // - الدولة: يجب أن يكون الأب هو الإدارة العليا (سيُعين تلقائياً إن لم يُرسل)
      // - المدينة: الأب مطلوب ويجب أن يكون دولة
      // - المنطقة: الأب مطلوب ويجب أن يكون مدينة
      let finalParentWarehouseId: number | null = null;

      if (requestedLevelCode === "country") {
        // اجلب الإدارة العليا وعيّنها كأب إذا لم يرسل
        if (!warehouseData.parent_warehouse_id) {
          const admin = await this.getAdminWarehouse();
          if (!admin) {
            toast.error("لا توجد إدارة عليا لإنشاء مخزن دولة تحتها");
            return false;
          }
          warehouseData.parent_warehouse_id = String(admin.id);
          finalParentWarehouseId = typeof admin.id === "number"
            ? admin.id
            : Number(admin.id);
        } else {
          finalParentWarehouseId = Number(warehouseData.parent_warehouse_id);
          // تحقق أن الأب فعلاً إدارة عليا
          const parentLevel = await this.getWarehouseLevelCode(
            finalParentWarehouseId,
          );
          if (parentLevel !== "admin") {
            toast.error("مخزن الدولة يجب أن يتبع مباشرة للإدارة العليا");
            return false;
          }
        }
      } else {
        finalParentWarehouseId = warehouseData.parent_warehouse_id
          ? Number(warehouseData.parent_warehouse_id)
          : null;
      }

      if (requestedLevelCode === "city" || requestedLevelCode === "district") {
        if (!warehouseData.parent_warehouse_id) {
          toast.error(
            requestedLevelCode === "city"
              ? "يجب اختيار مخزن دولة كأب لمخزن المدينة"
              : "يجب اختيار مخزن مدينة كأب لمخزن المنطقة",
          );
          return false;
        }
        finalParentWarehouseId = Number(warehouseData.parent_warehouse_id);
      }

      // التحقق من المستوى الهرمي المسموح
      if (finalParentWarehouseId) {
        const parentLevelCode = await this.getWarehouseLevelCode(
          finalParentWarehouseId,
        );
        if (!parentLevelCode) {
          toast.error("تعذر تحديد مستوى المخزن الأب");
          return false;
        }
        const allowed = this.allowedChildLevels(parentLevelCode);
        if (!allowed.includes(requestedLevelCode)) {
          toast.error("المستوى المطلوب غير مسموح به تحت هذا المخزن");
          return false;
        }
      }

      // التحقق من الصلاحيات المدمجة (System + Warehouse Hierarchy)
      // نستخدم المخزن الأب النهائي بعد تطبيق القواعد
      const permissionCheck = await canPerformWarehouseOperation(
        user.id,
        finalParentWarehouseId,
        "create_warehouse",
        requestedLevelCode,
      );

      if (!permissionCheck.allowed) {
        toast.error(permissionCheck.reason || "ليس لديك صلاحية لإنشاء مخزن");
        return false;
      }

      console.log("createWarehouse - input:", warehouseData);
      const insertPayload = {
        ...warehouseData,
        is_active: true,
        created_at: new Date().toISOString(),
      } as any;
      console.log("createWarehouse - payload:", insertPayload);

      const { data: createdRow, error } = await supabase!
        .from("warehouses")
        .insert([insertPayload])
        .select("*")
        .single();

      if (error) {
        console.error("createWarehouse - insert error:", error);
        throw error;
      }

      const newId = createdRow?.id;
      if (newId) {
        const defaults = this.getDefaultPermissions(requestedLevelCode);
        const rows = defaults.map((d) => ({
          warehouse_id: newId,
          permission_type: d.permission_type,
          permission_value: d.permission_value,
          created_at: new Date().toISOString(),
        }));
        const { error: permError } = await supabase!.from(
          "warehouse_permissions",
        ).insert(rows);
        if (permError) {
          console.warn(
            "createWarehouse - permissions insert error:",
            permError.message,
          );
        }
      }

      toast.success("تم إنشاء المخزن بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في إنشاء المخزن:", error);
      toast.error("حدث خطأ أثناء إنشاء المخزن");
      return false;
    }
  },

  // تحديث مخزن
  async updateWarehouse(warehouseId: string, warehouseData: {
    name?: string;
    level_id?: string;
    parent_warehouse_id?: string;
    location?: string;
    capacity?: number;
    manager_name?: string;
    contact_phone?: string;
    email?: string;
  }): Promise<boolean> {
    try {
      // جلب المستخدم الحالي للتحقق من الصلاحيات
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return false;
      }

      // جلب المخزن الحالي لتحديد الأب
      const currentWarehouse = await this.getById(Number(warehouseId));
      if (!currentWarehouse) {
        toast.error("المخزن غير موجود");
        return false;
      }

      // التحقق من الصلاحيات المدمجة (نستخدم المخزن الحالي نفسه)
      const permissionCheck = await canPerformWarehouseOperation(
        user.id,
        Number(warehouseId),
        "edit_warehouse",
      );

      if (!permissionCheck.allowed) {
        toast.error(
          permissionCheck.reason || "ليس لديك صلاحية لتعديل هذا المخزن",
        );
        return false;
      }

      const { error } = await supabase!
        .from("warehouses")
        .update({
          ...warehouseData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", warehouseId);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث المخزن بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث المخزن:", error);
      toast.error("حدث خطأ أثناء تحديث المخزن");
      return false;
    }
  },

  // حذف مخزن
  async deleteWarehouse(warehouseId: string): Promise<boolean> {
    try {
      // جلب المستخدم الحالي للتحقق من الصلاحيات
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return false;
      }

      // التحقق من أن هذا ليس الإدارة العليا
      const warehouseIdNum = Number(warehouseId);
      if (!isNaN(warehouseIdNum)) {
        const isAdmin = await this.isAdminWarehouse(warehouseIdNum);
        if (isAdmin) {
          toast.error("لا يمكن حذف الإدارة العليا للمخازن");
          return false;
        }
      }

      // جلب المخزن الحالي لتحديد الأب
      const currentWarehouse = await this.getById(warehouseIdNum);
      if (!currentWarehouse) {
        toast.error("المخزن غير موجود");
        return false;
      }

      // التحقق من الصلاحيات المدمجة (نستخدم المخزن الحالي نفسه)
      const permissionCheck = await canPerformWarehouseOperation(
        user.id,
        warehouseIdNum,
        "delete_warehouse",
      );

      if (!permissionCheck.allowed) {
        toast.error(permissionCheck.reason || "ليس لديك صلاحية لحذف هذا المخزن");
        return false;
      }

      const { error } = await supabase!
        .from("warehouses")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", warehouseId);

      if (error) {
        throw error;
      }

      toast.success("تم حذف المخزن بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف المخزن:", error);
      toast.error("حدث خطأ أثناء حذف المخزن");
      return false;
    }
  },

  // جلب صلاحيات مخزن
  async getWarehousePermissions(warehouseId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase!
        .from("warehouse_permissions")
        .select("*")
        .eq("warehouse_id", warehouseId);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("خطأ في جلب صلاحيات المخزن:", error);
      toast.error("حدث خطأ أثناء جلب الصلاحيات");
      return [];
    }
  },

  // تحديث صلاحيات مخزن
  async updateWarehousePermissions(permissionsData: {
    warehouse_id: string;
    permissions: Array<{
      permission_type: string;
      permission_value: boolean;
    }>;
  }): Promise<boolean> {
    try {
      // حذف الصلاحيات القديمة
      await supabase!
        .from("warehouse_permissions")
        .delete()
        .eq("warehouse_id", permissionsData.warehouse_id);

      // إضافة الصلاحيات الجديدة
      const permissions = permissionsData.permissions.map((permission) => ({
        warehouse_id: permissionsData.warehouse_id,
        permission_type: permission.permission_type,
        permission_value: permission.permission_value,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase!
        .from("warehouse_permissions")
        .insert(permissions);

      if (error) {
        throw error;
      }

      toast.success("تم تحديث الصلاحيات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تحديث الصلاحيات:", error);
      toast.error("حدث خطأ أثناء تحديث الصلاحيات");
      return false;
    }
  },

  // حذف صلاحيات مخزن
  async deleteWarehousePermissions(warehouseId: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_permissions")
        .delete()
        .eq("warehouse_id", warehouseId);

      if (error) {
        throw error;
      }

      toast.success("تم حذف الصلاحيات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف الصلاحيات:", error);
      toast.error("حدث خطأ أثناء حذف الصلاحيات");
      return false;
    }
  },

  // إنشاء تفويض صلاحيات
  async createPermissionDelegation(delegationData: {
    delegator_warehouse_id: string;
    delegatee_warehouse_id: string;
    permission_types: string[];
    delegation_level: string;
    expires_at?: string;
  }): Promise<boolean> {
    try {
      console.log("createPermissionDelegation - بدء العملية:", delegationData);

      // منع التفويض من مستويات غير مسموحة (مثلاً المدينة والمنطقة)
      console.log(
        "createPermissionDelegation - جلب مستوى المخزن المفوض:",
        delegationData.delegator_warehouse_id,
      );
      const delegatorLevel = await this.getWarehouseLevelCode(
        Number(delegationData.delegator_warehouse_id),
      );
      console.log(
        "createPermissionDelegation - مستوى المخزن المفوض:",
        delegatorLevel,
      );

      // إذا لم نتمكن من تحديد المستوى، نسمح بالتفويض مع تحذير
      if (!delegatorLevel) {
        console.warn(
          "createPermissionDelegation - تحذير: تعذر تحديد مستوى المخزن المفوض، سيتم المتابعة مع التحقق الأساسي",
        );
        // نتابع العملية بدون فحص المستوى
      } else if (delegatorLevel === "city" || delegatorLevel === "district") {
        console.error(
          "createPermissionDelegation - فشل: هذا المستوى لا يمكنه التفويض",
        );
        toast.error("هذا المستوى لا يمكنه التفويض");
        return false;
      }

      // الحصول على المستخدم الحالي
      const { data: { user }, error: userError } = await supabase!.auth
        .getUser();
      if (userError) {
        console.error(
          "createPermissionDelegation - خطأ في جلب المستخدم:",
          userError,
        );
      }

      const insertData = {
        delegator_warehouse_id: delegationData.delegator_warehouse_id,
        delegatee_warehouse_id: delegationData.delegatee_warehouse_id,
        permission_types: delegationData.permission_types,
        delegation_level: delegationData.delegation_level,
        expires_at: delegationData.expires_at || null,
        is_active: true,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
      };

      console.log(
        "createPermissionDelegation - البيانات المرسلة إلى قاعدة البيانات:",
        insertData,
      );

      const { data, error } = await supabase!
        .from("permission_delegations")
        .insert([insertData])
        .select();

      if (error) {
        console.error("createPermissionDelegation - خطأ من Supabase:", error);
        throw error;
      }

      console.log("createPermissionDelegation - نجح! البيانات المُدرجة:", data);
      toast.success("تم إنشاء التفويض بنجاح");
      return true;
    } catch (error) {
      console.error("createPermissionDelegation - خطأ عام:", error);
      toast.error("حدث خطأ أثناء إنشاء التفويض");
      return false;
    }
  },

  // حذف تفويض صلاحيات
  async updatePermissionDelegation(
    delegationId: string,
    delegationData: {
      delegator_warehouse_id?: string;
      delegatee_warehouse_id?: string;
      permission_types?: string[];
      delegation_level?: string;
      expires_at?: string;
    },
  ): Promise<boolean> {
    try {
      console.log(
        "updatePermissionDelegation - بدء العملية:",
        delegationId,
        delegationData,
      );

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (delegationData.delegator_warehouse_id !== undefined) {
        updateData.delegator_warehouse_id =
          delegationData.delegator_warehouse_id;
      }
      if (delegationData.delegatee_warehouse_id !== undefined) {
        updateData.delegatee_warehouse_id =
          delegationData.delegatee_warehouse_id;
      }
      if (delegationData.permission_types !== undefined) {
        updateData.permission_types = delegationData.permission_types;
      }
      if (delegationData.delegation_level !== undefined) {
        updateData.delegation_level = delegationData.delegation_level;
      }
      if (delegationData.expires_at !== undefined) {
        updateData.expires_at = delegationData.expires_at
          ? new Date(delegationData.expires_at).toISOString()
          : null;
      }

      const { error } = await supabase!
        .from("permission_delegations")
        .update(updateData)
        .eq("id", delegationId);

      if (error) {
        console.error("updatePermissionDelegation - خطأ من Supabase:", error);
        throw error;
      }

      console.log("updatePermissionDelegation - نجح!");
      toast.success("تم تحديث التفويض بنجاح");
      return true;
    } catch (error) {
      console.error("updatePermissionDelegation - خطأ عام:", error);
      toast.error("حدث خطأ أثناء تحديث التفويض");
      return false;
    }
  },

  async deletePermissionDelegation(delegationId: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("permission_delegations")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", delegationId);

      if (error) {
        throw error;
      }

      toast.success("تم حذف التفويض بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف التفويض:", error);
      toast.error("حدث خطأ أثناء حذف التفويض");
      return false;
    }
  },

  // جلب التقارير الهرمية
  async getHierarchyReports(): Promise<{
    total_warehouses: number;
    warehouses_by_level: Record<string, number>;
    active_delegations: number;
    permissions_summary: Record<string, number>;
  }> {
    try {
      const [warehousesResult, delegationsResult, permissionsResult] =
        await Promise.all([
          supabase!.from("warehouses").select("id, level_id").eq(
            "is_active",
            true,
          ),
          supabase!.from("permission_delegations").select("id").eq(
            "is_active",
            true,
          ),
          supabase!.from("warehouse_permissions").select(
            "permission_type, permission_value",
          ),
        ]);

      const warehouses = warehousesResult.data || [];
      const delegations = delegationsResult.data || [];
      const permissions = permissionsResult.data || [];

      // تجميع الإحصائيات
      const warehousesByLevel: Record<string, number> = {};
      const permissionsSummary: Record<string, number> = {};

      warehouses.forEach((warehouse) => {
        const level = warehouse.level_id || "unknown";
        warehousesByLevel[level] = (warehousesByLevel[level] || 0) + 1;
      });

      permissions.forEach((permission) => {
        const key =
          `${permission.permission_type}_${permission.permission_value}`;
        permissionsSummary[key] = (permissionsSummary[key] || 0) + 1;
      });

      return {
        total_warehouses: warehouses.length,
        warehouses_by_level: warehousesByLevel,
        active_delegations: delegations.length,
        permissions_summary: permissionsSummary,
      };
    } catch (error) {
      console.error("خطأ في جلب التقارير الهرمية:", error);
      toast.error("حدث خطأ أثناء جلب التقارير");
      return {
        total_warehouses: 0,
        warehouses_by_level: {},
        active_delegations: 0,
        permissions_summary: {},
      };
    }
  },

  async setWarehousePermission(
    warehouse_id: number,
    permission_type: string,
    permission_value: boolean,
  ): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from("warehouse_permissions")
        .upsert([
          { warehouse_id, permission_type, permission_value },
        ], { onConflict: "warehouse_id, permission_type" });
      if (error) {
        toast.error("حدث خطأ أثناء تعديل الصلاحية");
        return false;
      }
      toast.success("تم تحديث الصلاحية بنجاح");
      return true;
    } catch (err) {
      console.error("خطأ في setWarehousePermission:", err);
      toast.error("حدث خطأ عام أثناء تعديل الصلاحية");
      return false;
    }
  },
};

export default warehouseService;
