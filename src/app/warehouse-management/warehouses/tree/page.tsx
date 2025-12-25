'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { FiChevronDown, FiChevronRight, FiPackage, FiMapPin, FiUsers, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import warehouseService, { WarehouseTreeNode, WarehouseLevel } from '@/domains/warehouse-management/services/warehouseService';

export default function WarehouseTreePage() {
  const [warehouses, setWarehouses] = useState<WarehouseTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseTreeNode | null>(null);

  useEffect(() => {
    loadWarehouseTree();
  }, []);

  const loadWarehouseTree = async () => {
    setLoading(true);
    try {
      const tree = await warehouseService.getWarehouseTree();
      setWarehouses(tree);
    } catch (error) {
      console.error('خطأ في جلب شجرة المخازن:', error);
      toast.error('حدث خطأ أثناء جلب شجرة المخازن');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseClick = (warehouse: WarehouseTreeNode) => {
    setSelectedWarehouse(warehouse);
  };

  const getLevelIcon = (level: WarehouseLevel) => {
    switch (level) {
      case 'country':
        return <FiPackage className="h-4 w-4 text-blue-600" />;
      case 'city':
        return <FiMapPin className="h-4 w-4 text-green-600" />;
      case 'district':
        return <FiUsers className="h-4 w-4 text-orange-600" />;
      default:
        return <FiInfo className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLevelLabel = (level: WarehouseLevel) => {
    switch (level) {
      case 'country':
        return 'رئيسي';
      case 'city':
        return 'مدينة';
      case 'district':
        return 'منطقة';
      default:
        return 'غير محدد';
    }
  };

  const getLevelColor = (level: WarehouseLevel) => {
    switch (level) {
      case 'country':
        return 'bg-blue-100 text-blue-800';
      case 'city':
        return 'bg-green-100 text-green-800';
      case 'district':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/warehouse-management/warehouses" className="text-gray-600 hover:text-gray-900">
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">شجرة المخازن الهرمية</h1>
              <p className="text-gray-600">عرض الهيكل التنظيمي للمخازن</p>
            </div>
          </div>
          <Button onClick={loadWarehouseTree} disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>

        {/* Tree View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>الهيكل الهرمي للمخازن</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiPackage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد مخازن في النظام</p>
                    <Link href="/warehouse-management/warehouses/new">
                      <Button className="mt-4">إضافة مخزن جديد</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warehouses.map((warehouse) => (
                      <div key={warehouse.id} className="border-l-2 border-gray-200 pl-4 ml-2">
                        <div 
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => handleWarehouseClick(warehouse)}
                        >
                          {getLevelIcon(warehouse.warehouse_level)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{warehouse.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(warehouse.warehouse_level)}`}>
                                {getLevelLabel(warehouse.warehouse_level)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              المسار: {warehouse.hierarchy_path} | العمق: {warehouse.depth}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل المخزن</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedWarehouse ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedWarehouse.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedWarehouse.warehouse_level === 'country' && 'مخزن رئيسي (مستوى الدولة)'}
                        {selectedWarehouse.warehouse_level === 'city' && 'مخزن مدينة'}
                        {selectedWarehouse.warehouse_level === 'district' && 'مخزن منطقة فرعية'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">المعرف:</span>
                        <span className="text-sm font-medium">{selectedWarehouse.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">المسار الهرمي:</span>
                        <span className="text-sm font-medium">{selectedWarehouse.hierarchy_path}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">العمق:</span>
                        <span className="text-sm font-medium">{selectedWarehouse.depth}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Link href={`/warehouse-management/warehouses/${selectedWarehouse.id}`}>
                        <Button className="w-full">عرض التفاصيل</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiInfo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>اختر مخزن لعرض التفاصيل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}