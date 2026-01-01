import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { StockExchange, exchangeService } from '../services/exchangeService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { TrendingUp, ArrowDown, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/lib/utils';

interface LivePriceTableProps {
  searchTerm?: string;
  onPriceUpdate?: (updatedPrice: StockExchange) => void;
}

interface PriceUpdateFlash {
  id: number;
  type: 'up' | 'down' | 'neutral';
  timestamp: number;
}

export const LivePriceTable: React.FC<LivePriceTableProps> = ({ 
  searchTerm = '',
  onPriceUpdate 
}) => {
  const [prices, setPrices] = useState<StockExchange[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [flashingPrices, setFlashingPrices] = useState<Set<number>>(new Set());
  const channelRef = useRef<any>(null);
  const previousPricesRef = useRef<Map<number, number>>(new Map());

  // جلب البيانات الأولية
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const initialPrices = await exchangeService.getAllPrices();
        const initialTrends = await exchangeService.getMarketTrends();
        
        setPrices(initialPrices);
        setTrends(initialTrends || []);
        
        // حفظ الأسعار السابقة للمقارنة
        initialPrices.forEach(price => {
          if (price.id) {
            previousPricesRef.current.set(price.id, price.buy_price);
          }
        });
        
        setIsLive(true);
      } catch (error) {
        console.error('خطأ في جلب البيانات الأولية:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // الاشتراك في التحديثات الفورية
  useEffect(() => {
    if (!supabase || !isLive) return;

    // إنشاء channel للاشتراك في التحديثات
    const channel = supabase
      .channel('stock_exchange_live_prices')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_exchange',
        },
        async (payload: any) => {
          console.log('🔄 تحديث فوري في السعر:', payload.new);
          
          const updatedData = payload.new;
          const updatedId = updatedData.id;
          
          // تحديث السعر في القائمة
          setPrices(prevPrices => {
            const updatedPrices = prevPrices.map(price => {
              if (price.id === updatedId) {
                const oldPrice = previousPricesRef.current.get(updatedId) || price.buy_price;
                const newPrice = Number(updatedData.buy_price) || price.buy_price;
                
                // حفظ السعر الجديد
                previousPricesRef.current.set(updatedId, newPrice);
                
                // إضافة تأثير flash
                setFlashingPrices(prev => new Set(prev).add(updatedId));
                setTimeout(() => {
                  setFlashingPrices(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(updatedId);
                    return newSet;
                  });
                }, 2000);
                
                // تحديث trends بعد التحديث الفوري (مع تأخير بسيط لضمان تحديث البيانات)
                setTimeout(async () => {
                  try {
                    const updatedTrends = await exchangeService.getMarketTrends();
                    if (updatedTrends && updatedTrends.length > 0) {
                      setTrends(updatedTrends);
                      console.log('✅ تم تحديث trends بعد التحديث الفوري:', {
                        trendsCount: updatedTrends.length,
                        updatedId: updatedId,
                        trends: updatedTrends.filter(t => Number(t.stock_exchange_id) === updatedId)
                      });
                    }
                  } catch (error) {
                    console.error('❌ خطأ في تحديث trends:', error);
                  }
                }, 800);
                
                // إشعار callback
                if (onPriceUpdate) {
                  onPriceUpdate({
                    ...price,
                    buy_price: newPrice,
                    base_price: Number(updatedData.base_price) || price.base_price,
                    sell_price: Number(updatedData.sell_price) || price.sell_price,
                    last_update: updatedData.last_update || price.last_update,
                  });
                }
                
                return {
                  ...price,
                  buy_price: newPrice,
                  base_price: Number(updatedData.base_price) || price.base_price,
                  sell_price: Number(updatedData.sell_price) || price.sell_price,
                  last_update: updatedData.last_update || price.last_update,
                };
              }
              return price;
            });
            
            return updatedPrices;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة الاشتراك:', status);
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        }
      });

    channelRef.current = channel;

    // تنظيف عند unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isLive, onPriceUpdate]);

  // فلترة الأسعار حسب البحث
  const filteredPrices = prices.filter(price => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      price.catalog_item?.waste_no?.toLowerCase().includes(searchLower) ||
      price.catalog_item?.name?.toLowerCase().includes(searchLower) ||
      price.product?.name?.toLowerCase().includes(searchLower)
    );
  });

  // حساب المؤشر ونسبة التغير
  const getPriceIndicator = (item: StockExchange) => {
    const buyPrice = Number(item.buy_price) || 0;
    const basePrice = Number(item.base_price) || 0;
    
    const itemId = Number(item.id) || 0;
    const itemProductId = item.product_id || '';
    
    const trend = trends.find(t => {
      const trendId = Number(t.stock_exchange_id) || 0;
      const trendProductId = t.product_id || '';
      
      // مطابقة بـ stock_exchange_id أولاً (الأفضل)
      const matchById = trendId === itemId && itemId > 0;
      
      // مطابقة بـ product_id إذا كان متاحاً
      const matchByProductId = trendProductId && itemProductId && trendProductId === itemProductId;
      
      return matchById || matchByProductId;
    });
    
    // Debug log للمساعدة في تتبع المشاكل
    if (itemId > 0 && !trend && trends.length > 0) {
      console.log(`⚠️ LivePriceTable: لم يتم العثور على trend للمنتج ${itemId}:`, {
        itemId,
        itemProductId,
        trendsCount: trends.length,
        availableTrends: trends.map(t => ({
          stock_exchange_id: t.stock_exchange_id,
          product_id: t.product_id,
          price_24h_ago: t.price_24h_ago
        }))
      });
    }
    
    // استخدام last_actual_purchase_price كسعر مرجعي أولاً، ثم base_price كبديل
    let price24hAgo = 0;
    
    if (trend && trend.price_24h_ago) {
      price24hAgo = Number(trend.price_24h_ago) || 0;
    }
    
    // إذا لم يكن هناك trend أو price_24h_ago = 0 أو يساوي السعر الحالي
    // نستخدم base_price كسعر مرجعي فقط إذا كان مختلفاً عن السعر الحالي
    if ((price24hAgo === 0 || price24hAgo === buyPrice) && basePrice > 0 && basePrice !== buyPrice) {
      price24hAgo = basePrice;
    }
    
    // حساب الفرق ونسبة التغير
    if (price24hAgo > 0) {
      const diff = buyPrice - price24hAgo;
      if (Math.abs(diff) < 0.01) {
        return { diff: 0, percent: 0, type: 'neutral' };
      }
      const percent = (diff / price24hAgo) * 100;
      return { 
        diff, 
        percent, 
        type: diff > 0 ? 'up' : 'down' 
      };
    }
    
    return { diff: 0, percent: 0, type: 'neutral' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* مؤشر Live */}
      <div className="absolute top-0 right-0 flex items-center gap-2 mb-4 z-10">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold",
          isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
          )} />
          <span>{isLive ? 'مباشر' : 'غير متصل'}</span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>المادة</TableHead>
            <TableHead>الأساسي</TableHead>
            <TableHead>سعر الشراء (تداول)</TableHead>
            <TableHead>سعر البيع (للطن)</TableHead>
            <TableHead>مؤشر السوق (24h)</TableHead>
            <TableHead>نسبة التغير</TableHead>
            <TableHead>آخر تحديث</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPrices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                لا توجد بيانات
              </TableCell>
            </TableRow>
          ) : (
            filteredPrices.map((item, index) => {
              const indicator = getPriceIndicator(item);
              const isFlashing = flashingPrices.has(item.id || 0);
              
              return (
                <TableRow
                  key={item.id || index}
                  className={cn(
                    "transition-all duration-300",
                    isFlashing && indicator.type === 'up' && "bg-green-50 animate-pulse",
                    isFlashing && indicator.type === 'down' && "bg-red-50 animate-pulse",
                    isFlashing && indicator.type === 'neutral' && "bg-blue-50"
                  )}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {item.catalog_item?.waste_no || item.product?.name || 'غير محدد'}
                      </span>
                      {item.catalog_item?.main_category && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.catalog_item.main_category.full_path || item.catalog_item.main_category.name}
                          {item.catalog_item.sub_category && ` > ${item.catalog_item.sub_category.name}`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{Number(item.base_price || 0).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold text-lg",
                      isFlashing && "transition-all duration-300 animate-pulse",
                      indicator.type === 'up' && "text-green-600",
                      indicator.type === 'down' && "text-red-600",
                      indicator.type === 'neutral' && "text-gray-800"
                    )}>
                      {Number(item.buy_price || 0).toFixed(2)} ج.م
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-blue-600">
                      {item.sell_price ? Number(item.sell_price).toLocaleString() : '-'} ج.م
                    </span>
                    {item.sell_price && (
                      <div className="text-xs text-blue-500 mt-1">للطن</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {indicator.diff !== 0 ? (
                      indicator.type === 'up' ? (
                        <div className="flex items-center justify-center text-green-600 gap-1 bg-green-50 px-2 py-1 rounded-full w-fit mx-auto">
                          <TrendingUp size={14} />
                          <span className="text-xs font-bold">+{indicator.diff.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-red-600 gap-1 bg-red-50 px-2 py-1 rounded-full w-fit mx-auto">
                          <ArrowDown size={14} />
                          <span className="text-xs font-bold">{indicator.diff.toFixed(2)}</span>
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400 font-bold">0.00</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {indicator.percent !== 0 ? (
                      <span className={cn(
                        "text-xs font-bold",
                        indicator.type === 'up' ? 'text-green-600' : 'text-red-500'
                      )}>
                        {indicator.type === 'up' ? '+' : ''}{indicator.percent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold">0.0%</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.last_update ? (
                      <span className="text-xs text-gray-500">
                        {format(new Date(item.last_update), 'MMMM d, HH:mm', { locale: ar })}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

