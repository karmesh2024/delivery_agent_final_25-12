import { supabase } from '@/lib/supabase';
import { SupplierPriceOffer, SupplierPriceOfferStatus } from '../types';

/**
 * جلب كل عروض الأسعار
 * @returns قائمة بكل عروض الأسعار
 */
export const getAllPriceOffers = async (): Promise<SupplierPriceOffer[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { data, error } = await supabase
    .from('supplier_price_offers')
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching price offers:', error);
    throw new Error(error.message);
  }

  // تنسيق البيانات لتسهيل استخدامها في الواجهة
  const formattedData = data.map(offer => ({
    ...offer,
    supplier_name: offer.suppliers?.name,
    category_name: offer.categories?.name,
    subcategory_name: offer.subcategories?.name,
    product_name: offer.waste_data_admin?.name,
  }));

  return formattedData;
};

/**
 * جلب عروض الأسعار لمورد محدد
 * @param supplierId معرف المورد
 * @returns قائمة بعروض الأسعار للمورد المحدد
 */
export const getPriceOffersBySupplier = async (supplierId: string): Promise<SupplierPriceOffer[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { data, error } = await supabase
    .from('supplier_price_offers')
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching price offers for supplier ${supplierId}:`, error);
    throw new Error(error.message);
  }

  // تنسيق البيانات
  const formattedData = data.map(offer => ({
    ...offer,
    supplier_name: offer.suppliers?.name,
    category_name: offer.categories?.name,
    subcategory_name: offer.subcategories?.name,
    product_name: offer.waste_data_admin?.name,
  }));

  return formattedData;
};

/**
 * جلب عرض سعر محدد بواسطة المعرف
 * @param offerId معرف عرض السعر
 * @returns تفاصيل عرض السعر
 */
export const getPriceOfferById = async (offerId: string): Promise<SupplierPriceOffer> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { data, error } = await supabase
    .from('supplier_price_offers')
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .eq('id', offerId)
    .single();

  if (error) {
    console.error(`Error fetching price offer ${offerId}:`, error);
    throw new Error(error.message);
  }

  // تنسيق البيانات
  const formattedData = {
    ...data,
    supplier_name: data.suppliers?.name,
    category_name: data.categories?.name,
    subcategory_name: data.subcategories?.name,
    product_name: data.waste_data_admin?.name,
  };

  return formattedData;
};

/**
 * إنشاء عرض سعر جديد
 * @param offer بيانات عرض السعر الجديد
 * @returns عرض السعر الذي تم إنشاؤه
 */
export const createPriceOffer = async (offer: Partial<SupplierPriceOffer>): Promise<SupplierPriceOffer> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  // إضافة حالة افتراضية وتاريخ الإنشاء
  const newOffer = {
    ...offer,
    status: offer.status || 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('supplier_price_offers')
    .insert([newOffer])
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .single();

  if (error) {
    console.error('Error creating price offer:', error);
    throw new Error(error.message);
  }

  // تنسيق البيانات
  const formattedData = {
    ...data,
    supplier_name: data.suppliers?.name,
    category_name: data.categories?.name,
    subcategory_name: data.subcategories?.name,
    product_name: data.waste_data_admin?.name,
  };

  return formattedData;
};

/**
 * تحديث حالة عرض السعر
 * @param offerId معرف عرض السعر
 * @param status الحالة الجديدة
 * @returns عرض السعر المحدث
 */
export const updatePriceOfferStatus = async (
  offerId: string,
  status: SupplierPriceOfferStatus
): Promise<SupplierPriceOffer> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { data, error } = await supabase
    .from('supplier_price_offers')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .single();

  if (error) {
    console.error(`Error updating price offer ${offerId}:`, error);
    throw new Error(error.message);
  }

  // تنسيق البيانات
  const formattedData = {
    ...data,
    supplier_name: data.suppliers?.name,
    category_name: data.categories?.name,
    subcategory_name: data.subcategories?.name,
    product_name: data.waste_data_admin?.name,
  };

  return formattedData;
};

/**
 * تحديث عرض السعر بالكامل
 * @param offerId معرف عرض السعر
 * @param offerData بيانات عرض السعر المحدثة
 * @returns عرض السعر المحدث
 */
export const updatePriceOffer = async (
  offerId: string,
  offerData: Partial<SupplierPriceOffer>
): Promise<SupplierPriceOffer> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { data, error } = await supabase
    .from('supplier_price_offers')
    .update({ 
      ...offerData,
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select(`
      *,
      suppliers:supplier_id (name),
      categories:category_id (name),
      subcategories:subcategory_id (name),
      waste_data_admin:product_id (name)
    `)
    .single();

  if (error) {
    console.error(`Error updating price offer ${offerId}:`, error);
    throw new Error(error.message);
  }

  // تنسيق البيانات
  const formattedData = {
    ...data,
    supplier_name: data.suppliers?.name,
    category_name: data.categories?.name,
    subcategory_name: data.subcategories?.name,
    product_name: data.waste_data_admin?.name,
  };

  return formattedData;
};

/**
 * حذف عرض سعر
 * @param offerId معرف عرض السعر
 * @returns void
 */
export const deletePriceOffer = async (offerId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  const { error } = await supabase
    .from('supplier_price_offers')
    .delete()
    .eq('id', offerId);

  if (error) {
    console.error(`Error deleting price offer ${offerId}:`, error);
    throw new Error(error.message);
  }
}; 