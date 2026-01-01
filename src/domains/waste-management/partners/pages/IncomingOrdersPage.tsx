'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchOrders, updateOrderStatus, createOrder, fetchPartners } from '../store/industrialPartnersSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
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
import { Search, ShoppingCart, Check, X, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { PartnerOrderItem } from '../types';

const IncomingOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, partners, loading } = useAppSelector((state) => state.industrialPartners);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form State
  const [newOrder, setNewOrder] = useState({
     partner_id: '',
     delivery_date: '',
     notes: '',
     items: [] as PartnerOrderItem[]
  });

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchPartners()); // Fetch partners for the dropdown
  }, [dispatch]);

  const handleAddItem = () => {
      setNewOrder({
          ...newOrder,
          items: [...newOrder.items, { product_id: '', product_name: '', quantity: 0, unit: 'ton', agreed_price: 0 }]
      });
  };

  const handleRemoveItem = (index: number) => {
      const updatedItems = [...newOrder.items];
      updatedItems.splice(index, 1);
      setNewOrder({...newOrder, items: updatedItems});
  };

  const handleItemChange = (index: number, field: keyof PartnerOrderItem, value: string | number) => {
      const updatedItems = [...newOrder.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setNewOrder({...newOrder, items: updatedItems});
  };

  const calculateTotal = () => {
      return newOrder.items.reduce((sum, item) => sum + (item.quantity * item.agreed_price), 0);
  };

  const handleCreateOrder = async () => {
      if (!newOrder.partner_id || newOrder.items.length === 0) {
          toast.error('يرجى اختيار شريك وإضافة منتج واحد على الأقل');
          return;
      }

      try {
        await dispatch(createOrder({
            ...newOrder,
            status: 'pending',
            total_amount: calculateTotal()
        })).unwrap();
        toast.success('تم إنشاء الطلب بنجاح');
        setIsAddDialogOpen(false);
        setNewOrder({ partner_id: '', delivery_date: '', notes: '', items: [] });
      } catch (error) {
         toast.error('فشل في إنشاء الطلب');
      }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
          await dispatch(updateOrderStatus({ id, status: newStatus })).unwrap();
          toast.success(`تم تغيير حالة الطلب إلى ${getStatusLabel(newStatus)}`);
      } catch (error) {
          toast.error('فشل تحديث الحالة');
      }
  };

  // ... (keeping existing getStatusBadge and getStatusLabel helpers)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">قيد الانتظار</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">تمت الموافقة</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">جاري التجهيز</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مكتمل</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'pending': return 'قيد الانتظار';
          case 'approved': return 'تمت الموافقة';
          case 'processing': return 'جاري التجهيز';
          case 'completed': return 'مكتمل';
          case 'rejected': return 'مرفوض';
          default: return status;
      }
  }

  const filteredOrders = orders.filter(o => 
    o.partner?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.order_number?.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">طلبات الشراء الواردة</h1>
          <p className="text-gray-500">متابعة طلبات المصانع والشركاء لتوريد المواد الخام</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="ml-2 h-4 w-4" />
                إنشاء طلب يدوي
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>إنشاء طلب توريد جديد</DialogTitle>
                    <DialogDescription>أدخل تفاصيل الطلب الوارد من المصنع أو الشريك</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الشريك (المصنع/التاجر)</Label>
                            <Select value={newOrder.partner_id} onValueChange={(val) => setNewOrder({...newOrder, partner_id: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الشريك" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partners.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.type === 'factory' ? 'مصنع' : 'تاجر'})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>تاريخ التسليم المطلوب</Label>
                             <Input type="date" value={newOrder.delivery_date} onChange={e => setNewOrder({...newOrder, delivery_date: e.target.value})} />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <Label className="text-base font-semibold">المنتجات المطلوبة</Label>
                            <Button size="sm" variant="outline" onClick={handleAddItem}>
                                <Plus className="h-4 w-4 ml-1" /> إضافة منتج
                            </Button>
                        </div>
                        
                        {newOrder.items.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">لم يتم إضافة منتجات بعد</div>
                        ) : (
                            <div className="space-y-3">
                                {newOrder.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-4">
                                            <Label className="text-xs">اسم المنتج</Label>
                                            <Input 
                                                value={item.product_name} 
                                                onChange={e => handleItemChange(index, 'product_name', e.target.value)} 
                                                placeholder="مثال: بلاستيك PET"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs">الكمية</Label>
                                            <Input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} 
                                            />
                                        </div>
                                         <div className="col-span-2">
                                            <Label className="text-xs">الوحدة</Label>
                                             <Select value={item.unit} onValueChange={(val) => handleItemChange(index, 'unit', val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ton">طن</SelectItem>
                                                    <SelectItem value="kg">كيلو</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-3">
                                            <Label className="text-xs">سعر الوحدة (ج.م)</Label>
                                            <Input 
                                                type="number" 
                                                value={item.agreed_price} 
                                                onChange={e => handleItemChange(index, 'agreed_price', Number(e.target.value))} 
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveItem(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 flex justify-end items-center gap-2 pt-4 border-t">
                            <span className="text-sm font-medium">الإجمالي التقديري:</span>
                            <span className="text-xl font-bold">{calculateTotal().toLocaleString()} ج.م</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>ملاحظات إضافية</Label>
                        <Input value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} placeholder="أي شروط خاصة للتسليم..." />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleCreateOrder}>تأكيد الطلب</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
              <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-gray-500">إجمالي الطلبات</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
                  <p className="text-xs text-gray-500">قيد الانتظار</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'processing').length}</div>
                  <p className="text-xs text-gray-500">جاري التنفيذ</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'completed').length}</div>
                  <p className="text-xs text-gray-500">مكتملة</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
            <CardTitle>سجل الطلبات</CardTitle>
            <div className="relative w-72">
                 <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
                 <Input 
                   placeholder="بحث برقم الطلب أو اسم المصنع..." 
                   className="pr-8" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
            </div>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>الشريك (المصنع)</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>تاريخ التسليم المتوقع</TableHead>
                <TableHead>إجمالي القيمة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {filteredOrders.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">لا توجد طلبات واردة</TableCell>
                  </TableRow>
              ): filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell className="font-semibold">{order.partner?.name}</TableCell>
                  <TableCell>{order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy', {locale: ar}) : '-'}</TableCell>
                  <TableCell>{order.delivery_date ? format(new Date(order.delivery_date), 'dd/MM/yyyy', {locale: ar}) : '-'}</TableCell>
                  <TableCell className="font-bold">{order.total_amount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                        {order.status === 'pending' && (
                            <>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate(order.id, 'approved')}>
                                    <Check size={14} />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate(order.id, 'rejected')}>
                                    <X size={14} />
                                </Button>
                            </>
                        )}
                        {order.status === 'approved' && (
                             <Button size="sm" variant="outline" className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleStatusUpdate(order.id, 'processing')}>
                                بدء التجهيز
                            </Button>
                        )}
                         {order.status === 'processing' && (
                             <Button size="sm" variant="outline" className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate(order.id, 'completed')}>
                                إكمال
                            </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomingOrdersPage;


