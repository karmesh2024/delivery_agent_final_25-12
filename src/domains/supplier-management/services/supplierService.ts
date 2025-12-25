import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { Supplier, SupplierPriceOffer, SupplierContactPerson, SupplierDocument, SupplierCategory, Category, SupplierFinancialDetails } from '../types';

// خدمة إدارة الموردين
export const supplierService = {
  // جلب جميع الموردين
  async getAll() {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('suppliers')
        .select(`
          *,
          documents:supplier_documents(*),
          financial_details:supplier_financial_details(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }
      
      // تحويل البيانات للتوافق مع واجهة Supplier في types.ts
      const suppliers = data.map(supplier => {
        const transformedSupplier = ({
          ...supplier,
          supplier_code: supplier.supplier_code || '',
          supplier_type_id: supplier.supplier_type_id || 0,
          // التأكد من financial_details هو كائن أو كائن فارغ (علاقة واحد لواحد)
          financial_details: supplier.financial_details || {}
        });
        // console.log("supplierService: Transformed financial_details in getAll (per supplier):", transformedSupplier.financial_details);
        return transformedSupplier;
      });
      
      return suppliers as Supplier[];
    } catch (error) {
      console.error('خطأ في جلب الموردين:', error);
      toast.error('حدث خطأ أثناء جلب الموردين');
      return [];
    }
  },

  // جلب مورد بواسطة المعرف
  async getById(id: number) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
    
      const { data: supplierData, error: supplierError } = await supabase!
        .from('suppliers')
        .select(`
          *,
          documents:supplier_documents(*),
          categories:supplier_categories(
            category_id,
            categories:category_id(*)
          ),
          financial_details:supplier_financial_details(*)
        `)
        .eq('id', id)
        .single();

      if (supplierError) {
        throw supplierError;
      }
      
      // console.log("supplierService: Raw financial_details from Supabase (getById):", supplierData.financial_details);

      // جلب الفئات المرتبطة بالمورد
      const categories = supplierData.categories ? supplierData.categories.map((item: { categories: Category }) => item.categories) : [];

      // تحويل البيانات للتوافق مع واجهة Supplier في types.ts
      if (supplierData) {
        const supplier = {
          ...supplierData,
          supplier_code: supplierData.supplier_code || '',
          supplier_type_id: supplierData.supplier_type_id || 0,
          documents: supplierData.documents || [], // إضافة المستندات التي تم جلبها
          categories: categories || [], // إضافة الفئات التي تم جلبها
          financial_details: supplierData.financial_details || {} // إضافة التفاصيل المالية (علاقة واحد لواحد)
        };
        return supplier as Supplier;
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في جلب المورد رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء جلب بيانات المورد');
      return null;
    }
  },

  // إضافة مورد جديد
  async add(supplier: Omit<Supplier, 'id'>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      // حفظ نسخة من الفئات والتفاصيل المالية قبل الحذف
      const categories = supplier.categories ? [...supplier.categories] : [];
      const financialDetails = supplier.financial_details ? { ...supplier.financial_details } : null;
      
      // حذف الفئات والتفاصيل المالية من كائن المورد لأنها ستضاف لاحقا أو تُحدّث بشكل منفصل
      const supplierDataToInsert = { ...supplier };
      delete supplierDataToInsert.categories;
      delete supplierDataToInsert.financial_details;
      
      // التأكد من وجود الحقول المطلوبة
      const supplierData = {
        ...supplierDataToInsert,
        supplier_code: supplier.supplier_code || '',
        supplier_type_id: supplier.supplier_type_id || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase!
        .from('suppliers')
        .insert([supplierData])
        .select();

      if (error) {
        throw error;
      }
      
      // إذا تم إضافة المورد بنجاح، قم بإضافة التفاصيل المالية إذا كانت موجودة
      if (data && data[0]) {
        const newSupplierId = data[0].id;
        if (financialDetails && Object.keys(financialDetails).length > 0) {
          const { error: financialError } = await supabase!
            .from('supplier_financial_details')
            .upsert({ ...financialDetails, supplier_id: newSupplierId }, { onConflict: 'supplier_id' });

          if (financialError) {
            console.error('خطأ في إضافة التفاصيل المالية:', financialError);
            toast.error('حدث خطأ أثناء إضافة التفاصيل المالية');
            // لا تمنع إضافة المورد الرئيسي إذا فشلت التفاصيل المالية
          }
        }

        // إذا كان هناك فئات محددة، أضفها إلى جدول supplier_categories
        if (categories && categories.length > 0) {
          const supplierId = data[0].id;
          const categoryIds = categories.map(category => category.id);
          await this.saveSupplierCategories(supplierId, categoryIds);
        }
      }
      
      toast.success('تم إضافة المورد بنجاح');
      
      if (data && data[0]) {
        const newSupplier = {
          ...data[0],
          supplier_code: data[0].supplier_code || '',
          supplier_type_id: data[0].supplier_type_id || 0,
          categories: categories || [],
          financial_details: financialDetails || {} // إضافة التفاصيل المالية التي تم إدخالها
        };
        return newSupplier as Supplier;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      toast.error('حدث خطأ أثناء إضافة المورد');
      return null;
    }
  },

  // تحديث مورد موجود
  async update(id: number, supplier: Partial<Supplier>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      // حفظ نسخة من الفئات والتفاصيل المالية قبل الحذف
      const categories = supplier.categories ? [...supplier.categories] : [];
      const financialDetails = supplier.financial_details ? { ...supplier.financial_details } : null;
      
      // حذف الفئات والتفاصيل المالية من كائن المورد لأنها ستحدث لاحقا بشكل منفصل
      const supplierDataToUpdate = { ...supplier };
      delete supplierDataToUpdate.categories;
      delete supplierDataToUpdate.financial_details;
      
      const { data, error } = await supabase!
        .from('suppliers')
        .update({ 
          ...supplierDataToUpdate, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      // تحديث التفاصيل المالية إذا كانت موجودة
      if (financialDetails && Object.keys(financialDetails).length > 0) {
        const { error: financialError } = await supabase!
          .from('supplier_financial_details')
          .upsert({ ...financialDetails, supplier_id: id }, { onConflict: 'supplier_id' });

        if (financialError) {
          console.error('خطأ في تحديث التفاصيل المالية:', financialError);
          toast.error('حدث خطأ أثناء تحديث التفاصيل المالية');
          // لا تمنع تحديث المورد الرئيسي إذا فشلت التفاصيل المالية
        }
      }

      // تحديث الفئات إذا كانت موجودة
      if (categories && categories.length > 0) {
        const categoryIds = categories.map(category => category.id);
        await this.saveSupplierCategories(id, categoryIds);
      }
      
      toast.success('تم تحديث المورد بنجاح');
      
      if (data && data[0]) {
        const updatedSupplier = {
          ...data[0],
          supplier_code: data[0].supplier_code || '',
          supplier_type_id: data[0].supplier_type_id || 0,
          categories: categories,
          financial_details: financialDetails || {} // إضافة التفاصيل المالية التي تم تحديثها
        };
        return updatedSupplier as Supplier;
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في تحديث المورد رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء تحديث المورد');
      return null;
    }
  },

  // حفظ فئات المورد (إزالة القديمة وإضافة الجديدة)
  async saveSupplierCategories(supplierId: number, categoryIds: string[]): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      // أولاً: حذف العلاقات الموجودة لهذا المورد
      const { error: deleteError } = await supabase!
        .from('supplier_categories')
        .delete()
        .eq('supplier_id', supplierId);
      
      if (deleteError) throw deleteError;
      
      // ثانياً: إنشاء سجلات جديدة للعلاقات
      if (categoryIds.length > 0) {
        const supplierCategories = categoryIds.map(categoryId => ({
          supplier_id: supplierId,
          category_id: categoryId
        }));
        
        const { error: insertError } = await supabase!
          .from('supplier_categories')
          .insert(supplierCategories);
        
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في حفظ فئات المورد:', error);
      toast.error('حدث خطأ أثناء حفظ فئات المورد');
      return false;
    }
  },

  // جلب فئات المورد
  async getSupplierCategories(supplierId: number): Promise<Category[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { data, error } = await supabase!
        .from('categories')
        .select(`
          id, name, description, image_url,
          supplier_categories!inner(supplier_id)
        `)
        .eq('supplier_categories.supplier_id', supplierId);
        
      // Add name_ar property with same value as name
      const processedData = data?.map(item => ({
        ...item,
        name_ar: item.name // Use name as default value for name_ar
      }));
      
      if (error) throw error;
      
      return processedData as Category[];
    } catch (error) {
      console.error(`خطأ في جلب فئات المورد رقم ${supplierId}:`, error);
      toast.error('حدث خطأ أثناء جلب فئات المورد');
      return [];
    }
  },

  // حذف مورد (تحديث الحالة إلى غير نشط)
  async delete(id: number) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { error } = await supabase!
        .from('suppliers')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      toast.success('تم حذف المورد بنجاح');
      return true;
    } catch (error) {
      console.error(`خطأ في حذف المورد رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء حذف المورد');
      return false;
    }
  },

  // ================== خدمات عروض الأسعار ==================

  // جلب جميع عروض الأسعار
  async getAllOffers(filters?: {
    supplierId?: string;
    status?: SupplierPriceOffer['status'];
    productId?: string;
    categoryId?: string;
    validOnly?: boolean;
  }) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      let query = supabase!
        .from('supplier_price_offers')
        .select(`
          *,
          supplier:suppliers(name),
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .order('created_at', { ascending: false });

      // تطبيق المرشحات إذا تم توفيرها
      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // جلب العروض السارية فقط
      if (filters?.validOnly) {
        const today = new Date().toISOString().split('T')[0];
        query = query
          .gte('valid_to', today)
          .lte('valid_from', today)
          .eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      return data as SupplierPriceOffer[];
    } catch (error) {
      console.error('خطأ في جلب عروض الأسعار:', error);
      toast.error('حدث خطأ أثناء جلب عروض الأسعار');
      return [];
    }
  },

  // جلب عرض سعر بواسطة المعرف
  async getOfferById(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_price_offers')
        .select(`
          *,
          supplier:suppliers(name),
          category:categories(name),
          subcategory:subcategories(name),
          product:waste_data_admin(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      return data as SupplierPriceOffer;
    } catch (error) {
      console.error(`خطأ في جلب عرض السعر رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء جلب بيانات عرض السعر');
      return null;
    }
  },

  // إضافة عرض سعر جديد
  async addOffer(offer: Omit<SupplierPriceOffer, 'id'>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_price_offers')
        .insert([{ 
          ...offer, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        }])
        .select();

      if (error) {
        throw error;
      }
      
      toast.success('تم إضافة عرض السعر بنجاح');
      return data?.[0] as SupplierPriceOffer;
    } catch (error) {
      console.error('خطأ في إضافة عرض السعر:', error);
      toast.error('حدث خطأ أثناء إضافة عرض السعر');
      return null;
    }
  },

  // تحديث عرض سعر موجود
  async updateOffer(id: string, offer: Partial<SupplierPriceOffer>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_price_offers')
        .update({ 
          ...offer, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      toast.success('تم تحديث عرض السعر بنجاح');
      return data?.[0] as SupplierPriceOffer;
    } catch (error) {
      console.error(`خطأ في تحديث عرض السعر رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء تحديث عرض السعر');
      return null;
    }
  },

  // تغيير حالة عرض السعر
  async changeOfferStatus(id: string, status: SupplierPriceOffer['status'], notes?: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_price_offers')
        .update({ 
          status,
          notes: notes ? `${notes} (تغيير الحالة: ${status})` : undefined,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      const statusMessage = {
        'active': 'تم تفعيل عرض السعر بنجاح',
        'rejected': 'تم رفض عرض السعر بنجاح',
        'expired': 'تم تحديد عرض السعر كمنتهي بنجاح',
        'accepted': 'تم قبول عرض السعر بنجاح',
        'pending': 'تم تعليق عرض السعر بنجاح'
      };
      
      toast.success(statusMessage[status] || 'تم تحديث حالة عرض السعر بنجاح');
      return data?.[0] as SupplierPriceOffer;
    } catch (error) {
      console.error(`خطأ في تغيير حالة عرض السعر رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء تحديث حالة عرض السعر');
      return null;
    }
  },

  // حذف عرض سعر
  async deleteOffer(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase!
        .from('supplier_price_offers')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      toast.success('تم حذف عرض السعر بنجاح');
      return true;
    } catch (error) {
      console.error(`خطأ في حذف عرض السعر رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء حذف عرض السعر');
      return false;
    }
  },

  // الحصول على متوسط سعر الشراء المقترح لمنتج معين
  async getAveragePrice(productId: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase!
        .from('supplier_price_offers')
        .select('proposed_price')
        .eq('product_id', productId)
        .eq('status', 'active')
        .gte('valid_to', today)
        .lte('valid_from', today);

      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const sum = data.reduce((total, item) => total + item.proposed_price, 0);
      return sum / data.length;
    } catch (error) {
      console.error(`خطأ في حساب متوسط السعر للمنتج ${productId}:`, error);
      return null;
    }
  },

  // ================== خدمات جهات اتصال الموردين ==================

  async getAllContactPersons(supplierId: number): Promise<SupplierContactPerson[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_contact_persons')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('first_name');

      if (error) throw error;
      return data as SupplierContactPerson[];
    } catch (error) {
      console.error(`Error fetching contact persons for supplier ${supplierId}:`, error);
      toast.error('Failed to fetch contact persons.');
      return [];
    }
  },

  async getContactPersonById(id: number): Promise<SupplierContactPerson | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_contact_persons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SupplierContactPerson;
    } catch (error) {
      console.error(`Error fetching contact person ${id}:`, error);
      toast.error('Failed to fetch contact person.');
      return null;
    }
  },

  async addContactPerson(contactPerson: Omit<SupplierContactPerson, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierContactPerson | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_contact_persons')
        .insert([{ ...contactPerson, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
        .select();

      if (error) throw error;
      toast.success('Contact person added successfully!');
      return data?.[0] as SupplierContactPerson;
    } catch (error) {
      console.error('Error adding contact person:', error);
      toast.error('Failed to add contact person.');
      return null;
    }
  },

  async updateContactPerson(id: number, contactPerson: Partial<SupplierContactPerson>): Promise<SupplierContactPerson | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_contact_persons')
        .update({ ...contactPerson, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      toast.success('Contact person updated successfully!');
      return data?.[0] as SupplierContactPerson;
    } catch (error) {
      console.error(`Error updating contact person ${id}:`, error);
      toast.error('Failed to update contact person.');
      return null;
    }
  },

  async deleteContactPerson(id: number): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase!
        .from('supplier_contact_persons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف جهة الاتصال بنجاح');
      return true;
    } catch (error) {
      console.error(`خطأ في حذف جهة الاتصال رقم ${id}:`, error);
      toast.error('حدث خطأ أثناء حذف جهة الاتصال');
      return false;
    }
  },

  // إضافة مستند جديد لمورد
  async addDocument(supplierId: string, document: SupplierDocument): Promise<SupplierDocument | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_documents')
        .insert([{ ...document, supplier_id: parseInt(supplierId) }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      toast.success('تم إضافة المستند بنجاح!');
      return data as SupplierDocument;
    } catch (error) {
      console.error('خطأ في إضافة المستند:', error);
      toast.error('حدث خطأ أثناء إضافة المستند');
      return null;
    }
  },

  // تحديث حالة مستند
  async updateDocumentStatus(documentId: string, newStatus: SupplierDocument['status']): Promise<SupplierDocument | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_documents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      toast.success('تم تحديث حالة المستند بنجاح!');
      return data as SupplierDocument;
    } catch (error) {
      console.error(`خطأ في تحديث حالة المستند ${documentId}:`, error);
      toast.error('حدث خطأ أثناء تحديث حالة المستند');
      return null;
    }
  },
};

export default supplierService; 