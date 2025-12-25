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
    id: 's1', 
    name: 'شركة الأمل للتجارة', 
    contact_person: 'أحمد محمود',
    phone_number: '0501234567',
    email: 'ahmed@alamal.com',
    address: 'الرياض، حي النرجس',
    status: 'active',
    joined_date: '2022-01-15T09:00:00'
  },
  { 
    id: 's2', 
    name: 'مؤسسة النور للمواد', 
    contact_person: 'فاطمة علي',
    phone_number: '0551234567',
    email: 'fatima@alnoor.com',
    address: 'جدة، حي السلامة',
    status: 'pending',
    joined_date: '2023-03-20T11:30:00'
  },
  { 
    id: 's3', 
    name: 'مصنع الإبداع الصناعي', 
    contact_person: 'خالد فهد',
    phone_number: '0567890123',
    email: 'khalid@alibda.com',
    address: 'الدمام، المنطقة الصناعية',
    status: 'inactive',
    joined_date: '2021-06-10T14:00:00'
  }
];

const FallbackSuppliers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState(DUMMY_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    // محاكاة التحميل
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const statuses = ['all', 'active', 'inactive', 'pending'];
  
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.includes(searchTerm) || 
                          supplier.contact_person.includes(searchTerm) ||
                          supplier.phone_number.includes(searchTerm) ||
                          supplier.email.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
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
      case 'active':
        return { label: 'نشط', class: 'bg-green-100 text-green-800' };
      case 'inactive':
        return { label: 'غير نشط', class: 'bg-red-100 text-red-800' };
      case 'pending':
        return { label: 'قيد الانتظار', class: 'bg-amber-100 text-amber-800' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <p className="text-amber-700">
          ملاحظة: يتم عرض نسخة احتياطية من إدارة الموردين حالياً. بعض الوظائف قد لا تعمل.
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة الموردين</h1>
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
            إضافة مورد جديد
          </Button>
        </div>
      </div>
      
      {/* فلاتر البحث */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">فلترة الموردين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="بحث عن مورد، شخص اتصال، رقم هاتف، أو بريد إلكتروني..."
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
                     status === 'active' ? 'نشط' :
                     status === 'inactive' ? 'غير نشط' : 'قيد الانتظار'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ملخص الموردين */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : suppliers.length} مورد
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الموردون النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : suppliers.filter(s => s.status === 'active').length} مورد
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الموردون قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : suppliers.filter(s => s.status === 'pending').length} مورد
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* جدول الموردين */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">اسم المورد</TableHead>
                <TableHead>شخص الاتصال</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">تاريخ الانضمام</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">جاري تحميل البيانات...</TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const statusInfo = getStatusInfo(supplier.status);
                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person}</TableCell>
                      <TableCell>{supplier.phone_number}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(supplier.joined_date)}
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
              
              {!loading && filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">لا توجد نتائج للبحث</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FallbackSuppliers; 