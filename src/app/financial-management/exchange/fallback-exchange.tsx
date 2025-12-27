'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { FiTrendingUp, FiTrendingDown, FiSearch, FiRefreshCw, FiFilter } from "react-icons/fi";

// بيانات احتياطية للعرض
const DUMMY_DATA = [
  { 
    id: 1, 
    product: { name: 'الألومنيوم' }, 
    category: { name: 'معادن' },
    buy_price: 1250.50, 
    base_price: 1200.00, 
    price_change_percentage: 4.2, 
    total_available_stock: 5000,
    demand_level: 'high',
    last_update: '2023-11-20T10:30:00'
  },
  { 
    id: 2, 
    product: { name: 'النحاس' }, 
    category: { name: 'معادن' },
    buy_price: 2300.75, 
    base_price: 2500.00, 
    price_change_percentage: -8.0, 
    total_available_stock: 3200,
    demand_level: 'normal',
    last_update: '2023-11-20T11:15:00'
  },
  { 
    id: 3, 
    product: { name: 'الورق المقوى' }, 
    category: { name: 'ورق' },
    buy_price: 320.25, 
    base_price: 300.00, 
    price_change_percentage: 6.75, 
    total_available_stock: 12000,
    demand_level: 'high',
    last_update: '2023-11-20T09:45:00'
  }
];

const FallbackExchange: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState(DUMMY_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  useEffect(() => {
    // محاكاة التحميل
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const categories = ['all', 'معادن', 'ورق', 'زجاج', 'بلاستيك'];
  
  const filteredPrices = prices.filter(item => {
    const matchesSearch = item.product.name.includes(searchTerm) || 
                         item.category.name.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || item.category.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <p className="text-amber-700">
          ملاحظة: يتم عرض نسخة احتياطية من البورصة حالياً. بعض الوظائف قد لا تعمل.
        </p>
      </div>
    
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">بورصة المواد الصناعية</h1>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
        >
          <FiRefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* فلاتر البحث */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="بحث عن مادة..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <FiFilter className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-md p-2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'جميع الفئات' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* مؤشرات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">أعلى سعر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : Math.max(...prices.map(p => p.buy_price)).toFixed(2)} جنيه
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">أدنى سعر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : Math.min(...prices.map(p => p.buy_price)).toFixed(2)} جنيه
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : prices.reduce((sum, p) => sum + p.total_available_stock, 0).toLocaleString()} وحدة
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* جدول الأسعار */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">المادة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead className="text-center">المخزون المتاح</TableHead>
                <TableHead className="text-center">سعر الشراء</TableHead>
                <TableHead className="text-center">التغير</TableHead>
                <TableHead className="text-center">آخر تحديث</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">جاري تحميل البيانات...</TableCell>
                </TableRow>
              ) : (
                filteredPrices.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.category.name}</TableCell>
                    <TableCell className="text-center">{item.total_available_stock.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-center">{item.buy_price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <div className={`flex items-center justify-center ${item.price_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.price_change_percentage >= 0 ? (
                          <FiTrendingUp className="mr-1" />
                        ) : (
                          <FiTrendingDown className="mr-1" />
                        )}
                        {Math.abs(item.price_change_percentage).toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500">
                      {formatDate(item.last_update)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {!loading && filteredPrices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">لا توجد نتائج للبحث</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FallbackExchange;