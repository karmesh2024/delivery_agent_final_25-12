'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPrices } from '../store/exchangeSlice';
import { StockExchange, exchangeService } from '../services/exchangeService';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { productService } from '@/domains/product-categories/services/productService';
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
import { Edit, Save, X, RefreshCw, TrendingUp, DollarSign, Filter, Layers, Tag, Eye, EyeOff, ChevronDown, ChevronRight, Box, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import {
  subcategoryExchangePriceService,
  SubcategoryExchangePrice,
} from '../services/subcategoryExchangePriceService';
import { subcategoryPriceApprovalService } from '../services/subcategoryPriceApprovalService';
import { getCurrentUserId } from '@/lib/logger-safe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { PriceTicker } from '../components/PriceTicker';

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
  category_id?: string | number;
  sub_category?: string;
  sub_category_id?: string | number;
  current_base_price: number;
  expected_price?: number | null;
  last_updated?: string;
  is_published?: boolean;
  show_on_ticker?: boolean;
}

interface MainCategory {
  id: string;
  name: string;
  name_ar?: string;
}

interface SubCategory {
  id: string;
  name: string;
  category_id?: string;
}

const PricingManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { prices } = useAppSelector((state) => state.exchange);
  const [activeCard, setActiveCard] = useState<string>(searchParams?.get('tab') || 'pricing');
  const [wasteItems, setWasteItems] = useState<BasePriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // فلاتر الفئات (نفس مصدر إدارة الفئات والمنتجات: waste_main_categories، waste_sub_categories، waste_data_admin)
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // تسعير عام للفئة الفرعية
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number>(0);

  const [subcategoryPrices, setSubcategoryPrices] = useState<(SubcategoryExchangePrice & { subcategory_name?: string })[]>([]);
  const [subcategoryTrends, setSubcategoryTrends] = useState<any[]>([]);
  const [loadingSubcategoryPrices, setLoadingSubcategoryPrices] = useState(false);
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string | number) => {
    const strId = String(id);
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(strId)) {
      newExpanded.delete(strId);
    } else {
      newExpanded.add(strId);
    }
    setExpandedSubcategories(newExpanded);
  };
  const [subcategoryPriceEditOpen, setSubcategoryPriceEditOpen] = useState(false);
  const [subcategoryPriceEditRow, setSubcategoryPriceEditRow] = useState<(SubcategoryExchangePrice & { subcategory_name?: string }) | null>(null);
  const [subcategoryPriceEditValue, setSubcategoryPriceEditValue] = useState<string>('');
  const [subcategoryPriceEditReason, setSubcategoryPriceEditReason] = useState<string>('');

  const [productsData, setProductsData] = useState<any[]>([]);

  // 1. تعريف loadSubcategoryPrices أولاً
  const loadSubcategoryPrices = async () => {
    setLoadingSubcategoryPrices(true);
    try {
      const [list, trends] = await Promise.all([
        subcategoryExchangePriceService.getAllSubcategoryExchangePrices(),
        subcategoryExchangePriceService.getSubcategoryMarketTrends()
      ]);
      setSubcategoryTrends(trends);
      
      // دمج جميع الفئات الفرعية مع الأسعار المسجلة لضمان ظهور الكل
      if (allSubCategories.length > 0) {
        const enhancedList = allSubCategories.map(sub => {
          const existing = list.find(p => p.subcategory_id === Number(sub.id));
          const mainCat = mainCategories.find(c => c.id === sub.category_id);
          return {
            ...existing,
            subcategory_id: Number(sub.id),
            subcategory_name: sub.name,
            main_category_name: mainCat?.name || 'غير محدد',
            buy_price: existing?.buy_price ?? 0,
            show_on_ticker: existing?.show_on_ticker ?? false
          };
        });
        setSubcategoryPrices(enhancedList as any);
      } else {
        setSubcategoryPrices(list as any);
      }
    } catch (e) {
      console.error('خطأ في جلب أسعار الفئات الفرعية:', e);
      toast.error('حدث خطأ أثناء جلب أسعار الفئات الفرعية');
    } finally {
      setLoadingSubcategoryPrices(false);
    }
  };

  // 2. تعريف loadMainCategories
  const loadMainCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await categoryService.getCategories();
      if (result.data) {
        setMainCategories(result.data.map(cat => ({
          id: cat.id,
          name: cat.name,
          name_ar: (cat as { name_ar?: string }).name_ar
        })));
      }
    } catch (error) {
      console.error('خطأ في جلب الفئات الرئيسية:', error);
      toast.error('حدث خطأ أثناء جلب الفئات الرئيسية');
    } finally {
      setLoadingCategories(false);
    }
  };

  // 3. fetchProductsData (بديل loadWasteItems القديم لجلب البيانات فقط)
  const fetchProductsData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, subcategoriesRes, products] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getSubCategories(),
        productService.getProducts(),
      ]);

      const mainCats = categoriesRes.data || [];
      const subCatsAll = subcategoriesRes.data || [];

      if (mainCats.length > 0) {
        setMainCategories(mainCats.map(cat => ({ id: cat.id, name: cat.name, name_ar: (cat as { name_ar?: string }).name_ar })));
      }
      setAllSubCategories(subCatsAll.map(sub => ({
        ...sub,
        category_id: sub.category_id ?? undefined
      })));
      setProductsData(products as any[]);
    } catch (error) {
      console.error('خطأ في جلب المنتجات:', error);
      toast.error('حدث خطأ أثناء جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  // 4. mergeItemsWithPrices (لدمج الأسعار مع المنتجات)
  const mergeItemsWithPrices = React.useCallback(() => {
    if (productsData.length === 0) return;

    const mainIdToName = new Map<string, string>(mainCategories.map(c => [c.id, c.name]));
    const subIdToName = new Map<string, string>();
    const subIdToMainId = new Map<string, string>();
    allSubCategories.forEach(sub => {
      subIdToName.set(sub.id, sub.name);
      if (sub.category_id) subIdToMainId.set(sub.id, sub.category_id);
    });

    const basePriceItems: BasePriceItem[] = productsData.map((p) => {
        const subId = p.subcategory_id != null ? String(p.subcategory_id) : undefined;
        const mainId = subId ? subIdToMainId.get(subId) : undefined;
        const mainName = mainId ? mainIdToName.get(mainId) : null;
        const subName = subId ? subIdToName.get(subId) : undefined;
        // البحث عن السعر في البورصة
        const exchangeItem = prices.find(px => px.product_id === p.id);
        const basePrice = exchangeItem?.base_price ?? exchangeItem?.buy_price ?? Number(p.price_per_kg ?? p.price ?? 0);
        
        return {
          id: p.id,
          waste_no: p.name || p.id.slice(0, 8),
          name: p.name,
          category: mainName ?? 'غير محدد',
          category_id: mainId ? String(mainId) : undefined,
          sub_category: subName,
          sub_category_id: subId ? String(subId) : undefined,
          current_base_price: basePrice,
          expected_price: p.price_per_kg ?? p.price,
          last_updated: p.updated_at ? new Date(p.updated_at).toLocaleDateString('ar-EG') : undefined,
          is_published: (exchangeItem as any)?.is_published ?? (exchangeItem?.id !== 0 && !!exchangeItem?.id),
          show_on_ticker: (exchangeItem as any)?.show_on_ticker ?? true,
        };
    });
    setWasteItems(basePriceItems);
  }, [productsData, prices, mainCategories, allSubCategories]);

  // 5. Computed Values
  const subCategoriesForDropdown = React.useMemo(() => {
    if (selectedMainCategory === 'all' || selectedMainCategory === 'undefined') return allSubCategories;
    return allSubCategories.filter(s => s.category_id === selectedMainCategory);
  }, [selectedMainCategory, allSubCategories]);

  // 6. Effects
  // تحديث القائمة عند تغير البيانات (especially prices form Redux)
  useEffect(() => {
    mergeItemsWithPrices();
  }, [mergeItemsWithPrices]);

  // جلب البيانات الأولية
  useEffect(() => {
    const init = async () => {
      await fetchProductsData();
      await loadSubcategoryPrices();
    };
    init();
    dispatch(fetchPrices());
  }, [dispatch]);
  
  // 7. Actions
  const openSubcategoryPriceEdit = (row: SubcategoryExchangePrice & { subcategory_name?: string }) => {
    setSubcategoryPriceEditRow(row);
    setSubcategoryPriceEditValue(String(row.buy_price ?? 0));
    setSubcategoryPriceEditReason('');
    setSubcategoryPriceEditOpen(true);
  };

  const saveSubcategoryPrice = async () => {
    if (!subcategoryPriceEditRow) return;
    const newPrice = parseFloat(subcategoryPriceEditValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('أدخل سعراً صحيحاً');
      return;
    }
    const userId = await getCurrentUserId();
    const result = await subcategoryExchangePriceService.updateSubcategoryPriceWithApprovalCheck(
      subcategoryPriceEditRow.subcategory_id,
      newPrice,
      userId ?? null,
      subcategoryPriceEditReason || 'تحديث من إدارة التسعير',
      (subId, oldP, newP, reason, uid) =>
        subcategoryPriceApprovalService.createRequest(subId, oldP, newP, reason, uid)
    );
    if (result.applied) {
      toast.success(result.message);
      setSubcategoryPriceEditOpen(false);
      setSubcategoryPriceEditRow(null);
      loadSubcategoryPrices();
    } else if (result.needsApproval) {
      toast.warning(result.message);
      setSubcategoryPriceEditOpen(false);
      setSubcategoryPriceEditRow(null);
      loadSubcategoryPrices();
    } else {
      toast.error(result.message);
    }
  };

  // loadWasteItems alias for compatibility if handleSave uses it
  const loadWasteItems = fetchProductsData;

  const handleEdit = (item: BasePriceItem) => {
    setEditingId(item.id);
    setEditedPrice(item.current_base_price);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedPrice(0);
  };

  const handleSave = async (item: BasePriceItem): Promise<boolean> => {
    try {
      const exchangeItem = prices.find(p => p.product_id === item.id?.toString());
      const productId = item.id?.toString();
      if (!productId) {
        toast.error('معرف المنتج غير صحيح');
        return false;
      }

      if (exchangeItem && exchangeItem.id && exchangeItem.id !== 0) {
        const updated = await exchangeService.updateExchangeProduct(
          exchangeItem.id,
          { base_price: editedPrice, buy_price: editedPrice }
        );
        if (updated) {
          toast.success('تم تحديث السعر الأساسي بنجاح');
          await loadWasteItems();
          dispatch(fetchPrices());
          setEditingId(null);
          setEditedPrice(0);
          return true;
        }
        toast.error('فشل في تحديث السعر');
        return false;
      }

      if (!item.category_id || !item.sub_category_id) {
        toast.error('معرف الفئة مطلوب لإنشاء سجل جديد في البورصة. تأكد أن المنتج مرتبط بفئة رئيسية وفرعية.');
        return false;
      }
      const updateData: Partial<StockExchange> = {
        product_id: productId,
        category_id: String(item.category_id),
        subcategory_id: String(item.sub_category_id),
        region_id: 1,
        base_price: editedPrice,
        buy_price: editedPrice,
        sell_price: editedPrice * 1.2,
      };
      const created = await exchangeService.updateExchangeProduct(0, updateData);
      if (created) {
        toast.success('تم إنشاء سجل في البورصة وتحديث السعر بنجاح');
        await loadWasteItems();
        dispatch(fetchPrices());
        setEditingId(null);
        setEditedPrice(0);
        return true;
      }
      // null = تم تخطي الإنشاء (الفئات من waste وليست UUID) أو فشل - الرسالة تظهر من الخدمة
      setEditingId(null);
      setEditedPrice(0);
      return false;
    } catch (error) {
      console.error('خطأ في حفظ السعر:', error);
      toast.error('حدث خطأ أثناء حفظ السعر');
      return false;
    }
  };

  // فلترة المخلفات حسب البحث والفئات
  const filteredItems = wasteItems.filter(item => {
    // فلترة حسب البحث
    const matchesSearch = !searchTerm || 
      item.waste_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // فلترة حسب الفئة الرئيسية
    const matchesMainCategory = selectedMainCategory === 'all' || 
      item.category_id?.toString() === selectedMainCategory ||
      (selectedMainCategory === 'undefined' && !item.category_id);
    
    // فلترة حسب الفئة الفرعية
    const matchesSubCategory = selectedSubCategory === 'all' ||
      item.sub_category_id?.toString() === selectedSubCategory ||
      (selectedSubCategory === 'undefined' && !item.sub_category_id);
    
    // فلترة حسب التبويب (إذا كنا داخل التبويبات)
    // ملاحظة: التصفية تتم داخل العرض بناءً على التبويب النشط، لكن هنا نحتاج لتصفية القائمة المعروضة
    return matchesSearch && matchesMainCategory && matchesSubCategory;
  });

  const getFilteredItemsByTab = (tab: 'published' | 'unlisted') => {
    return filteredItems.filter(item => {
      if (tab === 'published') return item.is_published;
      return !item.is_published;
    });
  };

  // تسعير عام للفئة الفرعية
  const handleBulkPriceUpdate = async () => {
    if (!selectedSubCategory || selectedSubCategory === 'all' || bulkPrice <= 0) {
      toast.error('الرجاء اختيار فئة فرعية وإدخال سعر صحيح');
      return;
    }

    try {
      const itemsToUpdate = filteredItems.filter(item => 
        item.sub_category_id?.toString() === selectedSubCategory
      );

      if (itemsToUpdate.length === 0) {
        toast.error('لا توجد منتجات في هذه الفئة الفرعية');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of itemsToUpdate) {
        try {
          const ok = await handleSave({ ...item, current_base_price: bulkPrice });
          if (ok) successCount++; else failCount++;
        } catch (error) {
          console.error(`خطأ في تحديث ${item.waste_no}:`, error);
          failCount++;
        }
      }

      toast.success(
        `تم تحديث ${successCount} منتج بنجاح${failCount > 0 ? `، فشل أو تم تخطي ${failCount} منتج (قد لا يكون لها سجل في البورصة أو فئاتها من نظام waste)` : ''}`
      );
      setBulkPriceDialogOpen(false);
      setBulkPrice(0);
      await loadWasteItems();
      dispatch(fetchPrices());
    } catch (error) {
      console.error('خطأ في التسعير العام:', error);
      toast.error('حدث خطأ أثناء التسعير العام');
    }
  };

  const toggleSubcategoryTicker = async (row: SubcategoryExchangePrice) => {
    const newVal = row.show_on_ticker === false ? true : false;
    const ok = await subcategoryExchangePriceService.toggleShowOnTicker(row.subcategory_id, newVal);
    if (ok) {
      toast.success(newVal ? 'ستظهر الفئة في شريط الأسعار' : 'تم إخفاء الفئة من شريط الأسعار');
      loadSubcategoryPrices();
    }
  };

  const toggleProductTicker = async (item: BasePriceItem) => {
    const exchangeItem = prices.find(p => p.product_id === item.id?.toString());
    if (!exchangeItem || !exchangeItem.id) {
      toast.warning('يجب نشر المادة أولاً للتحكم في ظهورها في شريط الأسعار');
      return;
    }
    const newVal = item.show_on_ticker === false ? true : false;
    const ok = await exchangeService.toggleProductShowOnTicker(exchangeItem.id, newVal);
    if (ok) {
      toast.success(newVal ? 'ستظهر المادة في شريط الأسعار' : 'تم إخفاء المادة من شريط الأسعار');
      dispatch(fetchPrices());
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PriceTicker className="rounded-xl shadow-sm mb-4" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة التسعير والبورصة</h1>
          <p className="text-gray-500 mt-1">
            إدارة السعر الأساسي لكل مخلف بشكل مستقل ومتابعة أسعار السوق
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بطاقة أسعار الفئات الفرعية (سعر البورصة للفئة + منطق 10%) */}
        <Card
          className={`border-2 transition-all cursor-pointer ${
            activeCard === 'subcategory-prices'
              ? 'border-emerald-500 shadow-lg'
              : 'border-gray-200 hover:border-emerald-300'
          }`}
          onClick={() => setActiveCard('subcategory-prices')}
        >
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="p-3 rounded-lg bg-emerald-50 mr-3">
                <TrendingUp className="text-emerald-600 text-2xl" />
              </div>
              لوحة شريط البورصة
            </CardTitle>
            <CardDescription>
              إدارة ظهور الفئات والمواد في شريط الأسعار (Tree View).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCard === 'subcategory-prices' ? (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={loadSubcategoryPrices} disabled={loadingSubcategoryPrices}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  تحديث القائمة
                </Button>
                {loadingSubcategoryPrices ? (
                  <div className="text-center py-6 text-gray-500">جاري التحميل...</div>
                ) : subcategoryPrices.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">لا توجد فئات حالياً.</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>الفئة الرئيسية/الفرعية</TableHead>
                          <TableHead className="text-center">المؤشر</TableHead>
                          <TableHead className="text-center">شريط البورصة</TableHead>
                          <TableHead className="text-center">السعر</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subcategoryPrices.map((row: any) => {
                          const subIdStr = String(row.subcategory_id);
                          const isExpanded = expandedSubcategories.has(subIdStr);
                          // استخدام String للمقارنة لدعم UUIDs والأرقام
                          const subProducts = wasteItems.filter(item => {
                            const iName = (item.sub_category || '').trim();
                            const gName = (row.subcategory_name || '').trim();
                            
                            // 1. إذا توفرت الأسماء، نعتمد عليها حصراً
                            if (iName && gName) {
                              return iName === gName;
                            }
                            
                            // 2. إذا لم تتوفر الأسماء، نعود للمعرفات
                            return String(item.sub_category_id) === subIdStr;
                          });
                          
                          return (
                            <React.Fragment key={row.subcategory_id}>
                              <TableRow className={`hover:bg-emerald-50/20 ${isExpanded ? 'bg-emerald-50/10' : ''}`}>
                                <TableCell className="p-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(row.subcategory_id);
                                    }}
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </Button>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="text-[10px] text-gray-400 font-mono leading-none mb-1">{row.main_category_name}</div>
                                  <div className="font-bold text-sm text-emerald-900">{row.subcategory_name}</div>
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  {(() => {
                                    const trend = subcategoryTrends.find(t => Number(t.subcategory_id) === Number(row.subcategory_id));
                                    if (!trend || !trend.old_buy_price) return <span className="text-gray-300">-</span>;
                                    
                                    const currentPrice = Number(row.buy_price) || 0;
                                    const oldPrice = Number(trend.old_buy_price) || 0;
                                    const change = currentPrice - oldPrice;
                                    const percent = oldPrice > 0 ? (change / oldPrice) * 100 : 0;
                                    
                                    if (Math.abs(change) < 0.001) return <span className="text-gray-300">-</span>;
                                    
                                    return (
                                      <div className={`flex items-center justify-center gap-1 text-[10px] font-bold ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                        <span>{percent > 0 ? '+' : ''}{percent.toFixed(1)}%</span>
                                      </div>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={row.show_on_ticker !== false ? "text-emerald-600" : "text-gray-300"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubcategoryTicker(row);
                                    }}
                                  >
                                    {row.show_on_ticker !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </Button>
                                </TableCell>
                                <TableCell className="text-center font-mono text-xs py-2">
                                  {Number(row.buy_price || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openSubcategoryPriceEdit(row)}>
                                    <Edit className="w-3 h-3 text-gray-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                              
                              {isExpanded && (
                                <>
                                  {subProducts.length === 0 ? (
                                    <TableRow className="bg-gray-50/50">
                                      <TableCell colSpan={5} className="text-center py-2 text-[10px] text-gray-400 italic">
                                        لا توجد مواد مسجلة تحت هذه الفئة
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    subProducts.map(product => (
                                      <TableRow key={product.id} className="bg-gray-50/30 hover:bg-gray-100/50 border-l-4 border-l-emerald-200">
                                        <TableCell></TableCell>
                                        <TableCell className="py-1">
                                          <div className="flex items-center gap-2">
                                            <Box className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-600">{product.name}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center py-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className={product.show_on_ticker !== false ? "text-blue-500" : "text-gray-300"}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleProductTicker(product);
                                            }}
                                          >
                                            {product.show_on_ticker !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                          </Button>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-[10px] text-gray-500 py-1">
                                          {product.current_base_price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-1">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0" 
                                            onClick={() => {
                                              setActiveCard('pricing');
                                              handleEdit(product);
                                            }}
                                          >
                                            <Edit className="w-2.5 h-2.5 text-gray-400" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  إدارة ظهور الفئات في شريط الأسعار وتحديث أسعار الفئات (المسعر وغير المسعر).
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard('subcategory-prices');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  فتح لوحة شريط البورصة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
              إدارة السعر الأساسي لكل مادة (المنتجات) والتحكم في ظهورها.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCard === 'pricing' ? (
              <Tabs defaultValue="published" className="w-full">
                <TabsList className="mb-4 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="published"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-6 py-2"
                  >
                    منتجات منشورة
                    <Badge variant="secondary" className="mr-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      {wasteItems.filter(i => i.is_published).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unlisted"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent px-6 py-2"
                  >
                    بانتظار التسعير
                    <Badge variant="secondary" className="mr-2 bg-orange-100 text-orange-700 hover:bg-orange-100">
                      {wasteItems.filter(i => !i.is_published).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  {/* البحث والفلاتر */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={selectedMainCategory} onValueChange={setSelectedMainCategory}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="الفئة الرئيسية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          {mainCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="بحث سريع..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 sticky top-0">
                          <TableRow>
                            <TableHead className="w-[40px]">#</TableHead>
                            <TableHead>المنتج / المادة</TableHead>
                            <TableHead>التصنيف</TableHead>
                            <TableHead className="text-center">السعر</TableHead>
                            <TableHead className="text-center w-[40px]">شريط</TableHead>
                            <TableHead className="w-[60px]">إجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredItemsByTab(activeCard === 'pricing' ? 'published' : 'unlisted').map((item, index) => (
                            <TableRow key={item.id} className="hover:bg-gray-50 text-xs">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <div className="text-[10px] text-gray-400">{item.category}</div>
                                <div className="text-[11px] text-indigo-600 font-medium">{item.sub_category}</div>
                              </TableCell>
                              <TableCell className="text-center font-mono">
                                {editingId === item.id ? (
                                  <Input 
                                    type="number" 
                                    className="h-7 w-16 text-center text-xs" 
                                    value={editedPrice} 
                                    onChange={(e)=>setEditedPrice(Number(e.target.value))} 
                                  />
                                ) : item.current_base_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={item.show_on_ticker !== false ? "text-blue-600 p-0" : "text-gray-300 p-0"}
                                  onClick={(e) => { e.stopPropagation(); toggleProductTicker(item); }}
                                >
                                  {item.show_on_ticker !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                              </TableCell>
                              <TableCell>
                                {editingId === item.id ? (
                                  <div className="flex gap-1">
                                    <Button size="sm" className="h-6 w-6 p-0" onClick={()=>handleSave(item)}><Save className="w-3 h-3"/></Button>
                                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={()=>setEditingId(null)}><X className="w-3 h-3"/></Button>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={()=>handleEdit(item)}><Edit className="w-3 h-3"/></Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Tabs>
            ) : (
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

      {/* حوار تعديل سعر الفئة الفرعية */}
      <Dialog open={subcategoryPriceEditOpen} onOpenChange={setSubcategoryPriceEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل سعر الفئة الفرعية</DialogTitle>
            <DialogDescription>
              {subcategoryPriceEditRow?.subcategory_name ?? subcategoryPriceEditRow?.subcategory_id}. التغيير ≥10% يُرسل كطلب موافقة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>السعر الجديد (ج/كجم)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={subcategoryPriceEditValue}
                onChange={(e) => setSubcategoryPriceEditValue(e.target.value)}
              />
            </div>
            <div>
              <Label>سبب التغيير (اختياري)</Label>
              <Input
                value={subcategoryPriceEditReason}
                onChange={(e) => setSubcategoryPriceEditReason(e.target.value)}
                placeholder="مثال: تحديث حسب السوق"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSubcategoryPriceEditOpen(false)}>إلغاء</Button>
              <Button onClick={saveSubcategoryPrice}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagementPage;
