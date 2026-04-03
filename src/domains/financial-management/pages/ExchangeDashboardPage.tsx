import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPrices, updateExchangeProduct } from '@/domains/waste-management/store/exchangeSlice';
import { fetchOrders } from '@/domains/waste-management/partners/store/industrialPartnersSlice';
import { StockExchange, exchangeService } from '@/domains/waste-management/services/exchangeService';
import { PartnerOrder } from '@/domains/waste-management/partners/types';
import { wasteCatalogService } from '@/services/wasteCatalogService';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { productService } from '@/domains/product-categories/services/productService';
import { subcategoryExchangePriceService } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { PriceSparkline } from '@/domains/waste-management/components/PriceSparkline';
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
import { ArrowUp, ArrowDown, RefreshCw, Edit, Save, X, TrendingUp, AlertTriangle, Calculator, Briefcase, ChevronDown, ChevronRight, Box, Filter, Search, Layers, Tag, BarChart3, Plus, MessageSquare, Phone, User, Smartphone, Building2, Truck, FileText, Calendar, ArrowUpRight, ArrowDownRight, PieChart, Activity, Eye, EyeOff } from 'lucide-react';
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
import { LivePriceTable } from '@/domains/waste-management/components/LivePriceTable';
import { PriceTicker } from '@/domains/waste-management/components/PriceTicker';
import { QuickBidDialog } from '@/domains/waste-management/components/QuickBidDialog';
import { marketBidService } from '@/domains/waste-management/services/marketBidService';
import { MarketBid } from '@/domains/waste-management/partners/market-bids.types';
import { contractService } from '@/domains/waste-management/partners/services/contractService';
import { operationalCostService } from '@/domains/waste-management/partners/services/operationalCostService';
import { industrialPartnersService } from '@/domains/waste-management/partners/services/industrialPartnersService';
import Link from 'next/link';

const ExchangeDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { prices, loading, error } = useAppSelector((state) => state.exchange);
  const { currentAdmin } = useAppSelector((state) => state.auth);
  const { orders } = useAppSelector((state) => state.industrialPartners); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false); // تم تعيينها false لإظهار الجدول العادي
  
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
    marketAverage: 0,
    isMarketOrder: false,
    // New fields for weighted average logic
    weightedAvgSellPrice: 0,
    operationalCost: 0,
    totalQuantity: 0,
    activeContractsCount: 0,
    priceExpiresAt: null as string | null
  });
  
  const [trends, setTrends] = useState<any[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedMainCat, setSelectedMainCat] = useState<string>('all');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('all');
  
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [subcategoryPrices, setSubcategoryPrices] = useState<any[]>([]);
  const [subcategoryTrends, setSubcategoryTrends] = useState<any[]>([]);
  const [subSparklines, setSubSparklines] = useState<Record<number, number[]>>({});
  const [prodSparklines, setProdSparklines] = useState<Record<number, number[]>>({});
  // خريطة product_id → { mainId, subId, mainCatName, subCatName }
  const [productCategoryMap, setProductCategoryMap] = useState<Map<string, { mainId: any; subId: any; mainCatName: string; subCatName: string }>>(new Map());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); 
  
  // Market Bids State
  // Market Bids State for Pricing Calculator Efficiency
  const [marketBids, setMarketBids] = useState<MarketBid[]>([]);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const categoryMaps = useMemo(() => {
    const mainMap = new Map<string, string>();
    const subMap = new Map<string, string>();
    const subToMainMap = new Map<string, string>();
    
    allCategories.forEach(c => mainMap.set(String(c.id), c.name));
    allSubCategories.forEach(s => {
      subMap.set(String(s.id), s.name);
      if (s.category_id) subToMainMap.set(String(s.id), String(s.category_id));
    });
    
    return { mainMap, subMap, subToMainMap };
  }, [allCategories, allSubCategories]);

  const mainCategories = useMemo(() => {
    return allCategories.map(c => c.name);
  }, [allCategories]);

  const subCategories = useMemo(() => {
    if (selectedMainCat === 'all') return allSubCategories.map(s => s.name);
    const mainId = allCategories.find(c => c.name === selectedMainCat)?.id;
    return allSubCategories.filter(s => String(s.category_id) === String(mainId)).map(s => s.name);
  }, [allCategories, allSubCategories, selectedMainCat]);

  const toggleCat = (catId: string) => {
    const newKeys = new Set(expandedCats);
    if (newKeys.has(catId)) newKeys.delete(catId);
    else newKeys.add(catId);
    setExpandedCats(newKeys);
  };

  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchPrices());
      dispatch(fetchOrders());
      
      const [catsRes, subsRes, products, subPrices, subTrends, subSparkMap, prodSparkMap] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getSubCategories(),
        productService.getProducts(),
        subcategoryExchangePriceService.getAllSubcategoryExchangePrices(),
        subcategoryExchangePriceService.getSubcategoryMarketTrends(),
        subcategoryExchangePriceService.getSubcategorySparklineData(10),
        exchangeService.getProductSparklineData(10)
      ]);
      
      const cats = catsRes.data || [];
      const subs = subsRes.data || [];
      
      if (cats.length > 0) setAllCategories(cats);
      if (subs.length > 0) setAllSubCategories(subs);
      if (subPrices) setSubcategoryPrices(subPrices);
      if (subTrends) setSubcategoryTrends(subTrends);
      
      const sSpark = subSparkMap as Record<number, number[]>;
      const pSpark = prodSparkMap as Record<number, number[]>;
      if (sSpark) setSubSparklines(sSpark);
      if (pSpark) setProdSparklines(pSpark);

      // بناء خريطة ربط product_id → { mainCatName, subCatName }
      // نفس المنطق المستخدم في PricingManagementPage
      const mainIdToName = new Map<string, string>(cats.map((c: any) => [String(c.id), c.name]));
      const subIdToName = new Map<string, string>();
      const subIdToMainId = new Map<string, string>();
      subs.forEach((sub: any) => {
        subIdToName.set(String(sub.id), sub.name);
        if (sub.category_id) subIdToMainId.set(String(sub.id), String(sub.category_id));
      });
      
      const pMap = new Map<string, { mainId: any; subId: any; mainCatName: string; subCatName: string }>();
      (products || []).forEach((p: any) => {
        const subId = p.subcategory_id != null ? String(p.subcategory_id) : undefined;
        const mainId = subId ? subIdToMainId.get(subId) : (p.waste_main_category_id ? String(p.waste_main_category_id) : undefined);
        const mainName = mainId ? mainIdToName.get(mainId) : undefined;
        const subName = subId ? subIdToName.get(subId) : undefined;
        
        pMap.set(String(p.id), {
          mainId: mainId,
          subId: subId,
          mainCatName: mainName || 'تصنيف عام',
          subCatName: subName || 'عام'
        });
      });
      setProductCategoryMap(pMap);
      
      console.log('📦 Product Category Map size:', pMap.size, 'Sample:', Array.from(pMap.entries()).slice(0, 3));

      const trendsData = await exchangeService.getMarketTrends();
      if (trendsData) {
        setTrends(trendsData);
      }
      
      loadMarketBids();
    };
    loadData();
  }, [dispatch]);

  const loadMarketBids = async () => {
    setLoadingBids(true);
    try {
      const [bids, contracts] = await Promise.all([
        marketBidService.getBids({ status: 'active' }),
        contractService.getContracts({ status: 'active' })
      ]);
      setMarketBids(bids);
      setActiveContracts(contracts);
    } catch (error) {
      console.error("Error loading market data:", error);
    } finally {
      setLoadingBids(false);
    }
  };

  // دالة لحساب الهامش بناءً على السعر
  const calculateMargin = (buyPrice: number, sellPrice: number) => {
    const margin = sellPrice - buyPrice;
    const marginPercent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
    return { margin, marginPercent };
  };

  const getMarketPrice = (productName: string, subcategoryId?: number) => {
    if (!productName && !subcategoryId) return 0;
    
    let pricesFromOrders: number[] = [];
    if (productName) {
        const normalizedProductName = productName.trim().toLowerCase();
        const relevantItems = orders.flatMap(o => o.items || []).filter(item => {
          const itemName = (item.product_name || '').trim().toLowerCase();
          return itemName && (itemName.includes(normalizedProductName) || normalizedProductName.includes(itemName));
        });
        pricesFromOrders = relevantItems.map(item => Number(item.agreed_price));
    }

    // جلب الأسعار من عروض المزاد الذكي
    const relevantBids = marketBids.filter(bid => 
      (subcategoryId && Number(bid.subcategory_id) === Number(subcategoryId)) ||
      (productName && bid.bidder_name?.toLowerCase().includes(productName.toLowerCase()))
    );
    const pricesFromBids = relevantBids.map(bid => Number(bid.bid_price));

    const allPrices = [...pricesFromOrders, ...pricesFromBids];
    if (allPrices.length === 0) return 0;

    // تفضيل السعر الأفضل (الأعلى) من المزاد الذكي إذا وجد، وإلا المتوسط من الطلبات
    const maxBid = pricesFromBids.length > 0 ? Math.max(...pricesFromBids) : 0;
    const avgOrder = pricesFromOrders.length > 0 ? pricesFromOrders.reduce((a, b) => a + b, 0) / pricesFromOrders.length : 0;

    return maxBid || avgOrder;
  };

  // -------------------------------------------------------------------------
  // Updated Calculator Logic: Weighted Average + Operational Costs
  // -------------------------------------------------------------------------
  
  const openCalculator = async (item: any, isSubcategory: boolean = false) => {
    // 1. Determine Subcategory ID
    let subcategoryId = isSubcategory ? item.subcategory_id : item.product?.subcategory_id;
    
    // Fallback: try to find subcategory_id from map if missing
    if (!subcategoryId && item.product_id && productCategoryMap.has(String(item.product_id))) {
      subcategoryId = Number(productCategoryMap.get(String(item.product_id))!.subId);
    }

    // 2. Default Values
    let weightedAvgSellPrice = 0;
    let operationalCost = 0;
    let totalQuantity = 0;
    let contractsCount = 0;
    let currentCostKg = item.buy_price || (isSubcategory ? 0 : item.base_price) || 0;

    // 3. Fetch Data if subcategory exists
    if (subcategoryId) {
        try {
            const [weightedData, opCost] = await Promise.all([
                contractService.getWeightedAverageForSubcategory(subcategoryId),
                operationalCostService.getEffectiveCost(subcategoryId)
            ]);
            
            if (weightedData.totalQuantity > 0) {
                weightedAvgSellPrice = weightedData.weightedAvgPrice;
                totalQuantity = weightedData.totalQuantity;
                contractsCount = weightedData.contractCount;
            }
            
            operationalCost = opCost; // Cost per ton
            
        } catch (err) {
            console.error("Error fetching calculator data:", err);
            toast.error("فشل في جلب بيانات العقود والتكاليف");
        }
    }

    // 4. Fallback to old logic (Market Bids / Orders) if no contracts
    const marketPrice = getMarketPrice(isSubcategory ? item.subcategory_name : (item.product?.name || ''), subcategoryId);
    const initialSellPriceTon = weightedAvgSellPrice > 0 ? weightedAvgSellPrice : (marketPrice > 0 ? marketPrice : currentCostKg * 1000 * 1.2);
    
    // 5. Calculate Default Buy Price (Cost)
    // Formula: Buy Price (Kg) = (Sell Price - Op Cost - Margin) / 1000
    // Default Margin: 15% (can be adjusted)
    const defaultMarginPercent = 15; 
    const marginAmount = (initialSellPriceTon * defaultMarginPercent) / 100;
    
    // If we have valid contract data, calculate suggested buy price
    let suggestedBuyPriceKg = 0;
    if (initialSellPriceTon > 0) {
        suggestedBuyPriceKg = (initialSellPriceTon - operationalCost - marginAmount) / 1000;
    } else {
        suggestedBuyPriceKg = currentCostKg; // Keep current if no data
    }
    
    // Ensure positive
    suggestedBuyPriceKg = Math.max(0, suggestedBuyPriceKg);

    const costTon = suggestedBuyPriceKg * 1000;
    const grossMargin = initialSellPriceTon - costTon - operationalCost;
    const realProfitAmount = grossMargin / 1000; // Profit per Kg

    setEditingItem({ ...item, isSubcategory });
    setCalculatorData({
      costPrice: parseFloat(suggestedBuyPriceKg.toFixed(2)),
      sellPrice: parseFloat(initialSellPriceTon.toFixed(2)),
      marginPercent: defaultMarginPercent,
      profitAmount: parseFloat(realProfitAmount.toFixed(2)),
      marketAverage: marketPrice, // Keep for reference
      isMarketOrder: !!item.isMarketOrder,
      weightedAvgSellPrice,
      operationalCost,
      totalQuantity,
      activeContractsCount: contractsCount,
      priceExpiresAt: item.price_expires_at || null
    });
    setIsCalculatorOpen(true);
  };

  const updateCalculator = (field: 'cost' | 'sell' | 'margin', value: number | string) => {
    // Handle empty input
    if (value === '') {
        setCalculatorData(prev => ({ 
            ...prev, 
            [field === 'cost' ? 'costPrice' : field === 'sell' ? 'sellPrice' : 'marginPercent']: 0 
        }));
        return;
    }

    const numValue = Number(value);
    let newData = { ...calculatorData };
    
    // Op Cost per Ton
    const opCost = newData.operationalCost || 0;

    if (field === 'sell') {
      newData.sellPrice = numValue;
      // Recalculate Buy Price: (Sell - OpCost - Margin) / 1000
      const marginAmount = (numValue * newData.marginPercent) / 100;
      newData.costPrice = (numValue - opCost - marginAmount) / 1000;
    
    } else if (field === 'margin') {
      newData.marginPercent = numValue;
      // Recalculate Buy Price
      const marginAmount = (newData.sellPrice * numValue) / 100;
      newData.costPrice = (newData.sellPrice - opCost - marginAmount) / 1000;
    
    } else if (field === 'cost') {
      newData.costPrice = numValue;
      // Recalculate Margin %
      // BuyPrice * 1000 = Sell - OpCost - MarginAmount
      // MarginAmount = Sell - OpCost - (Buy * 1000)
      const costTon = numValue * 1000;
      const marginAmount = newData.sellPrice - opCost - costTon;
      newData.marginPercent = newData.sellPrice > 0 ? (marginAmount / newData.sellPrice) * 100 : 0;
    }

    // Profit per Kg = (Sell - OpCost - Buy*1000) / 1000
    const totalCostTon = (newData.costPrice * 1000) + opCost;
    const grossProfitTon = newData.sellPrice - totalCostTon;
    
    newData.profitAmount = grossProfitTon / 1000;
    
    // Formatting fixed for display stability
    newData.costPrice = parseFloat(newData.costPrice.toFixed(2)); 
    newData.sellPrice = parseFloat(newData.sellPrice.toFixed(2));
    newData.marginPercent = parseFloat(newData.marginPercent.toFixed(2)); // More precision
    newData.profitAmount = parseFloat(newData.profitAmount.toFixed(2));

    setCalculatorData(newData);
  };

  const saveFromCalculator = async () => {
    if (!editingItem) return;
    const isSub = (editingItem as any).isSubcategory;
    const oldBuyPrice = editingItem.buy_price || 0;
    const oldSellPrice = editingItem.sell_price || 0;
    setIsCalculatorOpen(false);

    try {
      if (isSub) {
        // تحديث سعر الفئة الفرعية
        await subcategoryExchangePriceService.setSubcategoryExchangePrice(
          Number((editingItem as any).subcategory_id),
          calculatorData.costPrice,
          calculatorData.sellPrice,
          currentAdmin?.user_id || undefined, // userId
          calculatorData.priceExpiresAt || undefined
        );
      } else {
        // تحديث سعر المنتج الفردي
        await dispatch(updateExchangeProduct({
          id: editingItem.id,
          product: {
            buy_price: calculatorData.costPrice,
            auto_update_enabled: false
          },
          userId: currentAdmin?.user_id || undefined
        })).unwrap();

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
          changed_by: currentAdmin?.user_id || undefined
        });
      }
      
      toast.success("تم تحديث السعر وتوثيقه بنجاح");
    
    // 🔄 إعادة جلب كل البيانات لضمان تحديث المؤشرات فوراً
    const [freshPrices, freshSubPrices, freshSubTrends] = await Promise.all([
      dispatch(fetchPrices()).unwrap(),
      subcategoryExchangePriceService.getAllSubcategoryExchangePrices(),
      subcategoryExchangePriceService.getSubcategoryMarketTrends()
    ]);
    
    setSubcategoryPrices(freshSubPrices);
    setSubcategoryTrends(freshSubTrends);
    setEditingItem(null);
    } catch (error) {
       toast.error("فشل في تحديث السعر");
    }
  };

  const toggleSubcategoryTicker = async (subId: number, currentVal: boolean) => {
    const newVal = !currentVal;
    const ok = await subcategoryExchangePriceService.toggleShowOnTicker(subId, newVal);
    if (ok) {
      toast.success(newVal ? 'ستظهر الفئة في شريط الأسعار' : 'تم إخفاء الفئة من شريط الأسعار');
      // تحديث البيانات محلياً
      const freshSubPrices = await subcategoryExchangePriceService.getAllSubcategoryExchangePrices();
      setSubcategoryPrices(freshSubPrices);
    }
  };

  const toggleProductTicker = async (stockExchangeId: number, currentVal: boolean) => {
    const newVal = !currentVal;
    const ok = await exchangeService.toggleProductShowOnTicker(stockExchangeId, newVal);
    if (ok) {
      toast.success(newVal ? 'ستظهر المادة في شريط الأسعار' : 'تم إخفاء المادة من شريط الأسعار');
      dispatch(fetchPrices());
    }
  };

  const filteredExchangeData = useMemo(() => {
    return prices.filter((item) => {
      const itemName = item.catalog_item?.name || item.product?.name || item.product_id;
      const wasteNo = item.catalog_item?.waste_no || '';
      
      // Resolve categories consistently using the mapping
      let mainCat = 'تصنيف عام';
      let subCat = 'عام';
      
      const productId = item.product_id;
      if (productId && productCategoryMap.has(String(productId))) {
        const catInfo = productCategoryMap.get(String(productId))!;
        mainCat = catInfo.mainCatName;
        subCat = catInfo.subCatName;
      } else {
        // Fallback for items not in products map
        mainCat = (item.catalog_item?.main_category as any)?.name || item.category?.name || 'تصنيف عام';
        subCat = item.catalog_item?.sub_category?.name || item.subcategory?.name || 'عام';
      }
      
      const matchesSearch = itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           wasteNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMain = selectedMainCat === 'all' || mainCat === selectedMainCat;
      const matchesSub = selectedSubCat === 'all' || subCat === selectedSubCat;
      
      return matchesSearch && matchesMain && matchesSub;
    });
  }, [prices, searchTerm, selectedMainCat, selectedSubCat, productCategoryMap]);

  const treeData = useMemo(() => {
    const nestedGroups: Record<string, Record<string, any[]>> = {};
    
    filteredExchangeData.forEach(item => {
      let mainCatName = 'تصنيف عام';
      let subCatName = 'عام';
      
      // Resolve categories consistently using the same logic as filtering
      const productId = item.product_id;
      if (productId && productCategoryMap.has(String(productId))) {
        const catInfo = productCategoryMap.get(String(productId))!;
        mainCatName = catInfo.mainCatName;
        subCatName = catInfo.subCatName;
      } else {
        // Fallback for items not in products map
        mainCatName = (item.catalog_item?.main_category as any)?.name || item.category?.name || 'تصنيف عام';
        subCatName = item.catalog_item?.sub_category?.name || item.subcategory?.name || 'عام';
      }
      
      if (!nestedGroups[mainCatName]) nestedGroups[mainCatName] = {};
      if (!nestedGroups[mainCatName][subCatName]) nestedGroups[mainCatName][subCatName] = [];
      nestedGroups[mainCatName][subCatName].push(item);
    });
    
    console.log('🔍 Tree Data Structure:', Object.keys(nestedGroups));
    return nestedGroups;
  }, [filteredExchangeData, productCategoryMap]);

  const performanceStats = useMemo(() => {
    const totalItems = prices.length;
    const itemsWithProfit = prices.filter(p => (p.sell_price || 0) > (p.buy_price || 0) * 1000).length;
    const validPrices = prices.filter(p => (p.sell_price || 0) > 0);
    const avgMargin = validPrices.reduce((acc, p) => {
        const buyTon = (p.buy_price || 0) * 1000;
        const sell = p.sell_price || 0;
        return acc + ((sell - buyTon) / sell) * 100;
    }, 0) / (validPrices.length || 1);

    const highMovementItems = trends.filter(t => Math.abs(Number(t.price_change_percent)) > 5).length;

    return {
      totalItems,
      itemsWithProfit,
      avgMargin: isFinite(avgMargin) ? parseFloat(avgMargin.toFixed(1)) : 0,
      highMovementItems,
      activeContractsCount: activeContracts.length,
      activeBidsCount: marketBids.length,
      totalOrders: orders.length
    };
  }, [prices, trends, activeContracts, marketBids, orders]);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 min-h-screen">
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-[650px] bg-white p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl border-0">
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-gray-900">حاسبة التسعير الذكية</DialogTitle>
                  {calculatorData.isMarketOrder && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] py-0 h-5 font-bold">مرجع: طلب توريد</Badge>
                  )}
                </div>
                <DialogDescription className="text-sm text-gray-600 font-medium">نظام الربحية المتغير بناءً على معطيات السوق الحية</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white space-y-5">
            <div className="bg-white p-5 rounded-xl border-2 border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-blue-600"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-base font-black text-gray-800 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                      سعر البيع المرجّح / طن
                      {calculatorData.activeContractsCount > 0 && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] h-5">
                            متوسط {calculatorData.activeContractsCount} عقود ({calculatorData.totalQuantity} طن)
                        </Badge>
                      )}
                      {!calculatorData.activeContractsCount && calculatorData.marketAverage > 0 && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[9px] h-5">
                            سعر السوق التقديري
                        </Badge>
                      )}
                    </Label>
                    <p className="text-xs text-gray-500 font-medium pr-8">
                      {calculatorData.activeContractsCount > 0 
                        ? 'يتم حسابه تلقائياً بناءً على متوسط العقود النشطة المرجّح بالكميات'
                        : 'متوسط أسعار السوق وطلبات العملاء الحالية'}
                    </p>
                  </div>
                  {calculatorData.marketAverage > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold shadow-sm">
                        مباشر: {calculatorData.marketAverage.toLocaleString()} ج.م
                      </Badge>
                      {Math.abs(calculatorData.marketAverage - calculatorData.sellPrice) > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[10px] h-6 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-0"
                          onClick={() => updateCalculator('sell', calculatorData.marketAverage)}
                        >
                          تطبيق السعر المباشر
                        </Button>
                      )}
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-3">
                  <Input 
                    type="number" 
                    value={calculatorData.sellPrice} 
                    onChange={(e) => updateCalculator('sell', parseFloat(e.target.value) || 0)} 
                    className="text-xl font-bold h-14 border-2 border-gray-200 focus:border-blue-500 shadow-sm rounded-lg transition-all" 
                  />
                  <span className="text-sm font-bold text-gray-600 bg-gradient-to-br from-gray-100 to-gray-50 px-4 py-4 rounded-lg border-2 border-gray-200 min-w-[90px] text-center shadow-sm">ج.م / طن</span>
               </div>
            </div>

            {/* عرض التكاليف التشغيلية إن وجدت */}
            {calculatorData.operationalCost > 0 && (
                <div className="mb-4 pr-8 flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 w-fit">
                    <Truck size={12} />
                    <span>خصم تكاليف تشغيلية: </span>
                    <span className="font-bold">{calculatorData.operationalCost.toLocaleString()} ج.م/طن</span>
                </div>
            )}

            <div className="bg-white p-5 rounded-xl border-2 border-dashed border-gray-200 mb-4 hover:border-blue-400 transition-all">
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-black text-gray-700 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" />
                        تاريخ انتهاء صلاحية السعر
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">اختياري</Badge>
                </div>
                <Input 
                    type="date" 
                    value={calculatorData.priceExpiresAt || ''} 
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, priceExpiresAt: e.target.value }))}
                    className="h-10 font-bold border-gray-100 bg-gray-50/50"
                />
                <p className="text-[10px] mt-2 text-gray-400 font-medium">* سيظهر تنبيه للمناديب عند اقتراب انتهاء هذه الصلاحية لضمان تحديث السعر.</p>
            </div>

            <div className="flex justify-between items-center bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
               <Label className="text-base font-black text-gray-800 flex items-center gap-2">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">2</span>
                 هامش الربح المستهدف
               </Label>
               <div className="flex items-center gap-4">
                 <Input 
                   type="number" 
                   value={calculatorData.marginPercent} 
                   onChange={(e) => updateCalculator('margin', parseFloat(e.target.value) || 0)} 
                   className="w-24 font-bold h-11 text-center text-lg border-2 rounded-lg" 
                 />
                 <span className="font-black text-gray-500 text-lg">%</span>
                 <div className="flex gap-2">
                   {[10, 15, 20, 25].map(m => (
                     <Button 
                       key={m} 
                       variant={calculatorData.marginPercent === m ? "default" : "outline"} 
                       size="sm" 
                       onClick={() => updateCalculator('margin', m)}
                       className={calculatorData.marginPercent === m ? "shadow-md" : "hover:border-primary"}
                     >
                       {m}%
                     </Button>
                   ))}
                 </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 p-6 rounded-xl shadow-xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-sm font-bold">3</span>
                        <h3 className="text-lg font-black">سعر الشراء (للكيلو)</h3>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium pr-9">هذا السعر سيتم تعميمه فوراً لجميع مندوبينا</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-2">
                          <Input 
                            type="number" 
                            value={calculatorData.costPrice} 
                            onChange={(e) => updateCalculator('cost', parseFloat(e.target.value) || 0)} 
                            className="w-36 text-3xl font-black bg-white/10 border-0 border-b-2 border-white/40 text-white text-right px-0 h-12 focus-visible:ring-0 focus:border-white/60 transition-all" 
                          />
                          <span className="text-xl font-bold text-emerald-50">ج.م</span>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
          <DialogFooter className="p-5 bg-gray-50 border-t border-gray-200 gap-3">
            <Button variant="outline" onClick={() => setIsCalculatorOpen(false)} className="font-bold">إلغاء</Button>
            <Button onClick={saveFromCalculator} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold shadow-md">
              <Save className="w-4 h-4 mr-2" />
              تحديث السعر وحفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">لوحة تحكم البورصة</h1>
          <p className="text-gray-600 font-medium">إدارة ذكية لأسعار المواد بنظام الشجرة والفلترة المتطورة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="بحث في المادة أو الكود..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pr-10 bg-white border-2 border-gray-200 focus:border-primary h-11 font-medium" 
            />
          </div>
          <Select value={selectedMainCat} onValueChange={setSelectedMainCat}>
            <SelectTrigger className="w-[170px] bg-white border-2 border-gray-200 h-11 font-semibold">
              <SelectValue placeholder="الفئة الرئيسية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">كل الفئات</SelectItem>
              {mainCategories.map(cat => <SelectItem key={cat} value={cat} className="font-medium">{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubCat} onValueChange={setSelectedSubCat}>
            <SelectTrigger className="w-[170px] bg-white border-2 border-gray-200 h-11 font-semibold">
              <SelectValue placeholder="الفئة الفرعية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">كل الفرعية</SelectItem>
              {subCategories.map(sub => <SelectItem key={sub} value={sub} className="font-medium">{sub}</SelectItem>)}
            </SelectContent>
          </Select>
          <Link href="/financial-management/exchange/analytics">
            <Button variant="outline" className="gap-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50">
              <BarChart3 size={18} />
              <span>إحصائيات السوق</span>
            </Button>
          </Link>
          
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="gap-2 px-3"
            >
              <Layers size={14} />
              ترتيب حسب الفئة
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className="gap-2 px-3"
            >
              <Tag size={14} />
              كل المواد
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="bg-white border-2 border-gray-200 mb-6 p-1.5 rounded-xl shadow-sm">
          <TabsTrigger value="prices" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-white">تسعير المواد</TabsTrigger>
          <TabsTrigger value="stats" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-white">الأداء العام</TabsTrigger>
        </TabsList>
        <PriceTicker className="mb-4" />
        <TabsContent value="prices">
          <Card className="border-2 border-gray-200 shadow-md bg-white overflow-hidden rounded-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-900">بوابة الأسعار</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant={isLiveMode ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setIsLiveMode(!isLiveMode)}
                    className="font-bold"
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${isLiveMode ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                    تحديث لحظي
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => dispatch(fetchPrices())} className="font-bold">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    مزامنة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLiveMode ? (
                <LivePriceTable searchTerm={searchTerm} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                      <TableRow>
                        <TableHead className="w-[80px] text-center font-black text-gray-700">الكود</TableHead>
                        <TableHead className="text-right font-black text-gray-700">المادة والنوع</TableHead>
                        <TableHead className="text-center font-black text-gray-700">الأساسي</TableHead>
                        <TableHead className="text-center font-black text-primary">سعر الشراء (كجم)</TableHead>
                        <TableHead className="text-center font-black text-blue-600">سعر البيع (طن)</TableHead>
                        <TableHead className="text-center font-black text-gray-700">المؤشر</TableHead>
                        <TableHead className="text-center font-black text-gray-700">التغير اليومي</TableHead>
                        <TableHead className="text-center font-black text-gray-700">آخر تحديث</TableHead>
                        <TableHead className="text-center font-black text-gray-700">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(treeData).map(([mainName, subGroups]) => {
                        const isMainExpanded = expandedCats.has(mainName);
                        const totalItems = Object.values(subGroups).reduce((acc, items) => acc + items.length, 0);
                        
                        return (
                          <React.Fragment key={mainName}>
                            {/* Main Category Row */}
                            <TableRow 
                              className="bg-gradient-to-r from-slate-100 to-slate-50 cursor-pointer border-r-4 border-r-primary group hover:from-slate-200 hover:to-slate-100 transition-all font-bold shadow-sm" 
                              onClick={() => toggleCat(mainName)}
                            >
                              <TableCell className="text-center py-4">
                                {isMainExpanded ? (
                                  <ChevronDown className="w-5 h-5 mx-auto text-primary transition-transform" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 mx-auto text-gray-500 transition-transform" />
                                )}
                              </TableCell>
                              <TableCell colSpan={2} className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-sm">
                                    <Layers className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-primary/70 font-black uppercase tracking-wide">الفئة الرئيسية</span>
                                    <div className="text-lg font-black text-gray-900 leading-tight">{mainName}</div>
                                  </div>
                                  <div className="flex gap-2 mr-auto">
                                    <Badge variant="secondary" className="bg-white border-2 border-primary/30 text-primary font-bold shadow-sm">
                                      {totalItems} منتج
                                    </Badge>
                                    {(() => {
                                      const mainId = allCategories.find(ac => ac.name === mainName)?.id;
                                      const catContracts = activeContracts.filter(c => {
                                        const subId = String(c.subcategory_id);
                                        return allSubCategories.some(s => String(s.id) === subId && String(s.category_id) === String(mainId));
                                      });
                                      if (catContracts.length > 0) {
                                        return (
                                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-black">
                                            🛡️ {catContracts.length} عقود نشطة
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell colSpan={6}></TableCell>
                            </TableRow>
                            
                                    {isMainExpanded && Object.entries(subGroups).map(([subName, items], index) => {
                                      const subKey = `${mainName}:${subName}`;
                                      const isSubExpanded = expandedCats.has(subKey);
                                      
                                      // محاولة العثور على ID الفئة الفرعية بدقة
                                      // 1. من خلال خريطة المنتجات (الأدق)
                                      let subId = null;
                                      const firstProduct = items.find(i => i.product_id);
                                      if (firstProduct && productCategoryMap.has(String(firstProduct.product_id))) {
                                        subId = productCategoryMap.get(String(firstProduct.product_id))?.subId;
                                      }
                                      
                                      // 2. إذا فشل، نحاول من خلال items مباشرة
                                      if (!subId) {
                                        subId = items.find(i => i.subcategory_id)?.subcategory_id;
                                      }
                                      
                                      // 3. إذا فشل، نبحث بالاسم مع تنظيف النصوص
                                      if (!subId) {
                                        const cleanName = subName?.trim();
                                        const subObj = allSubCategories.find(s => s.name?.trim() === cleanName);
                                        if (subObj) subId = subObj.id;
                                      }

                                      const subPriceData = subId ? subcategoryPrices.find(p => p.subcategory_id === Number(subId)) : null;
                                      const validSubId = Number(subId);
                                      
                                      return (
                                        <React.Fragment key={subKey}>
                                          {/* Sub Category Row */}
                                          <TableRow 
                                            className="bg-gradient-to-r from-sky-50/60 to-blue-50/40 cursor-pointer border-r-4 border-r-sky-400 hover:from-sky-100/80 hover:to-blue-100/60 transition-all font-bold" 
                                          >
                                            <TableCell className="text-center py-3 pr-4" onClick={() => toggleCat(subKey)}>
                                              <div className="flex items-center justify-center">
                                                {isSubExpanded ? (
                                                  <ChevronDown className="w-4 h-4 text-sky-600" />
                                                ) : (
                                                  <ChevronRight className="w-4 h-4 text-sky-500" />
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-3 pr-8" onClick={() => toggleCat(subKey)}>
                                              <div className="flex items-center gap-2.5 text-sky-700">
                                                <div className="p-1.5 bg-sky-100 rounded-lg">
                                                  <Tag className="w-4 h-4 text-sky-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[9px] text-sky-600/80 font-black uppercase tracking-wide">الفئة الفرعية</span>
                                                  <div className="text-sm font-black text-sky-800">{subName}</div>
                                                </div>
                                                {(() => {
                                                  const subContract = activeContracts.find(c => String(c.subcategory_id) === String(validSubId));
                                                  const bestBid = marketBids
                                                    .filter(b => String(b.subcategory_id) === String(validSubId))
                                                    .sort((a, b) => Number(b.bid_price) - Number(a.bid_price))[0];

                                                  return (
                                                    <div className="flex gap-2 mr-auto">
                                                      <Badge variant="outline" className="text-[10px] h-5 bg-white/70 border-sky-200 text-sky-700 font-bold">
                                                        {items.length} مواد
                                                      </Badge>
                                                      {subContract && (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black h-5">
                                                          🛡️ عقد: {Number(subContract.agreed_price).toLocaleString()}
                                                        </Badge>
                                                      )}
                                                      {bestBid && (
                                                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-black h-5 animate-pulse">
                                                          ⚡ عرض: {Number(bestBid.bid_price).toLocaleString()}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-gray-400">--</TableCell>
                                            {/* أسعار الفئة الفرعية */}
                                            <TableCell className="text-center font-black text-primary text-base">
                                              {subPriceData?.buy_price ? `${subPriceData.buy_price.toFixed(2)}` : '0.00'}
                                            </TableCell>
                                            <TableCell className="text-center font-black text-blue-600 text-base">
                                              <div className="flex flex-col items-center gap-1">
                                                <span>{subPriceData?.sell_price ? `${subPriceData.sell_price.toFixed(0)}` : '-'}</span>
                                                <div className="text-[10px] font-medium text-blue-400/80">ج.م / طن</div>
                                                {marketBids.some(b => Number(b.subcategory_id) === Number(validSubId)) && (
                                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[8px] h-4 font-black">
                                                    عرض مباشر نشط
                                                  </Badge>
                                                )}
                                              </div>
                                            </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const sId = Number(validSubId);
                              if (!sId) return <span className="text-gray-300">-</span>;
                              
                              const trend = subcategoryTrends.find(t => Number(t.subcategory_id) === sId);
                              if (!trend || !trend.old_buy_price) return <span className="text-gray-300">-</span>;
                              
                              const currentBuyPrice = Number(subPriceData?.buy_price) || 0;
                              const oldBuyPrice = Number(trend.old_buy_price) || 0;
                              const change = currentBuyPrice - oldBuyPrice;
                              const percent = oldBuyPrice > 0 ? (change / oldBuyPrice) * 100 : 0;
                              
                              if (Math.abs(change) < 0.001) return <span className="text-gray-300">-</span>;
                              
                              return (
                                <div className="flex items-center justify-center gap-3">
                                  <div className="flex-shrink-0 w-12 opacity-60">
                                    <PriceSparkline data={subSparklines[sId] || [oldBuyPrice, currentBuyPrice]} width={48} height={20} />
                                  </div>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${change > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {change > 0 ? <TrendingUp size={16} /> : <ArrowDown size={16} />}
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const sId = Number(validSubId);
                              if (!sId) return <Badge variant="outline" className="text-[11px] font-black bg-white/80 text-gray-400 border-gray-100">0.0%</Badge>;
                              
                              const trend = subcategoryTrends.find(t => Number(t.subcategory_id) === sId);
                              if (!trend || !trend.old_buy_price) return <Badge variant="outline" className="text-[11px] font-black bg-white/80 text-gray-400 border-gray-100">0.0%</Badge>;
                              
                              const currentBuyPrice = Number(subPriceData?.buy_price) || 0;
                              const oldBuyPrice = Number(trend.old_buy_price) || 0;
                              const change = currentBuyPrice - oldBuyPrice;
                              const percent = oldBuyPrice > 0 ? (change / oldBuyPrice) * 100 : 0;
                              
                              if (Math.abs(change) < 0.001) return <Badge variant="outline" className="text-[11px] font-black bg-white/80 text-gray-400 border-gray-100">0.0%</Badge>;
                              
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[11px] font-black shadow-sm ${
                                    change > 0 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-rose-50 text-rose-600 border-rose-200'
                                  }`}
                                >
                                  {change > 0 ? '+' : ''}{percent.toFixed(1)}%
                                </Badge>
                              );
                            })()}
                          </TableCell>
                                            <TableCell className="text-center text-[10px] font-bold text-gray-400">
                                              {subPriceData?.last_update ? format(new Date(subPriceData.last_update), 'HH:mm dd MMM', { locale: undefined }) : '--'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className={`h-8 w-8 p-0 hover:bg-white rounded-lg transition-all border border-transparent ${subPriceData?.show_on_ticker !== false ? "text-emerald-600" : "text-gray-300"}`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (validSubId) toggleSubcategoryTicker(validSubId, subPriceData?.show_on_ticker !== false);
                                                  }}
                                                >
                                                  {subPriceData?.show_on_ticker !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </Button>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!validSubId) {
                                                      console.warn('Cannot open calculator: Invalid subcategory ID for', subName);
                                                      toast.error(`خطأ: لا يمكن العثور على معرف الفئة "${subName}"`);
                                                      return;
                                                    }
                                                    openCalculator(
                                                      subPriceData || { 
                                                        subcategory_id: validSubId, 
                                                        subcategory_name: subName 
                                                      }, 
                                                      true
                                                    ); 
                                                  }}
                                                  className="h-8 w-8 p-0 hover:bg-white hover:text-primary hover:shadow-md rounded-lg transition-all border border-transparent hover:border-primary/20"
                                                >
                                                  <Calculator className={`w-4 h-4 ${!validSubId ? 'text-red-400' : 'text-gray-600'}`} />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>

                                  {/* Products Rows */}
                                  {isSubExpanded && items.map((item, index) => {
                                    const itemName = item.catalog_item?.name || item.product?.name || item.product_id;
                                    const buyPrice = item.buy_price || 0;
                                    const sellPrice = item.sell_price || 0;
                                    const basePrice = item.base_price || 0;
                                    
                                    return (
                                      <TableRow 
                                        key={`${item.id}-${index}`} 
                                        className="hover:bg-blue-50/30 transition-all bg-white border-b border-gray-100"
                                      >
                                        <TableCell className="text-center text-gray-400 font-mono text-[10px] font-bold">
                                          {item.catalog_item?.waste_no || '--'}
                                        </TableCell>
                                        <TableCell className="font-bold pr-16 text-gray-800">
                                          <div className="flex items-center gap-2">
                                            <Box className="w-4 h-4 text-gray-400" />
                                            <span>{itemName}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600 font-semibold">
                                          {basePrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-xl font-black text-primary">
                                              {buyPrice.toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                              ج.م / كج
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-lg font-black text-blue-700">
                                              {sellPrice ? sellPrice.toLocaleString() : '-'}
                                            </span>
                                            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                                              ج.م / طن
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                           {(() => {
                                              const trend = trends.find(t => String(t.stock_exchange_id) === String(item.id) || (t.product_id && String(t.product_id) === String(item.product_id)));
                                              if (trend?.market_price) {
                                                return (
                                                  <div className="flex items-center justify-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg inline-flex">
                                                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                                    <span className="text-sm font-bold text-green-700">
                                                      {Number(trend.market_price).toLocaleString()}
                                                    </span>
                                                  </div>
                                                );
                                              }
                                              return <span className="text-gray-300 font-semibold">---</span>;
                                           })()}
                                        </TableCell>
                                          <TableCell className="text-center">
                                            {(() => {
                                                const trend = trends.find(t => String(t.stock_exchange_id) === String(item.id) || (t.product_id && String(t.product_id) === String(item.product_id)));
                                                let price24hAgo = trend?.price_24h_ago ? Number(trend.price_24h_ago) : basePrice;
                                                const spark = prodSparklines[Number(item.id)] || [price24hAgo || buyPrice, buyPrice];

                                                return (
                                                  <div className="flex items-center justify-center gap-2">
                                                    <div className="w-10 opacity-60">
                                                      <PriceSparkline data={spark} width={40} height={18} />
                                                    </div>
                                                    {price24hAgo > 0 && (
                                                      <Badge 
                                                        variant="outline"
                                                        className={`font-bold ${
                                                          buyPrice > price24hAgo 
                                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                                            : buyPrice < price24hAgo 
                                                            ? 'bg-red-50 text-red-600 border-red-200' 
                                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}
                                                      >
                                                        {buyPrice > price24hAgo ? '+' : ''}{((buyPrice - price24hAgo) / price24hAgo * 100).toFixed(1)}%
                                                      </Badge>
                                                    )}
                                                  </div>
                                                );
                                            })()}
                                          </TableCell>
                                        <TableCell className="text-center text-[10px] text-gray-500 font-medium">
                                          {item.last_update ? format(new Date(item.last_update), 'MMM d, HH:mm', { locale: ar }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className={`p-1.5 h-8 w-8 hover:bg-primary/10 transition-all rounded-lg ${item.show_on_ticker !== false ? "text-blue-600" : "text-gray-300"}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleProductTicker(Number(item.id), item.show_on_ticker !== false);
                                              }}
                                            >
                                              {item.show_on_ticker !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="hover:bg-primary/10 hover:text-primary transition-all p-1.5 h-8 w-8 rounded-lg" 
                                              onClick={() => openCalculator(item)}
                                            >
                                              <Calculator className="w-4 h-4 text-gray-600" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stats">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-r-4 border-r-blue-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">إحصائيات العقود</p>
                      <div className="text-3xl font-black text-slate-900">{performanceStats.activeContractsCount}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">اتفاقيات نشطة</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-r-4 border-r-emerald-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">هامش الربح المتوسط</p>
                      <div className="text-3xl font-black text-slate-900">%{performanceStats.avgMargin}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center text-emerald-600 text-[10px] font-bold">
                       <ArrowUpRight size={14} className="mr-1" />
                       أداء مستقر
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-r-4 border-r-amber-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">حركة السوق (نشط)</p>
                      <div className="text-3xl font-black text-slate-900">{performanceStats.highMovementItems}</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                      <Activity size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">تغير &gt; %5</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-r-4 border-r-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي البنود</p>
                      <div className="text-3xl font-black text-slate-900">{performanceStats.totalItems}</div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                      <Layers size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-bold">{performanceStats.itemsWithProfit} بند بربحية إيجابية</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Performance View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-2 border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black text-slate-800">أعلى المواد تأثيراً في البورصة</CardTitle>
                    <BarChart3 className="text-slate-400" size={20} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-bold">المادة</TableHead>
                        <TableHead className="text-center font-bold">السعر الحالي</TableHead>
                        <TableHead className="text-center font-bold">التغير</TableHead>
                        <TableHead className="text-center font-bold">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trends.slice(0, 6).map((trend, idx) => {
                        const product = prices.find(p => String(p.id) === String(trend.stock_exchange_id));
                        const name = product?.catalog_item?.name || product?.product?.name || 'غير محدد';
                        const changePercent = Number(trend.price_change_percent);
                        
                        return (
                          <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-bold text-slate-700">{name}</TableCell>
                            <TableCell className="text-center font-black">{(Number(trend.market_price) || 0).toLocaleString()} ج.م</TableCell>
                            <TableCell className="text-center">
                              <div className={`flex items-center justify-center gap-1 font-black ${changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {changePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(changePercent).toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={changePercent >= 0 ? 'bg-emerald-100 text-emerald-700 border-none' : 'bg-rose-100 text-rose-700 border-none'}>
                                {changePercent >= 2 ? 'صعود قوي' : changePercent <= -2 ? 'هبوط' : 'مستقر'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg font-black text-slate-800">توزيع المحفظة</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                  <div className="relative w-40 h-40">
                    <PieChart className="w-full h-full text-slate-100" />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-black text-primary">{performanceStats.totalItems}</span>
                      <span className="text-[10px] font-bold text-slate-400">إجمالي المواد</span>
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-bold text-slate-700">عقود نشطة</span>
                      </div>
                      <span className="text-sm font-black text-blue-700">{performanceStats.activeContractsCount}</span>
                    </div>
                    <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-slate-700">هوامش مخاطرة</span>
                      </div>
                      <span className="text-sm font-black text-amber-700">{performanceStats.highMovementItems}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-600 font-bold" onClick={() => router.push('/financial-management/exchange/analytics')}>
                    عرض التحليل التفصيلي
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {/* Calculator Dialog already handled above */}
    </div>
  );
};

export default ExchangeDashboardPage;