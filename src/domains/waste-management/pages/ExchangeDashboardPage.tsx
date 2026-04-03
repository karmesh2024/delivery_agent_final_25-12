import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPrices, updateExchangeProduct } from '../store/exchangeSlice';
import { fetchOrders } from '@/domains/waste-management/partners/store/industrialPartnersSlice';
import { StockExchange, exchangeService } from '../services/exchangeService';
import { PartnerOrder } from '@/domains/waste-management/partners/types';
import { wasteCatalogService } from '@/services/wasteCatalogService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Input } from '@/shared/components/ui/input';
import { ArrowUp, ArrowDown, RefreshCw, Edit, Save, X, TrendingUp, AlertTriangle, Calculator, Briefcase, ChevronDown, ChevronRight, Box, Filter, Search, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/shared/components/ui/badge'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { LivePriceTable } from '../components/LivePriceTable';
import { PriceTicker } from '../components/PriceTicker';

const ExchangeDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { prices, loading, error } = useAppSelector((state) => state.exchange);
  const { orders } = useAppSelector((state) => state.industrialPartners); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(true); // تفعيل الوضع المباشر افتراضياً
  
  // حالة التعديل والحاسبة
  const [editingItem, setEditingItem] = useState<StockExchange | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(0);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    costPrice: 0,
    sellPrice: 0,
    marginPercent: 0,
    profitAmount: 0,
    marketAverage: 0
  });
  
  const [trends, setTrends] = useState<any[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedMainCat, setSelectedMainCat] = useState<string>('all');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('all');

  const mainCategories = useMemo(() => {
    const cats = new Set<string>();
    prices.forEach(p => {
      const catName = (p.catalog_item?.main_category as any)?.name || p.category?.name || 'تصنيف عام';
      cats.add(catName);
    });
    return Array.from(cats);
  }, [prices]);

  const subCategories = useMemo(() => {
    const subs = new Set<string>();
    prices.forEach(p => {
      const mainName = (p.catalog_item?.main_category as any)?.name || p.category?.name || 'تصنيف عام';
      if (selectedMainCat === 'all' || mainName === selectedMainCat) {
        const subName = p.catalog_item?.sub_category?.name || p.subcategory?.name || 'عام';
        subs.add(subName);
      }
    });
    return Array.from(subs);
  }, [prices, selectedMainCat]);

  const toggleCat = (catId: string) => {
    const newKeys = new Set(expandedCats);
    if (newKeys.has(catId)) newKeys.delete(catId);
    else newKeys.add(catId);
    setExpandedCats(newKeys);
  };

  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchPrices());
      dispatch(fetchOrders()); // Fetch live market orders
      // Fetch market trends
      const trendsData = await exchangeService.getMarketTrends();
      if (trendsData) {
        setTrends(trendsData);
        console.log("تم جلب trends:", trendsData);
      }
    };
    loadData();
  }, [dispatch]);
  
  // تحديث trends عند تغيير prices
  // استخدام useMemo لإنشاء key من prices لتتبع التغييرات
  const pricesKey = useMemo(() => {
    return prices.map(p => `${p.id}-${p.buy_price}-${p.last_update}`).join('|');
  }, [prices]);
  
  useEffect(() => {
    if (prices.length > 0) {
      // إضافة delay لضمان تحديث البيانات في قاعدة البيانات
      // نستخدم retry mechanism للتأكد من جلب أحدث البيانات
      let retryCount = 0;
      const maxRetries = 3;
      
      const fetchTrends = async () => {
        try {
          const data = await exchangeService.getMarketTrends();
          if (data && data.length > 0) {
            setTrends(data);
            console.log("📊 تم تحديث trends بعد تغيير prices:", {
              trendsCount: data.length,
              trends: data,
              pricesCount: prices.length,
              pricesIds: prices.map(p => ({ id: p.id, product_id: p.product_id }))
            });
          } else {
            // إذا لم تكن هناك trends، نحاول مرة أخرى بعد delay
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(fetchTrends, 500);
            } else {
              console.log("⚠️ لا توجد trends متاحة بعد عدة محاولات");
            }
          }
        } catch (error) {
          console.error("❌ خطأ في جلب trends:", error);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchTrends, 500);
          }
        }
      };
      
      const timeoutId = setTimeout(fetchTrends, 1500); // زيادة delay لضمان تحديث البيانات في قاعدة البيانات
      
      return () => clearTimeout(timeoutId);
    }
  }, [pricesKey, prices.length]); // تحديث عند تغيير pricesKey (يتضمن تغييرات في buy_price)



  // دالة لحساب الهامش بناءً على السعر
  const calculateMargin = (buyPrice: number, sellPrice: number) => {
    const margin = sellPrice - buyPrice;
    const marginPercent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
    return { margin, marginPercent };
  };

  // Helper to calculate average market price from live orders
  const getMarketPrice = (productName: string) => {
    if (!productName) return 0;
    
    // Normalize string for better matching (trim, lowercase)
    const normalizedProductName = productName.trim().toLowerCase();
    
    const relevantItems = orders.flatMap(o => o.items || []).filter(item => {
      const itemName = (item.product_name || '').trim().toLowerCase();
      // Check for partial match in either direction
      return itemName && (itemName.includes(normalizedProductName) || normalizedProductName.includes(itemName));
    });
    
    if (relevantItems.length === 0) return 0;

    const total = relevantItems.reduce((sum, item) => sum + Number(item.agreed_price), 0);
    return total / relevantItems.length;
  };

  // عند تغيير السعر يدوياً، نعيد حساب نسبة الربح
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      const newPrice = parseFloat(e.target.value);
      setEditedPrice(newPrice);
      
      const marketPrice = getMarketPrice(editingItem.product?.name || '');
      const sellPrice = marketPrice || editingItem.sell_price || (editingItem.base_price * 1.2);
      
      const { marginPercent } = calculateMargin(newPrice, sellPrice);
      setTargetMargin(parseFloat(marginPercent.toFixed(1)));
    }
  };

  // عند تغيير نسبة الربح، نعيد حساب السعر تلقائياً
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      const newMarginPercent = parseFloat(e.target.value);
      setTargetMargin(newMarginPercent);

      const marketPrice = getMarketPrice(editingItem.product?.name || '');
      const sellPrice = marketPrice || editingItem.sell_price || (editingItem.base_price * 1.2);
      
      const newBuyPrice = sellPrice * (1 - (newMarginPercent / 100));
      setEditedPrice(parseFloat(newBuyPrice.toFixed(2)));
    }
  };

  const setStandardMargin = () => {
    if (editingItem) {
       const standardMargin = 15;
       setTargetMargin(standardMargin);
       
       const marketPrice = getMarketPrice(editingItem.product?.name || '');
       const sellPrice = marketPrice || editingItem.sell_price || (editingItem.base_price * 1.2);

       const newBuyPrice = sellPrice * (1 - (standardMargin / 100));
       setEditedPrice(parseFloat(newBuyPrice.toFixed(2)));
    }
  };

  const handleSavePrice = async () => {
    if (editingItem) {
      try {
        await dispatch(updateExchangeProduct({
          id: editingItem.id,
          product: { buy_price: editedPrice }
        })).unwrap();
        
        // تحديث trends بعد التحديث
        // trends سيتم تحديثها تلقائياً من useEffect عند تغيير pricesKey
        setTimeout(async () => {
          await dispatch(fetchPrices());
          // trends سيتم تحديثها تلقائياً من useEffect
        }, 1000);
        
        toast.success('تم تحديث سعر المادة بنجاح');
        setEditingItem(null);
      } catch (error) {
        toast.error('فشل في تحديث السعر');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditedPrice(0);
    setTargetMargin(0);
  };

  const getMarginBadgeStyle = (marginPercent: number) => {
    if (marginPercent < 0) return 'bg-red-100 text-red-700 border-red-200';
    if (marginPercent < 15) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const openCalculator = (item: StockExchange) => {
    const marketPrice = getMarketPrice(item.product?.name || ''); // Returns price per Ton
    const currentCostKg = item.buy_price || item.base_price; // Price per Kg
    
    // Determine initial Sell Price (Per Ton)
    // If we have a live market price (Ton), use it.
    // Otherwise, convert the existing Sell Price to Ton.
    // Heuristic: If existing sell_price > 200, assume it's already per Ton (e.g. 27000).
    // If it's small (e.g. 27), assume per Kg and convert to Ton.
    let initialSellPriceTon = 0;
    
    if (marketPrice > 0) {
        initialSellPriceTon = marketPrice;
    } else if (item.sell_price) {
        initialSellPriceTon = item.sell_price > 200 ? item.sell_price : item.sell_price * 1000;
    } else {
        initialSellPriceTon = currentCostKg * 1000 * 1.2; // Estimate standard markup
    }
    
    // Calculate Margin based on: (Sell Ton - Cost Ton) / Sell Ton
    // Make sure costTon accounts for unit conversion if needed, but currentCostKg is usually accurate per Kg.
    const costTon = currentCostKg * 1000;
    const margin = initialSellPriceTon - costTon;
    const marginPercent = initialSellPriceTon > 0 ? (margin / initialSellPriceTon) * 100 : 0;
    
    setEditingItem(item);
    setCalculatorData({
      costPrice: currentCostKg, // Per Kg
      sellPrice: initialSellPriceTon, // Per Ton
      marginPercent: parseFloat(marginPercent.toFixed(1)),
      profitAmount: parseFloat((margin / 1000).toFixed(2)), // Profit per Kg
      marketAverage: marketPrice
    });
    setIsCalculatorOpen(true);
  };

  const updateCalculator = (field: 'cost' | 'sell' | 'margin', value: number) => {
    let newData = { ...calculatorData };

    if (field === 'sell') {
      // Driver: Market Price (Ton)
      newData.sellPrice = value;
      // Calculate Buy Price (Kg)
      // Formula: (SellTon * (1 - Margin%)) / 1000
      newData.costPrice = (value * (1 - (newData.marginPercent / 100))) / 1000;
      
    } else if (field === 'margin') {
      // Driver: Margin %
      newData.marginPercent = value;
      // Calculate Buy Price (Kg) based on fixed Market Price (Ton)
      newData.costPrice = (newData.sellPrice * (1 - (value / 100))) / 1000;

    } else if (field === 'cost') {
      // Driver: User wants to set specific Buy Price (Kg)
      newData.costPrice = value;
      // Calculate implied margin based on fixed Market Price (Ton)
      const costTon = value * 1000;
      const margin = newData.sellPrice - costTon;
      newData.marginPercent = newData.sellPrice > 0 ? (margin / newData.sellPrice) * 100 : 0;
    }

    // Recalculate profit amount (Per Kg)
    // Profit Kg = (Sell Ton / 1000) - Cost Kg
    newData.profitAmount = (newData.sellPrice / 1000) - newData.costPrice;
    
    // Rounding
    newData.sellPrice = parseFloat(newData.sellPrice.toFixed(0)); // Ton price usually integer
    newData.costPrice = parseFloat(newData.costPrice.toFixed(2)); // Kg price needs decimals
    newData.marginPercent = parseFloat(newData.marginPercent.toFixed(1));
    newData.profitAmount = parseFloat(newData.profitAmount.toFixed(2));

    setCalculatorData(newData);
  };

  const saveFromCalculator = async () => {
    if (!editingItem) return;

    // Save old values for history
    const oldBuyPrice = editingItem.buy_price || 0;
    const oldSellPrice = editingItem.sell_price || 0;

    setIsCalculatorOpen(false);

    try {
      // إذا كان id = 0، يعني أنه لا يوجد سجل في stock_exchange
      // في هذه الحالة، نحدث expected_price في catalog_waste_materials فقط
      if (editingItem.id === 0) {
        // تحديث expected_price في catalog_waste_materials
        const catalogId = editingItem.product_id;
        if (catalogId) {
          try {
            const catalogIdNum = typeof catalogId === 'string' ? parseInt(catalogId) : catalogId;
            if (!isNaN(catalogIdNum)) {
              const updated = await wasteCatalogService.updateWaste(catalogIdNum, {
                expected_price: calculatorData.costPrice
              });
              
              if (updated) {
                toast.success("تم تحديث السعر الأساسي بنجاح");
                dispatch(fetchPrices()); // تحديث البيانات
                setEditingItem(null);
                return;
              } else {
                throw new Error("فشل في تحديث السعر في الكتالوج");
              }
            } else {
              throw new Error("معرف المنتج غير صحيح");
            }
          } catch (error: any) {
            console.error("خطأ في تحديث السعر في الكتالوج:", error);
            throw new Error(error?.message || "فشل في تحديث السعر في الكتالوج");
          }
        } else {
          throw new Error("معرف المنتج غير موجود");
        }
      }

      // إذا كان id !== 0، يعني أن هناك سجل موجود في stock_exchange
      const updatePayload: Partial<StockExchange> = {
        buy_price: calculatorData.costPrice,
        sell_price: calculatorData.sellPrice,
        base_price: calculatorData.costPrice, // استخدام costPrice كـ base_price أيضاً
        auto_update_enabled: false
      };

      // 1. Update the product in DB
      const result = await dispatch(updateExchangeProduct({
        id: editingItem.id,
        product: updatePayload
      })).unwrap();

      if (!result) {
        throw new Error("فشل في تحديث المنتج في البورصة");
      }

      // 2. Log history (Fire and forget, or await if critical)
      // فقط إذا كان هناك سجل موجود (id !== 0)
      if (editingItem.id !== 0) {
        try {
          await exchangeService.logPriceHistory({
            stock_exchange_id: editingItem.id,
            product_id: editingItem.product_id,
            region_id: editingItem.region_id,
            old_buy_price: oldBuyPrice,
            new_buy_price: calculatorData.costPrice,
            old_sell_price: oldSellPrice,
            new_sell_price: calculatorData.sellPrice,
            change_reason: 'manual_calculator_adjustment',
            change_source: 'dashboard',
            changed_by: undefined
          });
        } catch (historyError) {
          console.error("خطأ في تسجيل تاريخ السعر:", historyError);
          // لا نوقف العملية إذا فشل تسجيل التاريخ
        }
      }
      
      toast.success("تم تحديث السعر وتسجيله في سجلات البورصة");
      
      // 3. Refresh data to ensure sync
      await dispatch(fetchPrices());
      
      // 4. trends سيتم تحديثها تلقائياً من useEffect عند تغيير pricesKey
      // لا حاجة لتحديث يدوي هنا - useEffect سيتولى ذلك بعد fetchPrices()
      
      setEditingItem(null);

    } catch (error: any) {
      console.error("Error saving price:", error);
      const errorMessage = error?.message || error?.payload || "حدث خطأ أثناء حفظ السعر";
      toast.error(errorMessage);
      dispatch(fetchPrices()); // Revert UI on error
    }
  };

  const filteredExchangeData = useMemo(() => {
    return prices.filter((item) => {
      const itemName = item.catalog_item?.name || item.product?.name || item.product_id;
      const wasteNo = item.catalog_item?.waste_no || '';
      const mainCat = (item.catalog_item?.main_category as any)?.name || item.category?.name || 'تصنيف عام';
      const subCat = item.catalog_item?.sub_category?.name || item.subcategory?.name || 'عام';
      
      const matchesSearch = itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           wasteNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMain = selectedMainCat === 'all' || mainCat === selectedMainCat;
      const matchesSub = selectedSubCat === 'all' || subCat === selectedSubCat;
      
      return matchesSearch && matchesMain && matchesSub;
    });
  }, [prices, searchTerm, selectedMainCat, selectedSubCat]);

  // تجميع البيانات للشجرة
  const treeData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredExchangeData.forEach(item => {
      const key = (item.catalog_item?.main_category as any)?.name || item.category?.name || 'تصنيف عام';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredExchangeData]);



  // Updated handleEditPrice to consider market price
  const handleEditPrice = (item: StockExchange) => {
    setEditingItem(item);
    setEditedPrice(item.buy_price);
    
    // Use market price if available, otherwise formula
    const marketPrice = getMarketPrice(item.product?.name || '') || (item.base_price * 1.2);
    
    const { marginPercent } = calculateMargin(item.buy_price, marketPrice);
    setTargetMargin(parseFloat(marginPercent.toFixed(1)));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">
      {/* Smart Calculator Dialog */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl border-0">
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-primary/5 to-transparent border-b">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  حاسبة التسعير الذكية
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 font-medium">
                  تحويل سعر الطن (السوق) إلى سعر شراء بالكيلو
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 bg-gray-50/50 space-y-6">
            
            {/* Step 1: Market Price (Ton) */}
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                       1. سعر السوق (للطن)
                       <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-normal border-blue-100">بيع للمصانع</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">السعر المتداول حالياً للطن في السوق</p>
                  </div>
                  {calculatorData.marketAverage > 0 && (
                     <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm animate-pulse">
                        live: {calculatorData.marketAverage.toLocaleString()}
                     </Badge>
                  )}
               </div>

               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input 
                      type="number" 
                      value={calculatorData.sellPrice}
                      onChange={(e) => updateCalculator('sell', parseFloat(e.target.value) || 0)}
                      className="text-lg font-bold h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-3 rounded-lg border border-gray-200 min-w-[80px] text-center">ج.م / طن</span>
               </div>
               
               {calculatorData.marketAverage > 0 && calculatorData.sellPrice !== calculatorData.marketAverage && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-medium border border-dashed border-blue-200"
                   onClick={() => updateCalculator('sell', calculatorData.marketAverage)}
                 >
                   استخدام متوسط سعر السوق ({calculatorData.marketAverage.toLocaleString()})
                 </Button>
               )}
            </div>

            {/* Step 2: Margin */}
            <div className="flex items-center gap-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <div className="bg-white p-2 rounded-full border shadow-sm z-10">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-bold text-gray-800">2. هامش الربح المستهدف</Label>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                     ربح الكيلو: <span className="text-green-600 font-bold">{calculatorData.profitAmount.toLocaleString()} ج.م</span>
                  </span>
               </div>

               <div className="flex items-center gap-4">
                   <div className="w-1/3 flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={calculatorData.marginPercent}
                          onChange={(e) => updateCalculator('margin', parseFloat(e.target.value) || 0)}
                          className="font-bold h-10 text-center"
                        />
                        <span className="font-bold text-gray-400">%</span>
                   </div>
                   <div className="flex-1 flex gap-2">
                     {[10, 15, 20, 25].map(m => (
                       <Button 
                         key={m} 
                         variant={calculatorData.marginPercent === m ? "default" : "outline"}
                         size="sm" 
                         className={`flex-1 transition-all ${calculatorData.marginPercent === m ? 'bg-gray-900 shadow-md transform scale-105' : 'text-gray-600'}`}
                         onClick={() => updateCalculator('margin', m)}
                       >
                         {m}%
                       </Button>
                     ))}
                   </div>
               </div>
            </div>

            {/* Step 3: Result (Buy Price Kg) */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-xl shadow-lg text-white relative overflow-hidden mt-2">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                 <Briefcase className="w-24 h-24" />
              </div>
              
              <div className="relative z-10 flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-lg font-bold text-green-50 opacity-90">3. سعر الشراء (للكيلو)</h3>
                    <p className="text-xs text-green-100/70 max-w-[200px]">السعر الذي سيظهر للمناديب في التطبيق</p>
                 </div>
                 
                 <div className="text-right">
                    <div className="flex items-baseline justify-end gap-2">
                        <Input 
                          type="number" 
                          value={calculatorData.costPrice}
                          onChange={(e) => updateCalculator('cost', parseFloat(e.target.value) || 0)}
                          className="w-32 text-3xl font-bold bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 focus-visible:ring-0 focus-visible:border-white text-right px-0 h-10"
                        />
                        <span className="text-lg font-medium text-green-100">ج.م</span>
                    </div>
                    <div className="text-xs text-green-200 mt-1 font-mono tracking-wider opacity-80">PER KG</div>
                 </div>
              </div>
            </div>

          </div>

          <DialogFooter className="p-4 bg-white border-t gap-3">
            <Button variant="outline" onClick={() => setIsCalculatorOpen(false)} className="h-11 px-8 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-900">
               إلغاء
            </Button>
            <Button onClick={saveFromCalculator} className="h-11 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg flex-1 sm:flex-none min-w-[160px]">
              <Save className="w-4 h-4 mr-2" />
              <span>اعتماد السعر</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       {/* ... Header ... */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم البورصة</h1>
          <p className="text-gray-500 mt-1">إدارة أسعار المواد ونسب الربحية بنظام الشجرة والفلترة الذكية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="بحث في المواد..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-white"
            />
          </div>
          <Select value={selectedMainCat} onValueChange={setSelectedMainCat}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="الفئة الرئيسية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {mainCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubCat} onValueChange={setSelectedSubCat}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="الفئة الفرعية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفرعية</SelectItem>
              {subCategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="bg-white border mb-6 p-1 rounded-xl">
          <TabsTrigger value="prices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-6">أسعار المواد</TabsTrigger>
          <TabsTrigger value="market_orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-6">طلبات السوق (جديد)</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-6">الإحصائيات</TabsTrigger>
        </TabsList>
        
        {/* شريط تمرير الأسعار المباشر */}
        <PriceTicker className="mb-4" />
        
        <TabsContent value="prices">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">أسعار المواد</CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    variant={isLiveMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsLiveMode(!isLiveMode)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    {isLiveMode ? 'مباشر' : 'عادي'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch(fetchPrices());
                      exchangeService.getMarketTrends().then(data => {
                        if (data) setTrends(data);
                      });
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    تحديث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLiveMode ? (
                <LivePriceTable 
                  searchTerm={searchTerm}
                  onPriceUpdate={(updatedPrice) => {
                    console.log('تم تحديث السعر:', updatedPrice);
                    toast.info(`تم تحديث سعر ${updatedPrice.catalog_item?.waste_no || updatedPrice.product?.name}`);
                  }}
                />
              ) : (
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="hover:bg-transparent">
                     {/* ... Headers ... */}
                    <TableHead className="w-[50px] text-center font-bold text-gray-600">#</TableHead>
                    <TableHead className="text-right font-bold text-gray-600">المادة</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">الأساسي</TableHead>
                    <TableHead className="text-center font-bold text-primary">سعر الشراء (تداول)</TableHead>
                    <TableHead className="text-center font-bold text-blue-600">سعر البيع (للطن)</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">مؤشر السوق (24h)</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">نسبة التغير</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">آخر تحديث</TableHead>
                    <TableHead className="text-center font-bold text-gray-600">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(treeData).map(([catName, items], catIndex) => {
                    const isExpanded = expandedCats.has(catName);
                    return (
                      <React.Fragment key={catName}>
                        {/* Row for Category */}
                        <TableRow className="bg-gray-50/50 hover:bg-gray-100/80 cursor-pointer border-r-4 border-r-primary/40" onClick={() => toggleCat(catName)}>
                          <TableCell className="text-center font-bold text-gray-400">
                            {isExpanded ? <ChevronDown className="w-5 h-5 mx-auto" /> : <ChevronRight className="w-5 h-5 mx-auto" /> }
                          </TableCell>
                          <TableCell colSpan={2} className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Layers className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-primary font-bold opacity-70">الفئة الرئيسية</div>
                                <div className="text-lg font-black text-gray-900">{catName}</div>
                              </div>
                              <Badge variant="outline" className="mr-2 bg-white">{items.length} مواد</Badge>
                            </div>
                          </TableCell>
                          <TableCell colSpan={6}></TableCell>
                        </TableRow>

                        {/* Rows for Items under Category */}
                        {isExpanded && items.map((item, index) => {
                          const itemName = item.catalog_item?.name || item.product?.name || item.product_id;
                          const buyPrice = item.buy_price || 0;
                          const sellPrice = item.sell_price || 0;
                          const basePrice = item.base_price || 0;
                          
                          return (
                            <TableRow key={`${item.id}-${index}`} className="hover:bg-blue-50/20 transition-all border-l-4 border-l-blue-200 bg-white shadow-soft">
                              <TableCell className="text-center text-gray-300 font-mono text-xs">{catIndex + 1}.{index + 1}</TableCell>
                              <TableCell className="font-semibold text-gray-800">
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-2">
                                    <Box className="w-3.5 h-3.5 text-gray-400" />
                                    {itemName}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1 mr-5">
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200">
                                      {item.catalog_item?.waste_no || '---'}
                                    </span>
                                    <span className="text-[10px] text-primary/70 font-medium">
                                      {item.catalog_item?.sub_category?.name || item.subcategory?.name || 'عام'}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-gray-400">
                                {basePrice.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-lg font-bold text-primary">{buyPrice.toLocaleString()}</span>
                                  <span className="text-[9px] font-bold text-gray-400">ج.م / كج</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center bg-blue-50/10">
                                <div className="flex flex-col items-center">
                                  <span className="text-base font-bold text-blue-700">{sellPrice ? sellPrice.toLocaleString() : '-'}</span>
                                  <span className="text-[9px] font-bold text-blue-400">ج.م / طن</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 {/* Market Indicator */}
                                 {(() => {
                                   const trend = trends.find(t => {
                                      const trendId = String(t.stock_exchange_id);
                                      const itemId = String(item.id);
                                      const matchById = trendId === itemId;
                                      
                                      const trendProductId = String(t.product_id);
                                      const itemProductId = String(item.product_id);
                                      const matchByProductId = trendProductId && itemProductId && 
                                                               trendProductId === itemProductId;
                                      
                                      return matchById || matchByProductId;
                                    });

                                    if (trend && trend.market_price) {
                                       return (
                                          <div className="flex flex-col items-center">
                                             <div className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-green-500" />
                                                <span className="text-sm font-bold text-gray-700">{Number(trend.market_price).toLocaleString()}</span>
                                             </div>
                                             <span className="text-[8px] text-gray-400">سعر البورصة اليوم</span>
                                          </div>
                                       );
                                    }
                                    return <span className="text-gray-300">---</span>;
                                 })()}
                              </TableCell>
                              <TableCell className="text-center">
                                {(() => {
                                    const trend = trends.find(t => {
                                      const trendId = String(t.stock_exchange_id);
                                      const itemId = String(item.id);
                                      const matchById = trendId === itemId;
                                      
                                      const trendProductId = String(t.product_id);
                                      const itemProductId = String(item.product_id);
                                      const matchByProductId = trendProductId && itemProductId && 
                                                               trendProductId === itemProductId;
                                      
                                      return matchById || matchByProductId;
                                    });
                                    
                                    // استخدام last_actual_purchase_price (آخر سعر تم الشراء به فعلياً) كسعر مرجعي
                                    // هذا يعطي نسبة تغير دقيقة للعميل مقارنة بآخر عملية شراء فعلية
                                    let price24hAgo = 0;
                                    
                                    if (trend && trend.price_24h_ago) {
                                        price24hAgo = Number(trend.price_24h_ago) || 0;
                                    }
                                    
                                    // إذا لم يكن هناك trend أو price_24h_ago = 0، نستخدم base_price كسعر مرجعي
                                    if (price24hAgo === 0 && basePrice > 0) {
                                        price24hAgo = basePrice;
                                    }
                                    
                                    // حساب نسبة التغير بين السعر الحالي والسعر المرجعي
                                    if (price24hAgo > 0) {
                                        const diff = buyPrice - price24hAgo;
                                        if (Math.abs(diff) < 0.01) {
                                            return <span className="text-gray-400 font-bold">0.0%</span>;
                                        }
                                        
                                        const percent = (diff / price24hAgo) * 100;
                                        
                                        return (
                                            <span className={`text-xs font-bold ${percent > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                                            </span>
                                        );
                                    }
                                    
                                    // إذا لم يكن هناك trend، نستخدم price_change_percentage من البيانات
                                    if (item.price_change_percentage !== undefined && item.price_change_percentage !== null) {
                                        const percent = Number(item.price_change_percentage);
                                        if (Math.abs(percent) < 0.01) {
                                            return <span className="text-gray-400 font-bold">0.0%</span>;
                                        }
                                        
                                        return (
                                         <span className={`text-xs font-bold ${percent > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                             {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                                         </span>
                                        );
                                    }
                                    
                                    return <span className="text-gray-400 font-bold">0.0%</span>;
                                })()}
                              </TableCell>
                              <TableCell className="text-center text-xs text-gray-400">
                                  {item.last_update ? format(new Date(item.last_update), 'MMM d, p', { locale: ar }) : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-sm"
                                  onClick={() => openCalculator(item)}
                                >
                                  <Calculator className="w-3.5 h-3.5" /> 
                                  <span className="text-xs font-bold">تسعير ذكي</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market_orders">
             <Card>
                 <CardHeader>
                     <CardTitle>أحدث طلبات السوق (Live Demand)</CardTitle>
                     <CardDescription>
                         الطلبات الواردة من الشركاء الصناعيين والتي تؤثر على تسعير المواد.
                     </CardDescription>
                 </CardHeader>
                 <CardContent>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>المادة المطلوبة</TableHead>
                                 <TableHead>سعر السوق (المعروض)</TableHead>
                                 <TableHead>الكمية المطلوبة</TableHead>
                                 <TableHead>الشريك</TableHead>
                                 <TableHead>الحالة</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {orders.flatMap(o => o.items?.map(i => ({...i, partner: o.partner, status: o.status, order_id: o.id})) || [])
                             .map((item, idx) => (
                                 <TableRow key={`${item.order_id}-${idx}`}>
                                     <TableCell className="font-bold">{item.product_name}</TableCell>
                                     <TableCell>
                                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {Number(item.agreed_price).toLocaleString()} ج.م
                                         </Badge>
                                     </TableCell>
                                     <TableCell>{item.quantity} {item.unit}</TableCell>
                                     <TableCell>{item.partner?.name}</TableCell>
                                     <TableCell>{item.status === 'pending' ? 'جديد' : item.status}</TableCell>
                                 </TableRow>
                             ))}
                             {orders.length === 0 && (
                                 <TableRow>
                                     <TableCell colSpan={5} className="text-center py-8 text-gray-400">لا توجد طلبات نشطة حالياً</TableCell>
                                 </TableRow>
                             )}
                         </TableBody>
                     </Table>
                 </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="stats">
            {/* Same Stats Content */}
             <Card className="mb-6 border-none shadow-sm">
            <CardHeader>
              <CardTitle>نظرة عامة على البورصة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <CardDescription className="text-green-700 mb-1">أعلى سعر شراء اليوم</CardDescription>
                      <CardTitle className="text-3xl font-bold text-green-800">
                        {prices.length > 0 ? Math.max(...prices.map(p => p.buy_price)).toFixed(2) : '0.00'} <span className="text-sm font-normal text-green-600">جنيه</span>
                      </CardTitle>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <CardDescription className="text-red-700 mb-1">أدنى سعر شراء اليوم</CardDescription>
                      <CardTitle className="text-3xl font-bold text-red-800">
                        {prices.length > 0 ? Math.min(...prices.map(p => p.buy_price)).toFixed(2) : '0.00'} <span className="text-sm font-normal text-red-600">جنيه</span>
                      </CardTitle>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <ArrowDown className="text-red-600" size={24} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExchangeDashboardPage;


