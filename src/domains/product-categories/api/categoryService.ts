import { supabase } from '@/lib/supabase';
import { Category, SubCategory, WasteItem } from '@/types';

export const categoryService = {
  // ========== الفئات الرئيسية ==========
  
  /**
   * الحصول على قائمة الفئات الرئيسية
   */
  async getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);
      return { data: data as Category[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئات';
      console.error('Error fetching categories:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * إضافة فئة رئيسية جديدة
   */
  async addCategory(category: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: category.name,
            description: category.description || '',
            image_url: category.image_url || '',
          },
        ])
        .select();

      if (error) throw new Error(error.message);
      return { data: data?.[0] as Category, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء إضافة الفئة';
      console.error('Error adding category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث فئة رئيسية
   */
  async updateCategory(id: string, category: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      console.log('Actualizando categoría con ID:', id);
      console.log('Datos de actualización:', category);
      
      const updateData = {
        name: category.name,
        description: category.description,
        image_url: category.image_url,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Datos enviados a Supabase:', updateData);
      
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error de Supabase al actualizar categoría:', error);
        throw new Error(error.message);
      }
      
      console.log('Respuesta de Supabase después de actualizar:', data);
      
      if (!data || data.length === 0) {
        console.warn('No se devolvieron datos después de la actualización');
        // Si no hay datos devueltos, pero tampoco hay error, intentemos obtener la categoría actualizada
        const { data: fetchedData, error: fetchError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          console.error('Error al intentar obtener la categoría actualizada:', fetchError);
          throw new Error(fetchError.message);
        }
        
        return { data: fetchedData as Category, error: null };
      }
      
      return { data: data[0] as Category, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء تحديث الفئة';
      console.error('Error updating category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * حذف فئة رئيسية
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      console.log('Intentando eliminar categoría con ID:', id);
      
      // التحقق من وجود سياسة الحذف من خلال محاولة حذف اختبارية
      try {
        // جلب الفئة أولاً للتأكد من وجودها
        const { data: category, error: fetchError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          console.error('Error al verificar la existencia de la categoría:', fetchError);
          if (fetchError.code === 'PGRST116') {
            return { success: false, error: 'الفئة غير موجودة' };
          }
          throw new Error(`فشل في التحقق من وجود الفئة: ${fetchError.message}`);
        }
        
        if (!category) {
          return { success: false, error: 'الفئة غير موجودة' };
        }
        
        console.log('Categoría encontrada:', category);
      } catch (checkError) {
        console.error('Error en la verificación preliminar:', checkError);
        throw checkError;
      }
      
      // تحقق أولاً مما إذا كانت هناك فئات فرعية مرتبطة بهذه الفئة
      const { data: subCategories, error: subCatError } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', id);
      
      if (subCatError) {
        console.error('Error al verificar subcategorías:', subCatError);
        throw new Error(`فشل في التحقق من الفئات الفرعية: ${subCatError.message}`);
      }
      
      // إذا كانت هناك فئات فرعية، فقد نحتاج إلى حذفها أولاً أو إخبار المستخدم
      if (subCategories && subCategories.length > 0) {
        console.warn(`Esta categoría tiene ${subCategories.length} subcategorías asociadas.`);
        // تنفيذ سلوك الحذف المباشر للفئات الفرعية أولاً
        for (const subCategory of subCategories) {
          console.log(`Intentando eliminar subcategoría: ${subCategory.id}`);
          const { error: deleteSubError } = await supabase
            .from('subcategories')
            .delete()
            .eq('id', subCategory.id);
            
          if (deleteSubError) {
            console.error(`Error al eliminar subcategoría ${subCategory.id}:`, deleteSubError);
            // نواصل محاولة حذف باقي الفئات الفرعية
          }
        }
      }
      
      // محاولة حذف الفئة الرئيسية
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error de Supabase al eliminar categoría:', error);
        
        // تحقق من نوع الخطأ
        if (error.code === '23503') { // خطأ القيد الخارجي
          return { 
            success: false, 
            error: 'لا يمكن حذف هذه الفئة لأنها مرتبطة بعناصر أخرى. قم بحذف الفئات الفرعية أولاً.' 
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
      
      console.log('Categoría eliminada exitosamente:', id);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء حذف الفئة';
      console.error('Error completo al eliminar categoría:', err);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * الحصول على فئة رئيسية بواسطة المعرف
   */
  async getCategoryById(id: string): Promise<{ data: Category | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return { data: data as Category, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئة';
      console.error('Error fetching category:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  // ========== الفئات الفرعية ==========
  
  /**
   * الحصول على قائمة الفئات الفرعية
   */
  async getSubCategories(categoryId?: string): Promise<{ data: SubCategory[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      let query = supabase
        .from('subcategories')
        .select('*, categories(name)')
        .order('name');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return { data: data as SubCategory[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئات الفرعية';
      console.error('Error fetching subcategories:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * إضافة فئة فرعية جديدة
   */
  async addSubCategory(subCategory: Partial<SubCategory>): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('subcategories')
        .insert([
          {
            name: subCategory.name,
            category_id: subCategory.category_id,
            description: subCategory.description || '',
            image_url: subCategory.image_url || '',
            price: subCategory.price || 0,
            points_per_kg: subCategory.points_per_kg || 0,
          },
        ])
        .select();

      if (error) throw new Error(error.message);
      return { data: data?.[0] as SubCategory, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء إضافة الفئة الفرعية';
      console.error('Error adding subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * تحديث فئة فرعية
   */
  async updateSubCategory(id: string, subCategory: Partial<SubCategory>): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('subcategories')
        .update({
          name: subCategory.name,
          category_id: subCategory.category_id,
          description: subCategory.description,
          image_url: subCategory.image_url,
          price: subCategory.price,
          points_per_kg: subCategory.points_per_kg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return { data: data?.[0] as SubCategory, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء تحديث الفئة الفرعية';
      console.error('Error updating subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * حذف فئة فرعية
   */
  async deleteSubCategory(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء حذف الفئة الفرعية';
      console.error('Error deleting subcategory:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * الحصول على فئة فرعية بواسطة المعرف
   */
  async getSubCategoryById(id: string): Promise<{ data: SubCategory | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      const { data, error } = await supabase
        .from('subcategories')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return { data: data as SubCategory, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف أثناء جلب الفئة الفرعية';
      console.error('Error fetching subcategory:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  // ========== عناصر النفايات ==========
  
  /**
   * الحصول على قائمة العناصر
   */
  async getWasteItems(filters?: { categoryId?: string; subcategoryId?: string }): Promise<{ data: WasteItem[] | null; error: string | null }> {
    try {
      if (!supabase) throw new Error('لم يتم تهيئة Supabase');
      
      let query = supabase
        .from('waste_data_admin')
        .select('*, categories(name), subcategories(name)')
        .order('name');
      
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      
      if (filters?.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return { data: data as WasteItem[], error: null };
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