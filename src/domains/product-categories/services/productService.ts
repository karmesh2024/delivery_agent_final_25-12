import { supabase } from '@/lib/supabase';
import { wasteCatalogSyncService } from '@/services/wasteCatalogSyncService';
import { subcategoryExchangePriceService } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { withTransaction } from '@/lib/transactionWrapper';
import { auditService } from '@/services/auditService';

export interface Product {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  weight: number;
  price: number;
  quantity: number;
  points: number;
  initial_points: number;
  // per_kg أو per_piece لتحديد طريقة حساب نقاط المستخدم لهذا المنتج
  points_mode?: 'per_kg' | 'per_piece' | null;
  // طريقة تسعير المنتج مالياً: per_kg أو per_piece (قابلة للتوسّع مستقبلاً)
  pricing_mode?: 'per_kg' | 'per_piece' | null;
  agent_pricing_mode?: 'per_kg' | 'per_piece' | null;
  is_onboarding_featured?: boolean;
  visible_to_client_app?: boolean;
  visible_to_agent_app?: boolean;
  /** ترتيب العرض في القوائم (بعد الهجرة) */
  display_order?: number | null;
  /** نسبة تعديل السعر عن سعر الفئة % (بعد الهجرة) */
  price_premium_percentage?: number | null;
  /** مبلغ ثابت يُضاف لسعر الكيلو ج (بعد الهجرة) */
  price_premium_fixed_amount?: number | null;
  /** فئة التسعير إن اختلفت عن الفئة الفرعية (بعد الهجرة) */
  pricing_subcategory_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const productService = {
  async getProducts() {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data || [];
  },

  async getProductsBySubcategory(subcategoryId: string) {
    if (!supabase) throw new Error('Supabase client is not initialized');
    // تحويل subcategoryId إلى Number لأن subcategory_id من نوع BigInt في قاعدة البيانات
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*')
      .eq('subcategory_id', Number(subcategoryId));
    
    if (error) {
      console.error(`Error fetching products for subcategory ${subcategoryId}:`, error);
      throw error;
    }
    
    return data || [];
  },

  async getProductById(productId: string) {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
    
    return data;
  },

  async createProduct(
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    userId?: string | null,
    userEmail?: string | null
  ) {
    return withTransaction(
      async () => {
        // تحويل subcategory_id إلى Number إذا كان موجوداً (لأنه BigInt في قاعدة البيانات)
        const productData: any = {
          name: product.name,
          description: product.description || null,
          image_url: product.image_url || null,
          weight: product.weight,
          price: product.price,
          quantity: product.quantity,
          points: product.points,
          initial_points: product.initial_points,
          is_onboarding_featured: product.is_onboarding_featured || false,
          points_mode: product.points_mode || 'per_kg',
          pricing_mode: product.pricing_mode || product.points_mode || 'per_kg',
          subcategory_id: product.subcategory_id ? Number(product.subcategory_id) : null,
          category_id: product.category_id || null,
        };

        console.log('Inserting product data:', productData);

        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data, error } = await supabase
          .from('waste_data_admin')
          .insert(productData)
          .select('*')
          .single();
        
        if (error) {
          console.error('Error creating product:', error);
          console.error('Product data that failed:', productData);
          throw new Error(error.message || 'حدث خطأ أثناء إنشاء المنتج');
        }

        // 🔄 مزامنة المنتج الجديد إلى كتالوج المخلفات والبورصة
        if (data) {
          await wasteCatalogSyncService.syncNewProduct({
            id: data.id,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            subcategory_id: data.subcategory_id,
            weight: data.weight,
            price: data.price,
            price_per_kg: data.price_per_kg,
            image_url: data.image_url,
            visible_to_client_app: data.visible_to_client_app,
            visible_to_agent_app: data.visible_to_agent_app,
          });

          // 🔄 مزامنة السعر إلى البورصة فوراً
          await subcategoryExchangePriceService.syncSingleProductPrice(data.id, userId);
        }
        
        return data;
      },
      {
        auditEntry: {
          entityType: 'product',
          entityId: 'pending',
          entityName: product.name,
          operation: 'create',
          sourceTable: 'waste_data_admin',
          targetTables: ['catalog_waste_materials'],
          userId: userId || undefined,
          userEmail: userEmail || undefined,
          payload: product
        },
        maxRetries: 2,
        timeoutMs: 20000
      }
    );
  },

