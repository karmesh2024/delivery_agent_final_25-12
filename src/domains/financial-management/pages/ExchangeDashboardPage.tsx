'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPrices, updateExchangeProduct } from '../store/exchangeSlice';
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
import { ArrowUp, ArrowDown, RefreshCw, Edit, Bell, Filter, TrendingUp, Database, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ExchangeProduct {
  id: number;
  category_id: string;
  subcategory_id?: string;
  product_id: string;
  base_price: number;
  current_price: number;
  price_change_percentage?: number;
  total_available_stock?: number;
  demand_level?: 'low' | 'normal' | 'high' | 'critical';
  supply_level?: 'low' | 'normal' | 'high' | 'over_supplied';
  last_price_update?: string;
}

const ExchangeDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { prices, loading, error } = useAppSelector((state) => state.exchange);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplyFilter, setSupplyFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<ExchangeProduct | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);

  const demandClass: { [key: string]: string } = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-gray-100 text-gray-800',
    high: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };

  const supplyClass: { [key: string]: string } = {
    low: 'bg-red-100 text-red-800',
    normal: 'bg-gray-100 text-gray-800',
    high: 'bg-yellow-100 text-yellow-800',
    over_supplied: 'bg-green-100 text-green-800',
  };

  useEffect(() => {
    dispatch(fetchPrices());
  }, [dispatch]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditedPrice(parseFloat(e.target.value));
    }
  };

  const handleEditPrice = (item: ExchangeProduct) => {
    setEditingItem(item);
    setEditedPrice(item.current_price);
  };

  const handleSavePrice = async () => {
    if (editingItem) {
      try {
        await dispatch(updateExchangeProduct({
          id: editingItem.id,
          product: { current_price: editedPrice, last_manual_price: editedPrice, last_manual_price_set_at: new Date().toISOString(), last_price_update: new Date().toISOString() }
        })).unwrap();
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
  };

  const filteredExchangeData = prices.filter((item) => {
    const matchesSearch = item.product_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
    const matchesSupply = supplyFilter === 'all' || item.supply_level === supplyFilter;
    return matchesSearch && matchesCategory && matchesSupply;
  });

  if (loading && prices.length === 0) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
        حدث خطأ: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم البورصة</h1>

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prices">أسعار المواد</TabsTrigger>
          <TabsTrigger value="stats">إحصائيات البورصة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prices">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>تصفية وبحث</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="بحث عن مادة..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-48">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">جميع الفئات</option>
                    {/* قم بتوليد خيارات الفئات من البيانات */}
                  </select>
                </div>
                <div className="w-full md:w-48">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={supplyFilter}
                    onChange={(e) => setSupplyFilter(e.target.value)}
                  >
                    <option value="">جميع مستويات العرض</option>
                    <option value="low">نقص في العرض</option>
                    <option value="normal">عرض طبيعي</option>
                    <option value="high">عرض زائد</option>
                    <option value="over_supplied">عرض زائد جدًا</option>
                  </select>
                </div>
                <div>
                  <Button variant="outline" size="default">
                    <RefreshCw className="ml-2" size={16} />
                    تحديث البيانات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>السعر الأساسي</TableHead>
                    <TableHead>السعر الحالي</TableHead>
                    <TableHead>نسبة التغيير</TableHead>
                    <TableHead>المخزون المتاح</TableHead>
                    <TableHead>الطلب</TableHead>
                    <TableHead>العرض</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExchangeData.map((item, index: number) => {
                    const priceChange = item.price_change_percentage;
                    const priceChangeClass = priceChange && priceChange > 0 
                      ? 'text-green-600' 
                      : priceChange && priceChange < 0 
                      ? 'text-red-600' 
                      : 'text-gray-500';
                    
                    const priceChangeIcon = priceChange && priceChange > 0 
                      ? <ArrowUp size={14} className="inline ml-1" /> 
                      : priceChange && priceChange < 0 
                      ? <ArrowDown size={14} className="inline ml-1" /> 
                      : null;
                    
                    return (
                      <TableRow key={item.id} className={index % 2 === 0 ? 'bg-accent/50' : ''}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.product_id}</TableCell>
                        <TableCell>{item.category_id}</TableCell>
                        <TableCell>{item.base_price?.toFixed(2)} جنيه</TableCell>
                        <TableCell>
                          {editingItem && editingItem.id === item.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editedPrice}
                              onChange={handlePriceChange}
                              className="w-24"
                            />
                          ) : (
                            <span className="font-semibold">
                              {item.current_price.toFixed(2)} جنيه
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={priceChangeClass}>
                            {priceChangeIcon}
                            {priceChange && Math.abs(priceChange).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>{item.total_available_stock} كجم</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${demandClass[item.demand_level || 'normal']}`}>
                            {item.demand_level === 'low' && 'منخفض'}
                            {item.demand_level === 'normal' && 'متوسط'}
                            {item.demand_level === 'high' && 'مرتفع'}
                            {item.demand_level === 'critical' && 'حرج'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${supplyClass[item.supply_level || 'normal']}`}>
                            {item.supply_level === 'low' && 'منخفض'}
                            {item.supply_level === 'normal' && 'متوسط'}
                            {item.supply_level === 'high' && 'مرتفع'}
                            {item.supply_level === 'over_supplied' && 'زائد جدًا'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.last_price_update && format(new Date(item.last_price_update), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell className="space-x-2 rtl:space-x-reverse">
                          {editingItem && editingItem.id === item.id ? (
                            <>
                              <Button variant="outline" size="sm" onClick={handleSavePrice}>
                                <Save className="ml-1" size={14} />
                                حفظ
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="ml-1" size={14} />
                                إلغاء
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleEditPrice(item)}>
                              <Edit className="ml-1" size={14} />
                              تعديل
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>نظرة عامة على البورصة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-green-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <CardDescription>أعلى سعر اليوم</CardDescription>
                      <CardTitle className="text-2xl font-bold">
                        {prices.length > 0 ? Math.max(...prices.map(p => p.current_price)).toFixed(2) : 'N/A'} جنيه
                      </CardTitle>
                    </div>
                    <TrendingUp className="text-green-600" size={24} />
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <CardDescription>أدنى سعر اليوم</CardDescription>
                      <CardTitle className="text-2xl font-bold">
                        {prices.length > 0 ? Math.min(...prices.map(p => p.current_price)).toFixed(2) : 'N/A'} جنيه
                      </CardTitle>
                    </div>
                    <ArrowDown className="text-red-600" size={24} />
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <CardDescription>إجمالي المخزون المتاح</CardDescription>
                      <CardTitle className="text-2xl font-bold">
                        {prices.length > 0 ? prices.reduce((sum, p) => sum + (p.total_available_stock || 0), 0).toLocaleString() : 'N/A'} كجم
                      </CardTitle>
                    </div>
                    <Database className="text-blue-600" size={24} />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مستويات العرض والطلب (المواد الأكثر تأثراً)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المادة</TableHead>
                    <TableHead>الطلب</TableHead>
                    <TableHead>العرض</TableHead>
                    <TableHead>الكمية المتاحة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.filter(item => item.demand_level === 'critical' || item.supply_level === 'low').map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_id}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${demandClass[item.demand_level || 'normal']}`}>
                          {item.demand_level === 'low' && 'منخفض'}
                          {item.demand_level === 'normal' && 'متوسط'}
                          {item.demand_level === 'high' && 'مرتفع'}
                          {item.demand_level === 'critical' && 'حرج'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${supplyClass[item.supply_level || 'normal']}`}>
                          {item.supply_level === 'low' && 'منخفض'}
                          {item.supply_level === 'normal' && 'متوسط'}
                          {item.supply_level === 'high' && 'مرتفع'}
                          {item.supply_level === 'over_supplied' && 'زائد جدًا'}
                        </span>
                      </TableCell>
                      <TableCell>{item.total_available_stock} كجم</TableCell>
                    </TableRow>
                  ))}
                  {prices.filter(item => item.demand_level === 'critical' || item.supply_level === 'low').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">لا توجد مواد ذات مستويات عرض أو طلب حرجة حالياً.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExchangeDashboardPage;