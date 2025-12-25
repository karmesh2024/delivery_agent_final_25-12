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
import { FiSearch, FiRefreshCw, FiFilter, FiEye, FiCheck, FiX, FiPlus } from "react-icons/fi";

// بيانات احتياطية للعرض
const DUMMY_DATA = [
  { 
    id: '1', 
    supplier: { name: 'شركة التدوير الأولى' },
    materialType: 'الألومنيوم',
    price_per_unit: 850,
    unit: 'طن',
    quantity: 20,
    total_price: 17000,
    status: 'pending',
    validity_period: 15,
    created_at: '2023-11-15T10:30:00'
  },
  { 
    id: '2', 
    supplier: { name: 'مؤسسة المعادن المتحدة' },
    materialType: 'النحاس',
    price_per_unit: 1200,
    unit: 'طن',
    quantity: 15,
    total_price: 18000,
    status: 'approved',
    validity_period: 10,
    created_at: '2023-11-12T14:45:00'
  },
  { 
    id: '3', 
    supplier: { name: 'مصنع الشرق للتدوير' },
    materialType: 'البلاستيك',
    price_per_unit: 600,
    unit: 'طن',
    quantity: 30,
    total_price: 18000,
    status: 'rejected',
    validity_period: 7,
    created_at: '2023-11-10T09:15:00'
  }
];

const FallbackPriceOffers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState(DUMMY_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    // محاكاة التحميل
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const statuses = ['all', 'pending', 'approved', 'rejected'];
  
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.supplier.name.includes(searchTerm) || 
                         offer.materialType.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد المراجعة', class: 'bg-amber-100 text-amber-800' };
      case 'approved':
        return { label: 'تمت الموافقة', class: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { label: 'مرفوض', class: 'bg-red-100 text-red-800' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <p className="text-amber-700">
          ملاحظة: يتم عرض نسخة احتياطية من عروض الأسعار حالياً. بعض الوظائف قد لا تعمل.
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">عروض الأسعار من الموردين</h1>
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
            إضافة عرض جديد
          </Button>
        </div>
      </div>
      
      {/* فلاتر البحث */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">فلترة العروض</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="بحث عن مورد أو مادة..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <FiFilter className="text-gray-500" />
              <select
                className="border border-gray-300 rounded-md p-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'جميع الحالات' : 
                     status === 'pending' ? 'قيد المراجعة' :
                     status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ملخص العروض */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العروض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : offers.length} عرض
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">العروض قيد المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : offers.filter(o => o.status === 'pending').length} عرض
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية للعروض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : offers.reduce((sum, o) => sum + o.total_price, 0).toLocaleString()} ريال
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* جدول العروض */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">اسم المورد</TableHead>
                <TableHead>نوع المادة</TableHead>
                <TableHead className="text-center">السعر/الوحدة</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-center">الإجمالي</TableHead>
                <TableHead className="text-center">صلاحية العرض</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">جاري تحميل البيانات...</TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => {
                  const status = getStatusInfo(offer.status);
                  return (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.supplier.name}</TableCell>
                      <TableCell>{offer.materialType}</TableCell>
                      <TableCell className="text-center">{offer.price_per_unit.toLocaleString()} ريال/{offer.unit}</TableCell>
                      <TableCell className="text-center">{offer.quantity} {offer.unit}</TableCell>
                      <TableCell className="text-center font-bold">{offer.total_price.toLocaleString()} ريال</TableCell>
                      <TableCell className="text-center">{offer.validity_period} يوم</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(offer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <FiEye className="h-4 w-4" />
                          </Button>
                          {offer.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm" className="text-green-600">
                                <FiCheck className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <FiX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              
              {!loading && filteredOffers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">لا توجد نتائج للبحث</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FallbackPriceOffers; 