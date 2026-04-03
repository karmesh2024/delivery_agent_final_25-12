'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchOrders, updateOrderStatus, fetchPartners } from '../store/industrialPartnersSlice';
import {
  Card,
  CardContent,
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
import { Badge } from '@/shared/components/ui/badge';
import { 
  Plus, 
  TrendingUp, 
  MessageSquare, 
  Phone, 
  User, 
  Smartphone, 
  Building2, 
  Truck, 
  FileText,
  Calculator,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { QuickBidDialog } from '@/domains/waste-management/components/QuickBidDialog';
import { marketBidService } from '@/domains/waste-management/services/marketBidService';
import { MarketBid } from '../market-bids.types';
import { industrialPartnersService } from '../services/industrialPartnersService';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { exchangeService } from '@/domains/waste-management/services/exchangeService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

const IncomingOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, partners, loading } = useAppSelector((state) => state.industrialPartners);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [marketBids, setMarketBids] = useState<MarketBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [isAcceptTypeDialogOpen, setIsAcceptTypeDialogOpen] = useState(false);
  const [acceptContext, setAcceptContext] = useState<MarketBid | null>(null);
  
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [exchangePrices, setExchangePrices] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchPartners());
    loadMarketBids();
    loadDependencies();
  }, [dispatch]);

  const loadMarketBids = async () => {
    setLoadingBids(true);
    try {
      const bids = await marketBidService.getBids({ status: 'active' });
      setMarketBids(bids);
    } catch (error) {
      console.error("Error loading market bids:", error);
    } finally {
      setLoadingBids(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [subsRes, pricesRes] = await Promise.all([
        categoryService.getSubCategories(),
        exchangeService.getAllPrices()
      ]);
      setSubcategories(subsRes.data || []);
      setExchangePrices(pricesRes || []);
    } catch (error) {
       console.error("Error loading dependencies for bids:", error);
    }
  };

  const handleAcceptBid = (bid: MarketBid) => {
    setAcceptContext(bid);
    setIsAcceptTypeDialogOpen(true);
  };

  const processQuickOrder = async () => {
    if (!acceptContext) return;
    try {
      // Find a matching product from exchange for this subcategory
      const relatedPrice = exchangePrices.find(p => String(p.subcategory_id) === String(acceptContext.subcategory_id));
      
      await industrialPartnersService.createOrder({
        partner_id: acceptContext.partner_id || "",
        status: 'approved',
        items: [{
          product_id: relatedPrice?.product_id || "",
          product_name: subcategories.find(s => String(s.id) === String(acceptContext.subcategory_id))?.name || 'مادة عاجلة',
          agreed_price: Number(acceptContext.bid_price),
          quantity: Number(acceptContext.quantity) || 0,
          unit: 'ton'
        }],
        total_amount: Number(acceptContext.bid_price) * (Number(acceptContext.quantity) || 0)
      });

      await marketBidService.updateBidStatus(acceptContext.id, 'contracted');
      
      toast.success("تم إنشاء طلب توريد فوري بنجاح.");
      setIsAcceptTypeDialogOpen(false);
      loadMarketBids();
      dispatch(fetchOrders());
    } catch (error) {
      toast.error("فشل في إنشاء الطلب الفوري");
    }
  };

  const processFormalContract = async () => {
    if (!acceptContext) return;
    try {
      await marketBidService.updateBidStatus(acceptContext.id, 'accepted');
      toast.success("تم القبول لإبرام عقد.");
      setIsAcceptTypeDialogOpen(false);
      loadMarketBids();
    } catch (error) {
      toast.error("فشل في تحويل العرض لتعاقد");
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Auction Header Section */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">المزاد الذكي (التوريد المباشر)</h3>
            <p className="text-sm text-slate-500 font-bold">راقب ونفذ أفضل عروض الأسعار المقدمة من المصانع والتجار</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsBidDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 h-11 px-6"
        >
          <Plus className="w-5 h-5" />
          سجل عرض خارجي جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Bids Column */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-slate-100 py-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-indigo-900">العروض الواردة (المزاد العكسي)</CardTitle>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1 rounded-lg">
                  {marketBids.length} عرض نشط
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-black text-slate-700">العارض</TableHead>
                      <TableHead className="font-black text-slate-700">الصنف</TableHead>
                      <TableHead className="font-black text-slate-700 text-center">السعر (طن)</TableHead>
                      <TableHead className="font-black text-slate-700 text-center">المصدر</TableHead>
                      <TableHead className="font-black text-slate-700 text-center">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBids ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                          جاري تحميل العروض...
                        </TableCell>
                      </TableRow>
                    ) : marketBids.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold">
                          لا يوجد عروض نشطة حالياً. ابدأ بتسجيل عرض جديد.
                        </TableCell>
                      </TableRow>
                    ) : marketBids.map((bid) => {
                      const subName = subcategories.find(s => String(s.id) === String(bid.subcategory_id))?.name || 'غير محدد';
                      return (
                        <TableRow key={bid.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50">
                          <TableCell className="font-bold text-slate-800 py-4">
                            <div className="flex flex-col">
                              <span>{bid.bidder_name}</span>
                              <span className="text-[10px] text-slate-400">{format(new Date(bid.created_at || ""), "HH:mm - yyyy/MM/dd")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold bg-white text-slate-600 border-slate-200">
                              {subName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-lg font-black text-emerald-600">
                              {Number(bid.bid_price).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-bold">ج.م</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge className={`${
                                bid.source === 'whatsapp' ? 'bg-green-100 text-green-700 border-green-200' :
                                bid.source === 'phone' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              } font-bold flex items-center gap-1 py-1`}>
                                {bid.source === 'whatsapp' && <MessageSquare size={12} />}
                                {bid.source === 'phone' && <Phone size={12} />}
                                {bid.source === 'person' && <User size={12} />}
                                {bid.source === 'app' && <Smartphone size={12} />}
                                {bid.source === 'whatsapp' ? 'واتساب' : 
                                 bid.source === 'phone' ? 'هاتف' : 
                                 bid.source === 'person' ? 'شخصي' : 'تطبيق'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-9 px-4 rounded-xl shadow-md transition-all active:scale-95"
                              onClick={() => handleAcceptBid(bid)}
                            >
                              قبول العرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Requests Column */}
        <div>
          <Card className="border-none shadow-md overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-5">
              <CardTitle className="text-lg font-black text-slate-900">طلبات السوق (طلب منا)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">لا توجد طلبات جارية</div>
                ) : (
                  orders.flatMap(o => o.items?.map(i => ({...i, status: o.status, partnerName: o.partner?.name})) || [])
                    .filter(item => ['pending', 'approved', 'processing'].includes(item.status))
                    .slice(0, 8)
                    .map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-all border-l-4 border-l-indigo-500 group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.product_name}</span>
                          <Badge className={`text-[10px] border font-bold px-2 py-0.5 rounded-lg ${
                            item.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            item.status === 'approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {item.status === 'pending' ? 'انتظار' : 
                             item.status === 'approved' ? 'موافق' : 'تموين'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl mb-3">
                          <span className="text-indigo-700 font-black">{Number(item.agreed_price).toLocaleString()} <span className="text-[10px] font-bold">ج.م</span></span>
                          <span className="text-slate-500 text-xs font-black">{item.quantity} {item.unit}</span>
                        </div>
                        {item.partnerName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold">
                            <Building2 size={12} className="text-slate-300" /> {item.partnerName}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <QuickBidDialog 
        isOpen={isBidDialogOpen}
        onClose={() => setIsBidDialogOpen(false)}
        onSuccess={loadMarketBids}
        subcategories={subcategories}
        exchangePrices={exchangePrices}
        products={exchangePrices.map(p => ({ 
          id: p.id, 
          name: p.product?.name || p.product_id, 
          subcategory_id: p.subcategory_id 
        }))}
      />

      <Dialog open={isAcceptTypeDialogOpen} onOpenChange={setIsAcceptTypeDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-emerald-50 to-white border-b">
            <DialogTitle className="text-xl font-black text-gray-900">تأكيد قبول العرض</DialogTitle>
            <DialogDescription className="font-bold text-gray-500">
              حدد المسار المطلوب للتعامل مع عرض <span className="text-indigo-600">{acceptContext?.bidder_name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <button 
              onClick={processQuickOrder}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right group"
            >
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Truck size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900">طلب توريد فوري (مسار سريع)</h4>
                <p className="text-xs text-gray-500 font-bold mt-1">صفقة لمرة واحدة لتصريف مخزن. لا يؤثر على سعر البورصة.</p>
              </div>
            </button>

            <button 
              onClick={processFormalContract}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-right group"
            >
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900">تعاقد رسمي متكرر (مسار بورصة)</h4>
                <p className="text-xs text-gray-500 font-bold mt-1">تثبيت السعر لفترة. يؤثر مباشرة على متوسط أسعار الشراء.</p>
              </div>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <Button variant="ghost" onClick={() => setIsAcceptTypeDialogOpen(false)} className="font-bold">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomingOrdersPage;
