import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { StockExchange, exchangeService } from '../services/exchangeService';
import { subcategoryExchangePriceService } from '../services/subcategoryExchangePriceService';
import { TrendingUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { PriceSparkline } from './PriceSparkline';
import './PriceTicker.css';

interface PriceTickerProps {
  className?: string;
}

interface TickerItem {
  id: number;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'up' | 'down' | 'neutral';
  kind: 'subcategory' | 'product';
  subName?: string;
  sparkline?: number[];
}

export const PriceTicker: React.FC<PriceTickerProps> = ({ className }) => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // جلب البيانات الأولية وإنشاء ticker items
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prices, trends, subPrices, allSubs, allProducts, subCategoryTrends, subSparkMap, prodSparkMap] = await Promise.all([
          exchangeService.getAllPrices(),
          exchangeService.getMarketTrends(),
          supabase ? supabase.from('subcategory_exchange_price').select('*, waste_sub_categories(name)').or('show_on_ticker.eq.true,show_on_ticker.is.null') : Promise.resolve({ data: [] }),
          // جلب كل الفئات الفرعية لبناء خريطة ID → Name
          supabase ? supabase.from('waste_sub_categories').select('id, name') : Promise.resolve({ data: [] }),
          // جلب المنتجات مع subcategory_id لبناء خريطة product_id → subcategory_name
          supabase ? supabase.from('waste_data_admin').select('id, name, subcategory_id') : Promise.resolve({ data: [] }),
          // جلب تاريخ أسعار الفئات الفرعية (الحل الجديد)
          subcategoryExchangePriceService.getSubcategoryMarketTrends(),
          // جلب بيانات Sparkline
          subcategoryExchangePriceService.getSubcategorySparklineData(10),
          exchangeService.getProductSparklineData(10)
        ]);
        
        // بناء خريطة subcategory_id → name من جدول الفئات الفرعية
        const subIdToName = new Map<string, string>();
        (allSubs.data || []).forEach((sub: any) => {
          subIdToName.set(String(sub.id), sub.name || '');
        });
        
        // بناء خريطة product_id → subcategory_name من جدول المنتجات
        const productToSubName = new Map<string, string>();
        (allProducts.data || []).forEach((p: any) => {
          if (p.subcategory_id) {
            const subName = subIdToName.get(String(p.subcategory_id));
            if (subName) {
              productToSubName.set(String(p.id), subName);
            }
          }
        });
        
        // 1. تحويل أسعار المنتجات (المحفوظة في البورصة والتي تم نشرها وتفعيل التيكر لها)
        const productItems: TickerItem[] = prices
          .filter(item => {
            const isPublished = (item as any).is_published ?? (item.id !== 0 && !!item.id);
            const showOnTicker = (item as any).show_on_ticker !== false;
            return item.id && item.buy_price && isPublished && showOnTicker;
          })
          .map(item => {
            const buyPrice = Number(item.buy_price) || 0;
            const itemId = Number(item.id) || 0;
            const itemProductId = item.product_id || '';
            
            const trend = trends.find(t => {
              const trendId = Number(t.stock_exchange_id) || 0;
              const trendProductId = t.product_id || '';
              return (trendId === itemId && itemId > 0) || (trendProductId && itemProductId && trendProductId === itemProductId);
            });
            
            let change = 0, changePercent = 0, type: 'up' | 'down' | 'neutral' = 'neutral';
            if (trend && trend.price_24h_ago) {
              const price24hAgo = Number(trend.price_24h_ago) || 0;
              if (price24hAgo > 0) {
                change = buyPrice - price24hAgo;
                changePercent = (change / price24hAgo) * 100;
                type = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
              }
            }
            
            let displayName = item.product?.name || item.catalog_item?.name || 'منتج';
            
            // تحديد اسم الفئة الفرعية: الأولوية لخريطة product_id → subName
            let subCategoryName = productToSubName.get(itemProductId) || '';
            
            // احتياطي: إذا لم نجد عبر product_id، نحاول عبر subcategory_id
            if (!subCategoryName) {
              const subCatId = String(item.subcategory_id || (item.catalog_item as any)?.sub_category_id || '');
              subCategoryName = subIdToName.get(subCatId) || item.subcategory?.name || item.catalog_item?.sub_category?.name || '';
            }
            
            return { 
              id: itemId, 
              name: displayName, 
              kind: 'product' as const,
              subName: subCategoryName,
              price: buyPrice, 
              change, 
              changePercent, 
              type,
              sparkline: prodSparkMap[itemId] || [buyPrice, buyPrice]
            };
          });

        // تم تعطيل إضافة الفئات الفرعية للشريط بناءً على طلب المستخدم لمزامنة الشريط مع فورم المنتجات المنشورة
        setTickerItems([...productItems, ...productItems, ...productItems]);
        setIsLive(true);
        setIsLive(true);
      } catch (error) {
        console.error('خطأ في جلب بيانات Ticker:', error);
      }
    };

    loadData();
  }, []);

  // الاشتراك في التحديثات الفورية
  useEffect(() => {
    if (!supabase || !isLive) return;

    const channel = supabase
      .channel('price_ticker_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_exchange',
        },
        async (payload: any) => {
          const updatedData = payload.new;
          const updatedId = updatedData.id;
          
          // تحديث ticker items
          const trends = await exchangeService.getMarketTrends();
          const trend = trends.find(t => Number(t.stock_exchange_id) === updatedId);
          
          setTickerItems(prevItems => {
            return prevItems.map(item => {
              if (item.id === updatedId) {
                const buyPrice = Number(updatedData.buy_price) || item.price;
                let change = 0;
                let changePercent = 0;
                let type: 'up' | 'down' | 'neutral' = 'neutral';
                
                if (trend && trend.price_24h_ago) {
                  const price24hAgo = Number(trend.price_24h_ago) || 0;
                  if (price24hAgo > 0) {
                    change = buyPrice - price24hAgo;
                    changePercent = (change / price24hAgo) * 100;
                    type = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
                  }
                }
                
                return {
                  ...item,
                  price: buyPrice,
                  change,
                  changePercent,
                  type,
                };
              }
              return item;
            });
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isLive]);

  return (
    <div className={cn("relative w-full overflow-hidden bg-gradient-to-r from-blue-50 to-white border-b border-blue-100", className)}>
      {/* مؤشر Live */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold bg-white shadow-sm",
          isLive ? "text-green-700" : "text-gray-600"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
          )} />
          <span>مباشر</span>
        </div>
      </div>

      {/* شريط التمرير */}
      <div className="flex items-center h-14 overflow-hidden">
        <div
          ref={tickerRef}
          className="flex items-center gap-8 ticker-scroll"
        >
          {tickerItems.map((item, index) => (
            <div
              key={`ticker-${index}-${item.id ?? index}`}
              className="flex items-center gap-3 whitespace-nowrap px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[340px]"
            >
              {/* الرسم البياني المصغر للبورصة */}
              <div className="flex-shrink-0 w-[60px] opacity-70 group-hover:opacity-100 transition-opacity">
                <PriceSparkline data={item.sparkline || []} width={60} height={30} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {item.kind === 'subcategory' ? (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">فئة</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">مادة</Badge>
                  )}
                  <span className="text-xs font-bold text-gray-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-gray-900">
                    {item.price.toFixed(2)} <span className="text-[10px] font-normal text-gray-500">ج.م</span>
                  </div>
                  {item.kind === 'product' && item.subName && (
                    <div className="text-[10px] text-indigo-500 font-medium truncate opacity-80">
                      ({item.subName})
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.type === 'up' ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold">+{item.change.toFixed(2)}</span>
                    <span className="text-xs font-bold">({item.changePercent > 0 ? `+${item.changePercent.toFixed(1)}` : `${item.changePercent.toFixed(1)}`}%)</span>
                  </div>
                ) : item.type === 'down' ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <ArrowDown size={16} />
                    <span className="text-xs font-bold">{item.change.toFixed(2)}</span>
                    <span className="text-xs font-bold">({item.changePercent.toFixed(1)}%)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs font-bold">0.00</span>
                    <span className="text-xs font-bold">(0.0%)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

