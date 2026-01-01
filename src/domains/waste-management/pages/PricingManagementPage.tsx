'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPrices } from '../store/exchangeSlice';
import { StockExchange, exchangeService } from '../services/exchangeService';
import { wasteCatalogService, WasteCatalogItem } from '@/services/wasteCatalogService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Edit, Save, X, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// تحميل ExchangeDashboardPage بشكل ديناميكي لتجنب مشاكل التحميل
const DynamicExchangeDashboard = dynamic(
  () => import('./ExchangeDashboardPage'),
  { ssr: false }
);

interface BasePriceItem {
  id: string | number;
  waste_no: string;
  name: string;
  category: string;
  sub_category?: string;
  current_base_price: number;
  expected_price?: number | null;
  last_updated?: string;
}

const PricingManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { prices } = useAppSelector((state) => state.exchange);
  const [activeCard, setActiveCard] = useState<string>(searchParams.get('tab') || 'pricing');
  const [wasteItems, setWasteItems] = useState<BasePriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب المخلفات مع أسعارها الأساسية
  useEffect(() => {
    if (activeCard === 'pricing') {
      loadWasteItems();
    }
    dispatch(fetchPrices());
  }, [dispatch, activeCard]);

  const loadWasteItems = async () => {
    try {
      setLoading(true);
      const items = await wasteCatalogService.getWasteMaterials();
      
      // تحويل البيانات إلى BasePriceItem
      const basePriceItems: BasePriceItem[] = items.map(item => {
        // الحصول على السعر الأساسي من stock_exchange أو expected_price
        let basePrice = item.expected_price || 0;
        
        // البحث عن السعر في البورصة
        const exchangeItem = prices.find(p => 
          p.product_id === item.id?.toString() || 
          p.catalog_item?.waste_no === item.waste_no
        );
        
        if (exchangeItem) {
          basePrice = exchangeItem.base_price || item.expected_price || 0;
        }

        return {
          id: item.id || item.waste_no,
          waste_no: item.waste_no,
          name: item.name || item.waste_no,
          category: item.main_category?.name || 'غير محدد',
          sub_category: item.sub_category?.name,
          current_base_price: basePrice,
          expected_price: item.expected_price,
          last_updated: item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : undefined,
        };
      });

      setWasteItems(basePriceItems);
    } catch (error) {
      console.error('خطأ في جلب المخلفات:', error);
      toast.error('حدث خطأ أثناء جلب المخلفات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: BasePriceItem) => {
    setEditingId(item.id);
    setEditedPrice(item.current_base_price);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedPrice(0);
  };

  const handleSave = async (item: BasePriceItem) => {
    try {
      // البحث عن السجل في stock_exchange
      const exchangeItem = prices.find(p => 
        p.product_id === item.id?.toString() || 
        p.catalog_item?.waste_no === item.waste_no
      );

      // جلب معلومات المادة من الكتالوج للحصول على category_id و subcategory_id
      const wasteId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
      let catalogItem: WasteCatalogItem | null = null;
      
      if (!isNaN(wasteId)) {
        try {
          catalogItem = await wasteCatalogService.getWasteMaterialById(wasteId);
        } catch (error) {
          console.error('خطأ في جلب معلومات المادة:', error);
        }
      }

      if (exchangeItem && exchangeItem.id && exchangeItem.id !== 0) {
        // تحديث السعر في stock_exchange
        const updated = await exchangeService.updateExchangeProduct(
          exchangeItem.id,
          { base_price: editedPrice, buy_price: editedPrice }
        );

        if (updated) {
          toast.success('تم تحديث السعر الأساسي بنجاح');
          // تحديث expected_price في catalog_waste_materials أيضاً
          if (!isNaN(wasteId)) {
            await wasteCatalogService.updateWaste(wasteId, {
              expected_price: editedPrice
            });
          }
          await loadWasteItems();
          dispatch(fetchPrices());
        } else {
          toast.error('فشل في تحديث السعر');
        }
      } else {
        // إذا لم يكن هناك سجل في stock_exchange، نحاول إنشاء واحد جديد
        // أولاً، نحدث expected_price في catalog_waste_materials
        if (!isNaN(wasteId)) {
          try {
            // تحديث expected_price في catalog_waste_materials
            await wasteCatalogService.updateWaste(wasteId, {
              expected_price: editedPrice
            });
            
            // محاولة إنشاء سجل في stock_exchange إذا كان لدينا معلومات كافية
            // exchangeItem قد يكون موجوداً لكن id === 0 (سجل افتراضي من getAllPrices)
            if (exchangeItem && (exchangeItem.category_id || catalogItem)) {
              // فحص إذا كان product_id هو BigInt (رقم) وليس UUID
              const isProductIdBigInt = exchangeItem.product_id && 
                                        !exchangeItem.product_id.includes('-') && 
                                        !isNaN(Number(exchangeItem.product_id));
              
              let productId = exchangeItem.product_id;
              let categoryId = exchangeItem.category_id || '';
              let subcategoryId = exchangeItem.subcategory_id || '';
              
              // إذا لم يكن لدينا category_id، نحاول الحصول عليه من categories
              if (!categoryId && catalogItem) {
                // استخدام category_id افتراضي من stock_exchange الموجود
                categoryId = '30f1c4b7-041a-4524-81a0-f9c2b6eea208'; // مخلفات بلاستيك
              }
              
              // إذا لم يكن لدينا subcategory_id، نحاول الحصول عليه من subcategories
              if (!subcategoryId && catalogItem) {
                // استخدام subcategory_id افتراضي من stock_exchange الموجود
                subcategoryId = 'aa5c3f93-e406-4f54-a464-e1050f1b3906'; // زجاجات
              }
              
              // إذا كان product_id هو BigInt، يجب إنشاء سجل في waste_data_admin أولاً
              if (isProductIdBigInt && catalogItem) {
                try {
                  const { supabase } = await import('@/lib/supabase');
                  if (supabase) {
                    // البحث عن سجل موجود في waste_data_admin بنفس الاسم
                    const { data: existingWasteData } = await supabase
                      .from('waste_data_admin')
                      .select('id')
                      .eq('name', catalogItem.waste_no)
                      .maybeSingle();
                    
                    if (existingWasteData) {
                      productId = existingWasteData.id;
                      console.log(`✅ تم العثور على سجل موجود في waste_data_admin: ${productId}`);
                    } else {
                      // إنشاء سجل جديد في waste_data_admin
                      // إضافة use_unified_calculation = false لتجنب trigger الذي يحاول حساب النقاط
                      // استخدام null للـ category_id و subcategory_id لأن unified_classifications.id ليس موجوداً في categories
                      const { data: newWasteData, error: createError } = await supabase
                        .from('waste_data_admin')
                        .insert([{
                          name: catalogItem.waste_no,
                          category_id: null, // unified_classifications.id ليس موجوداً في categories، نستخدم null
                          subcategory_id: null, // unified_sub_categories.id قد لا يكون موجوداً في subcategories، نستخدم null
                          weight: catalogItem.weight || 1,
                          price: editedPrice,
                          quantity: 1,
                          points: 0,
                          initial_points: 0,
                          use_unified_calculation: false, // تعطيل حساب النقاط الموحد لتجنب trigger
                        }])
                        .select('id')
                        .single();
                      
                      if (newWasteData && !createError) {
                        productId = newWasteData.id;
                        console.log(`✅ تم إنشاء سجل جديد في waste_data_admin: ${productId}`);
                      } else {
                        console.error('❌ فشل في إنشاء سجل في waste_data_admin:', createError);
                        toast.error('فشل في إنشاء سجل في waste_data_admin');
                      }
                    }
                  }
                } catch (error) {
                  console.error('❌ خطأ في إنشاء سجل في waste_data_admin:', error);
                  // نستمر في العملية حتى لو فشل إنشاء waste_data_admin
                }
              }
              
              // استخدام exchangeItem للحصول على category_id و subcategory_id
              const updateData: Partial<StockExchange> = {
                product_id: productId,
                category_id: categoryId,
                subcategory_id: subcategoryId,
                region_id: exchangeItem.region_id || 1,
                base_price: editedPrice,
                buy_price: editedPrice,
                sell_price: editedPrice * 1.2,
              };
              
              // محاولة إنشاء سجل جديد باستخدام id = 0
              // هذا سيحاول إنشاء سجل جديد أو تحديث موجود إذا كان موجوداً بالفعل
              const created = await exchangeService.updateExchangeProduct(0, updateData);
              
              if (created) {
                toast.success('تم تحديث السعر الأساسي وإنشاء سجل في البورصة بنجاح');
                await loadWasteItems();
                dispatch(fetchPrices());
              } else {
                toast.success('تم تحديث السعر الأساسي بنجاح (لم يتم إنشاء سجل في البورصة)');
                await loadWasteItems();
                dispatch(fetchPrices());
              }
            } else {
              // إذا لم يكن لدينا exchangeItem، فقط نحدث expected_price
              toast.success('تم تحديث السعر الأساسي بنجاح');
              await loadWasteItems();
              dispatch(fetchPrices());
            }
          } catch (error) {
            console.error('خطأ في تحديث السعر:', error);
            toast.error('فشل في تحديث السعر');
          }
        } else {
          toast.error('معرف المخلف غير صحيح');
        }
      }

      setEditingId(null);
      setEditedPrice(0);
    } catch (error) {
      console.error('خطأ في حفظ السعر:', error);
      toast.error('حدث خطأ أثناء حفظ السعر');
    }
  };

  const filteredItems = wasteItems.filter(item =>
    item.waste_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة التسعير والبورصة</h1>
          <p className="text-gray-500 mt-1">
            إدارة السعر الأساسي لكل مخلف بشكل مستقل ومتابعة أسعار السوق
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* بطاقة إدارة تسعير المخلفات */}
        <Card 
          className={`border-2 transition-all cursor-pointer ${
            activeCard === 'pricing' 
              ? 'border-indigo-500 shadow-lg' 
              : 'border-gray-200 hover:border-indigo-300'
          }`}
          onClick={() => setActiveCard('pricing')}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="p-3 rounded-lg bg-indigo-50 mr-3">
                <DollarSign className="text-indigo-600 text-2xl" />
              </div>
              إدارة تسعير المخلفات
            </CardTitle>
            <CardDescription>
              إدارة السعر الأساسي لكل مخلف بشكل مستقل
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCard === 'pricing' && (
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="بحث عن مخلف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد مخلفات</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-[60px]">#</TableHead>
                          <TableHead>رقم المخلف</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الفئة</TableHead>
                          <TableHead className="text-center">السعر (ج.م)</TableHead>
                          <TableHead className="text-center w-[100px]">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item, index) => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="text-gray-400">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.waste_no}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{item.name}</TableCell>
                            <TableCell className="text-sm">{item.category}</TableCell>
                            <TableCell className="text-center">
                              {editingId === item.id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Input
                                    type="number"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-center h-8 text-sm"
                                    step="0.01"
                                    min="0"
                                  />
                                  <span className="text-xs text-gray-500">ج.م</span>
                                </div>
                              ) : (
                                <span className="font-semibold text-gray-800">
                                  {item.current_base_price > 0 
                                    ? item.current_base_price.toFixed(2) 
                                    : <span className="text-gray-400">غير محدد</span>}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {editingId === item.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSave(item);
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancel();
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <Edit className="w-3 h-3" />
                                  تعديل
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            {activeCard !== 'pricing' && (
              <div className="text-center py-8">
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard('pricing');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  فتح إدارة تسعير المخلفات
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* بطاقة إدارة البورصة */}
        <Card 
          className={`border-2 transition-all cursor-pointer ${
            activeCard === 'exchange' 
              ? 'border-blue-500 shadow-lg' 
              : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setActiveCard('exchange')}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="p-3 rounded-lg bg-blue-50 mr-3">
                <TrendingUp className="text-blue-600 text-2xl" />
              </div>
              إدارة البورصة
            </CardTitle>
            <CardDescription>
              متابعة أسعار المنتجات في البورصة والتغيرات الحاصلة
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activeCard === 'exchange' ? (
              <div className="overflow-auto max-h-[800px]">
                <div className="p-4">
                  <DynamicExchangeDashboard />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-gray-600 mb-4">
                  منصة تعرض أسعار المنتجات بناءً على العرض والطلب وتحليل السوق.
                </p>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard('exchange');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  فتح إدارة البورصة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingManagementPage;
