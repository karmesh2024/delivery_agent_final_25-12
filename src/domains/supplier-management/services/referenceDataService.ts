import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { DocumentType, PaymentType, Category } from '../types';

export interface Region {
  id: number;
  name: string;
  parent_region_id?: number;
}

export interface SupplierType {
  id: number;
  type_code: string;
  type_name: string;
  type_name_ar: string;
  description?: string;
  icon?: string;
  color_code?: string;
  sort_order?: number;
  is_active?: boolean;
}

// إضافة متغيرات للتخزين المؤقت للبيانات المرجعية
let _cachedPaymentTypes: PaymentType[] | null = null;
let _cachedRegions: Region[] | null = null;
let _cachedSupplierTypes: SupplierType[] | null = null;
let _cachedDocumentTypes: DocumentType[] | null = null;
let _cachedCategories: Category[] | null = null;

export const referenceDataService = {
  async fetchRegions(): Promise<Region[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('regions')
        .select('id, name, parent_region_id');
      
      if (error) throw error;
      
      // مقارنة بالبيانات المخزنة مؤقتًا
      if (_cachedRegions && JSON.stringify(_cachedRegions) === JSON.stringify(data)) {
        return _cachedRegions; // إرجاع نفس المرجع إذا كانت البيانات متطابقة
      }

      _cachedRegions = data as Region[];
      return _cachedRegions;
    } catch (error) {
      console.error('Error fetching regions:', error);
      toast.error('Failed to fetch regions.');
      return [];
    }
  },

  async fetchSupplierTypes(): Promise<SupplierType[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_types')
        .select('id, type_code, type_name, type_name_ar, description, icon, color_code, sort_order, is_active');

      if (error) throw error;

      // مقارنة بالبيانات المخزنة مؤقتًا
      if (_cachedSupplierTypes && JSON.stringify(_cachedSupplierTypes) === JSON.stringify(data)) {
        return _cachedSupplierTypes; // إرجاع نفس المرجع إذا كانت البيانات متطابقة
      }

      _cachedSupplierTypes = data as SupplierType[];
      return _cachedSupplierTypes;
    } catch (error) {
      console.error('Error fetching supplier types:', error);
      toast.error('Failed to fetch supplier types.');
      return [];
    }
  },

  async fetchDocumentTypes(): Promise<DocumentType[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('supplier_document_types')
        .select('id, type_code, type_name, type_name_ar');

      if (error) throw error;

      // مقارنة بالبيانات المخزنة مؤقتًا
      if (_cachedDocumentTypes && JSON.stringify(_cachedDocumentTypes) === JSON.stringify(data)) {
        return _cachedDocumentTypes; // إرجاع نفس المرجع إذا كانت البيانات متطابقة
      }

      _cachedDocumentTypes = data as DocumentType[];
      return _cachedDocumentTypes;
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast.error('Failed to fetch document types.');
      return [];
    }
  },

  async fetchPaymentTypes(): Promise<PaymentType[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('payment_types')
        .select('id, type_name, type_name_ar');
      
      if (error) throw error;

      // مقارنة بالبيانات المخزنة مؤقتًا
      if (_cachedPaymentTypes && JSON.stringify(_cachedPaymentTypes) === JSON.stringify(data)) {
        return _cachedPaymentTypes; // إرجاع نفس المرجع إذا كانت البيانات متطابقة
      }

      _cachedPaymentTypes = data as PaymentType[];
      return _cachedPaymentTypes;
    } catch (error) {
      console.error('Error fetching payment types:', error);
      toast.error('Failed to fetch payment types.');
      return [];
    }
  },
  
  async fetchCategories(): Promise<Category[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase!
        .from('categories')
        .select('id, name, description, image_url');
      
      if (error) throw error;
      
      // إضافة حقل name_ar بنفس قيمة name
      const processedData = data.map(item => ({
        ...item,
        name_ar: item.name // استخدام name كقيمة افتراضية لـ name_ar
      }));

      // مقارنة بالبيانات المخزنة مؤقتًا
      if (_cachedCategories && JSON.stringify(_cachedCategories) === JSON.stringify(processedData)) {
        return _cachedCategories; // إرجاع نفس المرجع إذا كانت البيانات متطابقة
      }

      _cachedCategories = processedData as Category[];
      return _cachedCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories.');
      return [];
    }
  },
  
  async saveSupplierCategories(supplier_id: number, category_ids: string[]): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      // أولاً: حذف العلاقات الموجودة لهذا المورد
      const { error: deleteError } = await supabase!
        .from('supplier_categories')
        .delete()
        .eq('supplier_id', supplier_id);
      
      if (deleteError) throw deleteError;
      
      // ثانياً: إنشاء سجلات جديدة للعلاقات
      if (category_ids.length > 0) {
        const supplierCategories = category_ids.map(category_id => ({
          supplier_id,
          category_id
        }));
        
        const { error: insertError } = await supabase!
          .from('supplier_categories')
          .insert(supplierCategories);
        
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving supplier categories:', error);
      toast.error('Failed to save supplier categories.');
      return false;
    }
  }
}; 