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
import { FiSearch, FiRefreshCw, FiFilter, FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

// بيانات احتياطية للعرض
const DUMMY_DATA = [
  { 
    id: '1', 
    product: { name: 'الألومنيوم المعاد تدويره' }, 
    category: { name: 'معادن' },
    warehouse: { name: 'المستودع الرئيسي' },
    quantity: 3500,
    unit: 'كجم',
    min_quantity: 1000,
    max_quantity: 5000,
    last_update: '2023-11-20T10:30:00'
  },
  { 
    id: '2', 
    product: { name: 'النحاس النقي' }, 
    category: { name: 'معادن' },
    warehouse: { name: 'مستودع المواد الأولية' },
    quantity: 1200,
    unit: 'كجم',
    min_quantity: 500,
    max_quantity: 2000,
    last_update: '2023-11-18T14:45:00'
  },
  { 
    id: '3', 
    product: { name: 'الورق المقوى' }, 
    category: { name: 'ورق' },
    warehouse: { name: 'المستودع الرئيسي' },
    quantity: 8500,
    unit: 'كجم',
    min_quantity: 2000,
    max_quantity: 10000,
    last_update: '2023-11-19T09:15:00'
  }
];

const FallbackInventory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState(DUMMY_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  
  useEffect(() => {
    // محاكاة التحميل
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const categories = ['all', 'معادن', 'ورق', 'زجاج', 'بلاستيك'];
  const warehouses = ['all', 'المستودع الرئيسي', 'مستودع المواد الأولية'];
  
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.product.name.includes(searchTerm) || 
                         item.category.name.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || item.category.name === categoryFilter;
    const matchesWarehouse = warehouseFilter === 'all' || item.warehouse.name === warehouseFilter;
    return matchesSearch && matchesCategory && matchesWarehouse;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStockStatus = (quantity: number, min: number, max: number) => {
    if (quantity <= min) return { label: 'منخفض', class: 'bg-red-100 text-red-800' };
    if (quantity >= max) return { label: 'زائد', class: 'bg-blue-100 text-blue-800' };
    return { label: 'جيد', class: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <p className="text-amber-700">
          ملاحظة: يتم عرض نسخة احتياطية من إدارة المخزون حالياً. بعض الوظائف قد لا تعمل.
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة المخزون</h1>
        <div className="flex gap-2">
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
          <Button>
            <FiPlus className="mr-2 h-4 w-4" />
            إضافة مادة جديدة
          </Button>
        </div>
      </div>
      
      {/* فلاتر البحث */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">فلترة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex gap-2 items-center">
              <FiFilter className="text-gray-500" />
              <select
                className="border border-gray-300 rounded-md p-2"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
              >
                {warehouses.map(wh => (
                  <option key={wh} value={wh}>
                    {wh === 'all' ? 'جميع المستودعات' : wh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ملخص المخزون */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المواد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : inventory.length} مادة
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكميات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : inventory.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()} كجم
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المواد منخفضة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : inventory.filter(i => i.quantity <= i.min_quantity).length} مادة
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* جدول المخزون */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">المادة</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">آخر تحديث</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">جاري تحميل البيانات...</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.quantity, item.min_quantity, item.max_quantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.warehouse.name}</TableCell>
                      <TableCell className="text-center">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(item.last_update)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <FiEdit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              
              {!loading && filteredItems.length === 0 && (
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

export default FallbackInventory; 