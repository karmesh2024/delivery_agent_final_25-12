import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { StockExchange, exchangeService } from '../services/exchangeService';
import { TrendingUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        const prices = await exchangeService.getAllPrices();
        const trends = await exchangeService.getMarketTrends();
        
        const items: TickerItem[] = prices
          .filter(item => item.id && item.buy_price)
          .map(item => {
            const buyPrice = Number(item.buy_price) || 0;
            const itemId = Number(item.id) || 0;
            const itemProductId = item.product_id || '';
            
            // البحث عن trend
            const trend = trends.find(t => {
              const trendId = Number(t.stock_exchange_id) || 0;
              const trendProductId = t.product_id || '';
              
              // مطابقة بـ stock_exchange_id أولاً (الأفضل)
              const matchById = trendId === itemId && itemId > 0;
              
              // مطابقة بـ product_id إذا كان متاحاً
              const matchByProductId = trendProductId && itemProductId && trendProductId === itemProductId;
              
              return matchById || matchByProductId;
            });
            
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
            } else {
              // Fallback إلى base_price
              const basePrice = Number(item.base_price) || 0;
              if (basePrice > 0) {
                change = buyPrice - basePrice;
                changePercent = (change / basePrice) * 100;
                type = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
              }
            }
            
            // بناء اسم المادة من الفئات (مثل الكتالوج)
            let displayName = 'غير محدد';
            if (item.catalog_item) {
              const mainCat = (item.catalog_item.main_category as any)?.name || 
                             (item.catalog_item.main_category as any)?.name_ar || '';
              const subCat = (item.catalog_item.sub_category as any)?.name || 
                            (item.catalog_item.sub_category as any)?.name_ar || '';
              const fullPath = (item.catalog_item.main_category as any)?.full_path || '';
              
              // استخدام full_path إذا كان متاحاً (مثل: "القطاع المنزلي > المخلفات المنزلية > بلاستيك")
              if (fullPath) {
                displayName = fullPath;
              } else if (mainCat && subCat) {
                displayName = `${mainCat} > ${subCat}`;
              } else if (mainCat) {
                displayName = mainCat;
              } else if (item.catalog_item.name && item.catalog_item.name !== item.catalog_item.waste_no) {
                displayName = item.catalog_item.name;
              } else if (item.catalog_item.waste_no) {
                displayName = item.catalog_item.waste_no;
              }
            } else if (item.product?.name) {
              displayName = item.product.name;
            }
            
            return {
              id: itemId,
              name: displayName,
              price: buyPrice,
              change,
              changePercent,
              type,
            };
          })
          .filter(item => item.name !== 'غير محدد');
        
        // تكرار العناصر لإنشاء تأثير مستمر
        setTickerItems([...items, ...items, ...items]);
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
        supabase.removeChannel(channelRef.current);
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
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 whitespace-nowrap px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[280px]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-600 truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {item.price.toFixed(2)} ج.م
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