  async updateProduct(
    productId: string, 
    product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
    userId?: string | null,
    userEmail?: string | null
  ) {
    return withTransaction(
      async () => {
        // تحويل subcategory_id إلى Number إذا كان موجوداً
        const updateData: any = { ...product };
        if (product.subcategory_id !== undefined) {
          updateData.subcategory_id = product.subcategory_id ? Number(product.subcategory_id) : null;
        }
        
        if (!supabase) throw new Error('Supabase client is not initialized');
        const { data, error } = await supabase
          .from('waste_data_admin')
          .update(updateData)
          .eq('id', productId)
          .select('*')
          .single();
        
        if (error) {
          console.error(`Error updating product ${productId}:`, error);
          throw new Error(error.message || 'حدث خطأ أثناء تحديث المنتج');
        }

        // 🔄 مزامنة تحديث المنتج إلى كتالوج المخلفات والبورصة
        if (data) {
          await wasteCatalogSyncService.syncUpdatedProduct({
            id: data.id,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            subcategory_id: data.subcategory_id,
            weight: data.weight,
            price: data.price,
            price_per_kg: data.price_per_kg,
            image_url: data.image_url,
            visible_to_client_app: data.visible_to_client_app,
            visible_to_agent_app: data.visible_to_agent_app,
          });

          // 🔄 تحديث السعر في البورصة فوراً
          await subcategoryExchangePriceService.syncSingleProductPrice(data.id, userId);
        }
        
        return data;
      },
      {
        auditEntry: {
          entityType: 'product',
          entityId: productId,
          entityName: product.name,
          operation: 'update',
          sourceTable: 'waste_data_admin',
          targetTables: ['catalog_waste_materials'],
          userId: userId || undefined,
          userEmail: userEmail || undefined,
          payload: product
        },
        maxRetries: 2,
        timeoutMs: 20000
      }
    );
  },

  async updateProductVisibility(
    productId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data, error } = await supabase
      .from('waste_data_admin')
      .update({
        visible_to_client_app: visibility.visible_to_client_app,
        visible_to_agent_app: visibility.visible_to_agent_app,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('*')
      .single();
    if (error) {
      console.error('Error updating product visibility:', error);
      throw error;
    }
    return data;
  },

  async deleteProduct(
    productId: string,
    userId?: string | null,
    userEmail?: string | null
  ) {
    return withTransaction(
      async () => {
        // 🔄 مزامنة حذف المنتج من كتالوج المخلفات أولاً
        await wasteCatalogSyncService.syncDeletedProduct(productId, false);

        if (!supabase) throw new Error('Supabase client is not initialized');
        const { error } = await supabase
          .from('waste_data_admin')
          .delete()
          .eq('id', productId);
        
        if (error) {
          console.error(`Error deleting product ${productId}:`, error);
          throw error;
        }
        
        return true;
      },
      {
        auditEntry: {
          entityType: 'product',
          entityId: productId,
          operation: 'delete',
          sourceTable: 'waste_data_admin',
          targetTables: ['catalog_waste_materials'],
          userId: userId || undefined,
          userEmail: userEmail || undefined
        },
        maxRetries: 1,
        timeoutMs: 15000
      }
    );
  },

  async uploadProductImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    // محاولة رفع الصورة مع معالجة الأخطاء بشكل أفضل
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('categories_pic')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading product image:', uploadError);
      // إذا كان الخطأ متعلقاً بعدم وجود bucket، نعطي رسالة واضحة
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        throw new Error('Bucket categories_pic غير موجود. يرجى التأكد من إنشاء الـ bucket في Supabase Storage.');
      }
      throw new Error(uploadError.message || 'فشل رفع الصورة');
    }
    
    if (!uploadData) {
      throw new Error('فشل رفع الصورة: لم يتم إرجاع بيانات');
    }
    
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: urlData } = supabase.storage
      .from('categories_pic')
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('فشل الحصول على رابط الصورة العامة');
    }
    
    return urlData.publicUrl;
  },
}; 