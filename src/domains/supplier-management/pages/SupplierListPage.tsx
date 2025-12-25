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
import { useAppDispatch, useAppSelector } from '@/store/index';
import { fetchSuppliers, deleteSupplier } from '../store/supplierSlice';
import { Supplier } from '../types';
import { useRouter } from 'next/navigation';

const SupplierListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { suppliers, loading, error } = useAppSelector((state) => state.supplier);
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);
  
  const statuses = ['all', 'active', 'inactive'];
  
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.includes(searchTerm) || 
                          (supplier.contact_phone?.includes(searchTerm) || false) || 
                          (supplier.email?.includes(searchTerm) || false);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? supplier.is_active : !supplier.is_active);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusInfo = (isActive: boolean) => {
    return isActive ? { label: 'نشط', class: 'bg-green-100 text-green-800' } : { label: 'غير نشط', class: 'bg-red-100 text-red-800' };
  };

  const handleAddSupplier = () => {
    router.push('/supplier-management/suppliers/add');
  };

  const handleEditSupplier = (supplierId: string) => {
    router.push(`/supplier-management/suppliers/edit/${supplierId}`);
    router.refresh();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة الموردين</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              dispatch(fetchSuppliers());
            }}
          >
            <FiRefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddSupplier}>
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
                     'غير نشط'}
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
              {loading ? '...' : suppliers.filter(s => s.is_active).length} مورد
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الموردون غير النشطين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : suppliers.filter(s => !s.is_active).length} مورد
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
                <TableHead>كود المورد</TableHead>
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
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-500">حدث خطأ: {error}</TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">لا توجد بيانات موردين لعرضها.</TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const statusInfo = getStatusInfo(supplier.is_active);
                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.supplier_code || 'N/A'}</TableCell>
                      <TableCell>{supplier.contact_phone || 'N/A'}</TableCell>
                      <TableCell>{supplier.email || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(supplier.created_at || '')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <button 
                            className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => handleEditSupplier(supplier.id.toString())}
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف المورد ${supplier.name}?`)) {
                                dispatch(deleteSupplier(supplier.id));
                              }
                            }}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierListPage; 