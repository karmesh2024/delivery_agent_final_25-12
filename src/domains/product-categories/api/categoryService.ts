import { supabase } from '@/lib/supabase';
import { Category, SubCategory, WasteItem } from '@/types';
import { setSubcategoryExchangePrice } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { productService } from '@/domains/product-categories/services/productService';
import { withTransaction } from '@/lib/transactionWrapper';
import { auditService } from '@/services/auditService';

export const categoryService = {
  // ========== الفئات الرئيسية ==========
  
  /**
   * الحصول على قائمة الفئات الرئيسية
   * يستخدم waste_main_categories (النظام الموحد الجديد)
   */
  async getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('waste_main_categories')
        .select('id, name, code, description, image_url, visible_to_client_app, visible_to_agent_app, created_at, updated_at')
        .order('name');

      if (error) throw new Error(error.message);
      
      // تحويل البيانات لتتوافق مع واجهة Category
      const categories = (data || []).map(item => ({
        id: String(item.id), // تحويل BigInt إلى string
        name: item.name,
        code: item.code ?? undefined,
        description: item.description || null,
        image_url: item.image_url || null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));
      
      return { data: categories as Category[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئات';
      console.error('Error fetching categories:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * إضافة فئة رئيسية جديدة
   * يستخدم waste_main_categories (النظام الموحد الجديد)
   */
  async addCategory(category: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      if (!category.name) {
        throw new Error('اسم الفئة مطلوب');
      }
      
      // إنشاء code تلقائياً من الاسم
      const code = category.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      
      const { data, error } = await supabase
        .from('waste_main_categories')
        .insert([
          {
            name: category.name,
            code: code,
            description: category.description || null,
            image_url: category.image_url || null,
          },
        ])
        .select();

      if (error) throw new Error(error.message);
      
      const newCategory = data?.[0];
      if (!newCategory) {
        throw new Error('فشل في إنشاء الفئة');
      }
      
      // تحويل البيانات لتتوافق مع واجهة Category
      const categoryData: Category = {
        id: String(newCategory.id),
        name: newCategory.name,
        description: newCategory.description || null,
        image_url: newCategory.image_url || null,
        created_at: newCategory.created_at || null,
        updated_at: newCategory.updated_at || null,
      };
      
      return { data: categoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء إضافة الفئة';
      console.error('Error adding category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث فئة رئيسية
   * يستخدم waste_main_categories (النظام الموحد الجديد)
   */
  async updateCategory(id: string, category: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (category.name) {
        updateData.name = category.name;
        // تحديث code إذا تغير الاسم
        updateData.code = category.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      }
      
      if (category.description !== undefined) {
        updateData.description = category.description;
      }
      
      if (category.image_url !== undefined) {
        updateData.image_url = category.image_url;
      }
      if (category.visible_to_client_app !== undefined) {
        updateData.visible_to_client_app = category.visible_to_client_app;
      }
      if (category.visible_to_agent_app !== undefined) {
        updateData.visible_to_agent_app = category.visible_to_agent_app;
      }
      
      const { data, error } = await supabase
        .from('waste_main_categories')
        .update(updateData)
        .eq('id', Number(id)) // تحويل string إلى number للبحث في BigInt
        .select();
      
      if (error) {
        console.error('Error updating category:', error);
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        // محاولة جلب الفئة للتأكد من وجودها
        const { data: fetchedData, error: fetchError } = await supabase
          .from('waste_main_categories')
          .select('*')
          .eq('id', Number(id))
          .single();
          
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        const categoryData: Category = {
          id: String(fetchedData.id),
          name: fetchedData.name,
          description: null,
          image_url: null,
          created_at: null,
          updated_at: null,
        };
        
        return { data: categoryData, error: null };
      }
      
      const updatedCategory = data[0];
      const categoryData: Category = {
        id: String(updatedCategory.id),
        name: updatedCategory.name,
        description: updatedCategory.description || null,
        image_url: updatedCategory.image_url || null,
        created_at: updatedCategory.created_at || null,
        updated_at: updatedCategory.updated_at || null,
      };
      
      return { data: categoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء تحديث الفئة';
      console.error('Error updating category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * حذف فئة رئيسية
   * يستخدم waste_main_categories (النظام الموحد الجديد)
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      // جلب الفئة أولاً للتأكد من وجودها
      const { data: category, error: fetchError } = await supabase
        .from('waste_main_categories')
        .select('id, name')
        .eq('id', Number(id))
        .single();
        
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return { success: false, error: 'الفئة غير موجودة' };
        }
        throw new Error(`فشل في التحقق من وجود الفئة: ${fetchError.message}`);
      }
      
      if (!category) {
        return { success: false, error: 'الفئة غير موجودة' };
      }
      
      // تحقق من وجود فئات فرعية مرتبطة (سيتم حذفها تلقائياً بسبب CASCADE)
      const { data: subCategories, error: subCatError } = await supabase
        .from('waste_sub_categories')
        .select('id')
        .eq('main_id', Number(id));
      
      if (subCatError) {
        console.error('Error checking subcategories:', subCatError);
        // نواصل الحذف حتى لو فشل التحقق
      }
      
      if (subCategories && subCategories.length > 0) {
        console.warn(`هذه الفئة تحتوي على ${subCategories.length} فئة فرعية مرتبطة. سيتم حذفها تلقائياً.`);
      }
      
      // حذف الفئة الرئيسية (سيتم حذف الفئات الفرعية تلقائياً بسبب CASCADE)
      const { error } = await supabase
        .from('waste_main_categories')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('Error deleting category:', error);
        
        // تحقق من نوع الخطأ
        if (error.code === '23503') { // خطأ القيد الخارجي
          return { 
            success: false, 
            error: 'لا يمكن حذف هذه الفئة لأنها مرتبطة بعناصر أخرى. قم بحذف الفئات الفرعية والمنتجات المرتبطة أولاً.' 
          };
        }
        
        if (error.code === '42501') { // خطأ صلاحيات
          return {
            success: false,
            error: 'ليس لديك صلاحية لحذف هذه الفئة. تحقق من إضافة سياسة DELETE في Supabase.'
          };
        }
        
        throw new Error(error.message);
      }
      
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء حذف الفئة';
      console.error('Error deleting category:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * الحصول على فئة رئيسية بواسطة المعرف
   * يستخدم waste_main_categories (النظام الموحد الجديد)
   */
  async getCategoryById(id: string): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('waste_main_categories')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (error) throw new Error(error.message);
      
      // تحويل البيانات لتتوافق مع واجهة Category
      const categoryData: Category = {
        id: String(data.id),
        name: data.name,
        description: data.description || null,
        image_url: data.image_url || null,
        created_at: data.created_at || null,
        updated_at: data.updated_at || null,
      };
      
      return { data: categoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئة';
      console.error('Error fetching category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  // ========== الفئات الفرعية ==========
  
  /**
   * الحصول على قائمة الفئات الفرعية
   * يستخدم waste_sub_categories (النظام الموحد الجديد)
   */
  async getSubCategories(categoryId?: string): Promise<{ data: SubCategory[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      let query = supabase
        .from('waste_sub_categories')
        .select('*, waste_main_categories(name)')
        .order('name');
      
      if (categoryId) {
        query = query.eq('main_id', Number(categoryId));
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      // تحويل البيانات لتتوافق مع واجهة SubCategory
      const subcategories = (data || []).map(item => ({
        id: String(item.id),
        name: item.name,
        code: item.code ?? undefined,
        category_id: item.main_id ? String(item.main_id) : null,
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        price: item.price ?? null,
        points_per_kg: item.points_per_kg ?? null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        categories: item.waste_main_categories ? { name: item.waste_main_categories.name } : undefined,
      }));
      
      return { data: subcategories as SubCategory[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئات الفرعية';
      console.error('Error fetching subcategories:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * إضافة فئة فرعية جديدة
   * يستخدم waste_sub_categories (النظام الموحد الجديد)
   */
  async addSubCategory(subCategory: Partial<SubCategory>): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      if (!subCategory.name) {
        throw new Error('اسم الفئة الفرعية مطلوب');
      }
      
      if (!subCategory.category_id) {
        throw new Error('معرف الفئة الرئيسية مطلوب');
      }
      
      // إنشاء code فريد: من الاسم + لاحقة قصيرة لتجنب تكرار waste_sub_categories_code_key
      const baseCode = subCategory.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') || 'SUB';
      const uniqueSuffix = Date.now().toString(36).slice(-6);
      const code = `${baseCode}_${uniqueSuffix}`;
      
      const insertData: Record<string, unknown> = {
        name: subCategory.name,
        main_id: Number(subCategory.category_id),
        code: code,
        description: subCategory.description || null,
        image_url: subCategory.image_url || null,
      };
      if (subCategory.price !== undefined && subCategory.price !== null) {
        insertData.price = subCategory.price;
      }
      if (subCategory.points_per_kg !== undefined && subCategory.points_per_kg !== null) {
        insertData.points_per_kg = subCategory.points_per_kg;
      }

      const { data, error } = await supabase
        .from('waste_sub_categories')
        .insert([insertData])
        .select();

      if (error) throw new Error(error.message);
      
      const newSubCategory = data?.[0];
      if (!newSubCategory) {
        throw new Error('فشل في إنشاء الفئة الفرعية');
      }
      
      // تحويل البيانات لتتوافق مع واجهة SubCategory
      const subCategoryData: SubCategory = {
        id: String(newSubCategory.id),
        name: newSubCategory.name,
        category_id: newSubCategory.main_id ? String(newSubCategory.main_id) : null,
        description: newSubCategory.description ?? null,
        image_url: newSubCategory.image_url ?? null,
        price: newSubCategory.price ?? null,
        points_per_kg: newSubCategory.points_per_kg ?? null,
        created_at: newSubCategory.created_at ?? null,
        updated_at: newSubCategory.updated_at ?? null,
      };
      
      return { data: subCategoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء إضافة الفئة الفرعية';
      console.error('Error adding subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * إنشاء فئة فرعية مع سعر بورصة أولي في خطوة واحدة
   * ينشئ سجل في waste_sub_categories ثم سجل في subcategory_exchange_price
   * محمي بـ Transaction ومسجل في Audit Log
   */
  async createSubCategoryWithInitialExchangePrice(
    subCategory: Partial<SubCategory>,
    initialBuyPrice: number,
    initialSellPrice?: number | null,
    userId?: string | null,
    userEmail?: string | null
  ): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      const result = await withTransaction(
        async () => {
          // 1. إنشاء الفئة الفرعية
          const addResult = await this.addSubCategory(subCategory);
          if (addResult.error || !addResult.data) {
            throw new Error(addResult.error || 'فشل في إنشاء الفئة الفرعية');
          }

          // 2. إضافة سعر البورصة
          const subId = Number(addResult.data.id);
          const priceRecord = await setSubcategoryExchangePrice(
            subId,
            initialBuyPrice,
            initialSellPrice ?? initialBuyPrice * 1.2,
            userId
          );
          
          if (!priceRecord) {
            throw new Error('فشل في تعيين سعر البورصة');
          }

          return addResult.data;
        },
        {
          auditEntry: {
            entityType: 'subcategory',
            entityId: 'pending',
            entityName: subCategory.name,
            operation: 'create',
            sourceTable: 'waste_sub_categories',
            targetTables: ['subcategory_exchange_price'],
            userId: userId || undefined,
            userEmail: userEmail || undefined,
            payload: {
              subCategory,
              initialBuyPrice,
              initialSellPrice: initialSellPrice ?? initialBuyPrice * 1.2
            }
          },
          maxRetries: 2,
          timeoutMs: 15000
        }
      );

      return { data: result, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف أثناء إنشاء الفئة مع سعر البورصة';
      console.error('Error creating subcategory with exchange price:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث فئة فرعية
   * يستخدم waste_sub_categories (النظام الموحد الجديد)
   * محمي بـ Transaction ومسجل في Audit Log
   */
  async updateSubCategory(
    id: string, 
    subCategory: Partial<SubCategory>,
    userId?: string | null,
    userEmail?: string | null
  ): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      const result = await withTransaction(
        async () => {
          if (!supabase) throw new Error('لم يتم تهيئة Supabase');
          
          const updateData: any = {};
          
          if (subCategory.name) {
            updateData.name = subCategory.name;
            // تحديث code إذا تغير الاسم
            updateData.code = subCategory.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
          }
          
          if (subCategory.category_id) {
            updateData.main_id = Number(subCategory.category_id);
          }
          if (subCategory.description !== undefined) {
            updateData.description = subCategory.description || null;
          }
          if (subCategory.image_url !== undefined) {
            updateData.image_url = subCategory.image_url || null;
          }
          if (subCategory.price !== undefined) {
            updateData.price = subCategory.price;
          }
          if (subCategory.points_per_kg !== undefined) {
            updateData.points_per_kg = subCategory.points_per_kg;
          }
          if (subCategory.visible_to_client_app !== undefined) {
            updateData.visible_to_client_app = subCategory.visible_to_client_app;
          }
          if (subCategory.visible_to_agent_app !== undefined) {
            updateData.visible_to_agent_app = subCategory.visible_to_agent_app;
          }
          
          const { data, error } = await supabase
            .from('waste_sub_categories')
            .update(updateData)
            .eq('id', Number(id))
            .select();

          if (error) throw new Error(error.message);
          
          if (!data || data.length === 0) {
            throw new Error('فشل في تحديث الفئة الفرعية');
          }
          
          const updatedSubCategory = data[0];
          const subCategoryData: SubCategory = {
            id: String(updatedSubCategory.id),
            name: updatedSubCategory.name,
            category_id: updatedSubCategory.main_id ? String(updatedSubCategory.main_id) : null,
            description: updatedSubCategory.description ?? null,
            image_url: updatedSubCategory.image_url ?? null,
            price: updatedSubCategory.price ?? null,
            points_per_kg: updatedSubCategory.points_per_kg ?? null,
            created_at: updatedSubCategory.created_at ?? null,
            updated_at: updatedSubCategory.updated_at ?? null,
          };
          
          return subCategoryData;
        },
        {
          auditEntry: {
            entityType: 'subcategory',
            entityId: id,
            entityName: subCategory.name,
            operation: 'update',
            sourceTable: 'waste_sub_categories',
            targetTables: [],
            userId: userId || undefined,
            userEmail: userEmail || undefined,
            payload: subCategory
          },
          maxRetries: 2,
          timeoutMs: 10000
        }
      );

      return { data: result, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء تحديث الفئة الفرعية';
      console.error('Error updating subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * حذف فئة فرعية
   * يستخدم waste_sub_categories (النظام الموحد الجديد)
   * محمي بـ Transaction ومسجل في Audit Log
   */
  async deleteSubCategory(
    id: string,
    userId?: string | null,
    userEmail?: string | null
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await withTransaction(
        async () => {
          if (!supabase) throw new Error('لم يتم تهيئة Supabase');
          
          const { error } = await supabase
            .from('waste_sub_categories')
            .delete()
            .eq('id', Number(id));

          if (error) {
            if (error.code === '23503') { // خطأ القيد الخارجي
              // ملاحظة: هذا الخطأ قد يكون بسبب جداول أخرى غير المنتجات (مثل كتالوج المخلفات أو طلبات الإضافة)
              // error.details غالباً تحتوي اسم الجدول الذي يمنع الحذف
              console.warn('FK constraint prevents deleting subcategory:', {
                id,
                code: error.code,
                message: error.message,
                details: (error as unknown as { details?: string }).details,
                hint: (error as unknown as { hint?: string }).hint,
              });
              throw new Error(
                'لا يمكن حذف هذه الفئة الفرعية لأنها مرتبطة ببيانات أخرى في النظام (قد تكون: كتالوج المخلفات، طلبات إضافة منتجات، أو سجلات تشغيل). ' +
                'قم بإزالة/نقل الارتباطات المرتبطة ثم أعد المحاولة.'
              );
            }
            throw new Error(error.message);
          }
        },
        {
          auditEntry: {
            entityType: 'subcategory',
            entityId: id,
            operation: 'delete',
            sourceTable: 'waste_sub_categories',
            targetTables: [],
            userId: userId || undefined,
            userEmail: userEmail || undefined
          },
          maxRetries: 1,
          timeoutMs: 10000
        }
      );

      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء حذف الفئة الفرعية';
      console.error('Error deleting subcategory:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * عدد المنتجات المرتبطة بفئة فرعية (subcategory_id فقط - نفس المعيار المستخدم في getProductsBySubcategory)
   * لضمان تطابق العد مع قائمة المنتجات المعروضة في الواجهة
   */
  async getProductCountBySubcategoryId(subcategoryId: string): Promise<number> {
    if (!supabase) return 0;
    const subId = Number(subcategoryId);
    if (Number.isNaN(subId)) return 0;
    const { count, error } = await supabase
      .from('waste_data_admin')
      .select('id', { count: 'exact', head: true })
      .eq('subcategory_id', subId);
    if (error) return 0;
    return count ?? 0;
  },

  /**
   * عدد المنتجات تحت فئة رئيسية (فئات فرعية + منتجات مرتبطة مباشرة بـ waste_main_category_id)
   */
  async getProductCountByCategoryId(categoryId: string): Promise<number> {
    if (!supabase) return 0;
    const mainId = Number(categoryId);
    const { data: subIds } = await supabase
      .from('waste_sub_categories')
      .select('id')
      .eq('main_id', mainId);
    const ids = (subIds ?? []).map((r: { id: number }) => r.id);
    if (ids.length === 0) {
      const { count } = await supabase
        .from('waste_data_admin')
        .select('id', { count: 'exact', head: true })
        .eq('waste_main_category_id', mainId);
      return count ?? 0;
    }
    const { count, error } = await supabase
      .from('waste_data_admin')
      .select('id', { count: 'exact', head: true })
      .or(`waste_main_category_id.eq.${mainId},subcategory_id.in.(${ids.join(',')})`);
    if (error) return 0;
    return count ?? 0;
  },

  /**
   * حذف فئة فرعية مع جميع المنتجات تحتها: تعطيل الكتالوج ثم حذف من waste_data_admin ثم حذف الفئة
   * يستخدم subcategory_id فقط ليطابق getProductsBySubcategory وقائمة المنتجات في الواجهة
   */
  async deleteSubCategoryWithProducts(subcategoryId: string): Promise<{ success: boolean; error: string | null }> {
    if (!supabase) return { success: false, error: 'لم يتم تهيئة Supabase' };
    const subId = Number(subcategoryId);
    const { data: products, error: fetchErr } = await supabase
      .from('waste_data_admin')
      .select('id')
      .eq('subcategory_id', subId);
    if (fetchErr) return { success: false, error: fetchErr.message };
    for (const p of products ?? []) {
      try {
        await productService.deleteProduct(p.id);
      } catch (e) {
        console.warn('فشل حذف منتج:', p.id, e);
      }
    }
    return this.deleteSubCategory(subcategoryId);
  },

  /**
   * حذف فئة رئيسية مع الفئات الفرعية وجميع المنتجات: حذف المنتجات ثم الفئات الفرعية ثم الفئة الرئيسية
   */
  async deleteCategoryWithProducts(categoryId: string): Promise<{ success: boolean; error: string | null }> {
    if (!supabase) return { success: false, error: 'لم يتم تهيئة Supabase' };
    const mainId = Number(categoryId);
    const { data: subCategories } = await supabase
      .from('waste_sub_categories')
      .select('id')
      .eq('main_id', mainId);
    for (const sub of subCategories ?? []) {
      const res = await this.deleteSubCategoryWithProducts(String(sub.id));
      if (!res.success) return res;
    }
    const { data: products } = await supabase
      .from('waste_data_admin')
      .select('id')
      .eq('waste_main_category_id', mainId);
    for (const p of products ?? []) {
      try {
        await productService.deleteProduct(p.id);
      } catch (e) {
        console.warn('فشل حذف منتج:', p.id, e);
      }
    }
    return this.deleteCategory(categoryId);
  },

  /**
   * الحصول على فئة فرعية بواسطة المعرف
   * يستخدم waste_sub_categories (النظام الموحد الجديد)
   */
  async getSubCategoryById(id: string): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('waste_sub_categories')
        .select('*, waste_main_categories(name)')
        .eq('id', Number(id))
        .single();

      if (error) throw new Error(error.message);
      
      // تحويل البيانات لتتوافق مع واجهة SubCategory
      const subCategoryData: SubCategory = {
        id: String(data.id),
        name: data.name,
        category_id: data.main_id ? String(data.main_id) : null,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
        price: data.price ?? null,
        points_per_kg: data.points_per_kg ?? null,
        created_at: data.created_at ?? null,
        updated_at: data.updated_at ?? null,
        categories: data.waste_main_categories ? { name: data.waste_main_categories.name } : undefined,
      };
      
      return { data: subCategoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئة الفرعية';
      console.error('Error fetching subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث ظهور الفئة الأساسية (تطبيق العميل / تطبيق الوكيل / تحت الانتظار)
   */
  async updateCategoryVisibility(
    id: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      const { data, error } = await supabase
        .from('waste_main_categories')
        .update({
          visible_to_client_app: visibility.visible_to_client_app,
          visible_to_agent_app: visibility.visible_to_agent_app,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(id))
        .select()
        .single();
      if (error) throw new Error(error.message);
      const categoryData: Category = {
        id: String(data.id),
        name: data.name,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
        visible_to_client_app: data.visible_to_client_app ?? false,
        visible_to_agent_app: data.visible_to_agent_app ?? false,
        created_at: data.created_at ?? null,
        updated_at: data.updated_at ?? null,
      };
      return { data: categoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error updating category visibility:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث ظهور الفئة الفرعية (تطبيق العميل / تطبيق الوكيل / تحت الانتظار)
   */
  async updateSubCategoryVisibility(
    id: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      const { data, error } = await supabase
        .from('waste_sub_categories')
        .update({
          visible_to_client_app: visibility.visible_to_client_app,
          visible_to_agent_app: visibility.visible_to_agent_app,
          updated_at: new Date().toISOString(),
        })
        .eq('id', Number(id))
        .select()
        .single();
      if (error) throw new Error(error.message);
      const subCategoryData: SubCategory = {
        id: String(data.id),
        name: data.name,
        category_id: data.main_id ? String(data.main_id) : null,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
        price: data.price ?? null,
        points_per_kg: data.points_per_kg ?? null,
        visible_to_client_app: data.visible_to_client_app ?? false,
        visible_to_agent_app: data.visible_to_agent_app ?? false,
        created_at: data.created_at ?? null,
        updated_at: data.updated_at ?? null,
      };
      return { data: subCategoryData, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error updating subcategory visibility:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * الفئات الأساسية المعروضة في تطبيق العميل فقط
   */
  async getCategoriesForClient(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      const { data, error } = await supabase
        .from('waste_main_categories')
        .select('id, name, code, description, image_url, visible_to_client_app, visible_to_agent_app, created_at, updated_at')
        .eq('visible_to_client_app', true)
        .order('name');
      if (error) throw new Error(error.message);
      const categories = (data || []).map(item => ({
        id: String(item.id),
        name: item.name,
        description: item.description || null,
        image_url: item.image_url || null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));
      return { data: categories as Category[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error fetching categories for client:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * الفئات الأساسية المعروضة في تطبيق الوكيل فقط
   */
  async getCategoriesForAgent(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      const { data, error } = await supabase
        .from('waste_main_categories')
        .select('id, name, code, description, image_url, visible_to_client_app, visible_to_agent_app, created_at, updated_at')
        .eq('visible_to_agent_app', true)
        .order('name');
      if (error) throw new Error(error.message);
      const categories = (data || []).map(item => ({
        id: String(item.id),
        name: item.name,
        description: item.description || null,
        image_url: item.image_url || null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));
      return { data: categories as Category[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error fetching categories for agent:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * الفئات الفرعية المعروضة في تطبيق العميل (اختياري: حسب الفئة الأساسية)
   */
  async getSubCategoriesForClient(categoryId?: string): Promise<{ data: SubCategory[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      let query = supabase
        .from('waste_sub_categories')
        .select('*, waste_main_categories(name)')
        .eq('visible_to_client_app', true)
        .order('name');
      if (categoryId) query = query.eq('main_id', Number(categoryId));
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const subcategories = (data || []).map(item => ({
        id: String(item.id),
        name: item.name,
        category_id: item.main_id ? String(item.main_id) : null,
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        price: item.price ?? null,
        points_per_kg: item.points_per_kg ?? null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        categories: item.waste_main_categories ? { name: item.waste_main_categories.name } : undefined,
      }));
      return { data: subcategories as SubCategory[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error fetching subcategories for client:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * الفئات الفرعية المعروضة في تطبيق الوكيل (اختياري: حسب الفئة الأساسية)
   */
  async getSubCategoriesForAgent(categoryId?: string): Promise<{ data: SubCategory[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      let query = supabase
        .from('waste_sub_categories')
        .select('*, waste_main_categories(name)')
        .eq('visible_to_agent_app', true)
        .order('name');
      if (categoryId) query = query.eq('main_id', Number(categoryId));
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const subcategories = (data || []).map(item => ({
        id: String(item.id),
        name: item.name,
        category_id: item.main_id ? String(item.main_id) : null,
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        price: item.price ?? null,
        points_per_kg: item.points_per_kg ?? null,
        visible_to_client_app: item.visible_to_client_app ?? false,
        visible_to_agent_app: item.visible_to_agent_app ?? false,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        categories: item.waste_main_categories ? { name: item.waste_main_categories.name } : undefined,
      }));
      return { data: subcategories as SubCategory[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      console.error('Error fetching subcategories for agent:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  // ========== عناصر النفايات ==========
  
  /**
   * الحصول على قائمة العناصر
   * يستخدم waste_data_admin مع waste_main_categories و waste_sub_categories (النظام الموحد الجديد)
   * ملاحظة: waste_data_admin.subcategory_id حالياً من نوع UUID، لكن يجب أن يشير إلى waste_sub_categories.id (BigInt)
   * هذا يتطلب تحديث قاعدة البيانات لاحقاً
   */
  async getWasteItems(filters?: { categoryId?: string; subcategoryId?: string }): Promise<{ data: WasteItem[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      // جلب المنتجات من waste_data_admin
      let query = supabase
        .from('waste_data_admin')
        .select('*')
        .order('name');
      
      // ملاحظة: حالياً waste_data_admin.subcategory_id من نوع UUID
      // لكن يجب أن يكون BigInt ليتوافق مع waste_sub_categories.id
      // سنقوم بفلترة حسب subcategory_id إذا كان متوفراً
      if (filters?.subcategoryId) {
        // محاولة البحث عن المنتجات المرتبطة بالفئة الفرعية
        // لكن يجب التحويل من BigInt إلى UUID أو العكس حسب الحاجة
        query = query.eq('subcategory_id', filters.subcategoryId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      
      // جلب معلومات الفئات إذا كانت متوفرة
      const wasteItems = (data || []).map(item => {
        // تحويل البيانات لتتوافق مع واجهة WasteItem
        const wasteItem: WasteItem = {
          id: item.id,
          name: item.name,
          category_id: item.category_id,
          subcategory_id: item.subcategory_id,
          description: item.description,
          image_url: item.image_url,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity,
          points: item.points,
          initial_points: item.initial_points,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
        
        return wasteItem;
      });
      
      return { data: wasteItems, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب العناصر';
      console.error('Error fetching waste items:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * رفع صورة إلى التخزين
   */
  async uploadImage(file: File, path: string): Promise<{ url: string | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('categories_pic')
        .upload(filePath, file);

      if (error) throw new Error(error.message);

      const { data: { publicUrl } } = supabase.storage
        .from('categories_pic')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء رفع الصورة';
      console.error('Error uploading image:', errorMessage);
      return { url: null, error: errorMessage };
    }
  }
}; 