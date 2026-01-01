'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { FiEye, FiRefreshCw, FiPackage } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import inventoryService from '@/domains/warehouse-management/services/inventoryService';
import { useToast } from '@/shared/ui/use-toast';

interface InventoryItem {
  id: number;
  warehouse_id: number;
  product_id: string | null;
  quantity: number;
  unit: string | null;
  last_updated: string | null;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{warehouseId?: string; productId?: string; from?: string; to?: string}>({});
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // جلب جميع الحركات (إذا كان warehouseId = 0 أو null، نجلب من جميع المخازن)
        const warehouseId = filters.warehouseId ? parseInt(filters.warehouseId) : null;
        let data: any[] = [];
        
        if (warehouseId && warehouseId > 0) {
          data = await inventoryService.getRecentMovements(warehouseId, 100).catch(() => []);
        } else {
          // جلب من جميع المخازن
          const { data: allMovements, error } = await supabase!
            .from('inventory_movements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (!error && allMovements) {
            data = allMovements;
          }
        }
        
        setMovements(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.warehouseId]);

  const checkInventory = async (movement: any) => {
    if (!movement.warehouse_id) {
      toast({
        title: "خطأ",
        description: "لا يوجد معرف مخزن في هذه الحركة",
        variant: "destructive",
      });
      return;
    }

    setSelectedMovement(movement);
    setLoadingInventory(true);
    setShowInventoryDialog(true);

    try {
      // جلب المخزون الحالي للمخزن
      const inventory = await inventoryService.getWarehouseInventory(movement.warehouse_id);
      
      // إذا كان هناك product_id، نركز على هذا المنتج
      if (movement.product_id) {
        const productInventory = inventory.filter(item => item.product_id === movement.product_id);
        setInventoryData(productInventory);
      } else if (movement.catalog_waste_id) {
        // إذا كان هناك catalog_waste_id، نبحث باستخدامه
        const { data: catalogInventory, error } = await supabase!
          .from('warehouse_inventory')
          .select('*')
          .eq('warehouse_id', movement.warehouse_id)
          .eq('catalog_waste_id', movement.catalog_waste_id);
        
        if (!error && catalogInventory) {
          setInventoryData(catalogInventory as InventoryItem[]);
        } else {
          setInventoryData([]);
        }
      } else {
        // عرض جميع المخزون
        setInventoryData(inventory);
      }
    } catch (error: any) {
      console.error('خطأ في جلب المخزون:', error);
      toast({
        title: "خطأ",
        description: `فشل في جلب المخزون: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
      setInventoryData([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  return (
    <DashboardLayout title="حركة المخزون">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>البحث</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input 
              placeholder="معرف المخزن (اتركه فارغاً لعرض الكل)" 
              type="number"
              value={filters.warehouseId || ''} 
              onChange={(e) => setFilters((p) => ({...p, warehouseId: e.target.value}))} 
            />
            <Input 
              placeholder="معرف المنتج (UUID)" 
              value={filters.productId || ''} 
              onChange={(e) => setFilters((p) => ({...p, productId: e.target.value}))} 
            />
            <Input 
              type="date" 
              value={filters.from || ''} 
              onChange={(e) => setFilters((p) => ({...p, from: e.target.value}))} 
            />
            <Input 
              type="date" 
              value={filters.to || ''} 
              onChange={(e) => setFilters((p) => ({...p, to: e.target.value}))} 
            />
            <div className="col-span-full flex justify-end">
              <Button onClick={() => window.location.reload()}>تحديث</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل الحركات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">جاري التحميل...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المخزن</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                        لا توجد حركات مخزون
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>مخزن #{m.warehouse_id}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {m.product_id ? (
                            <span className="text-green-600">{m.product_id.substring(0, 8)}...</span>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              غير محدد
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.movement_type === 'in' ? 'default' : 'destructive'}>
                            {m.movement_type === 'in' ? 'دخول' : m.movement_type === 'out' ? 'خروج' : m.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {m.source_type ? (
                            <Badge variant="outline">
                              {m.source_type === 'waste_receiving' ? 'استلام مخلفات' : m.source_type}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">{m.quantity}</TableCell>
                        <TableCell>{m.unit || '-'}</TableCell>
                        <TableCell>{m.price ? `${m.price} ج.م` : '-'}</TableCell>
                        <TableCell>
                          {m.created_at 
                            ? new Date(m.created_at).toLocaleString('ar-EG', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={m.notes || ''}>
                          {m.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkInventory(m)}
                            title="التحقق من المخزون بعد هذه الحركة"
                          >
                            <FiEye className="h-4 w-4 mr-1" />
                            التحقق
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog للتحقق من المخزون */}
        <CustomDialog
          isOpen={showInventoryDialog}
          onClose={() => {
            setShowInventoryDialog(false);
            setSelectedMovement(null);
            setInventoryData([]);
          }}
          title="التحقق من المخزون"
          description={
            selectedMovement
              ? `المخزون الحالي بعد الحركة في مخزن #${selectedMovement.warehouse_id}`
              : 'المخزون الحالي'
          }
        >
          <div className="space-y-4 p-4">
            {selectedMovement && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">تفاصيل الحركة المحددة</CardTitle>
                </CardHeader>
                  <CardContent className="text-sm space-y-1">
                  <p><strong>النوع:</strong> {selectedMovement.movement_type === 'in' ? 'دخول' : 'خروج'}</p>
                  <p><strong>الكمية:</strong> {selectedMovement.quantity} {selectedMovement.unit || ''}</p>
                  <p><strong>المنتج (waste_data_admin):</strong> {selectedMovement.product_id ? selectedMovement.product_id.substring(0, 8) + '...' : 'غير محدد'}</p>
                  <p><strong>المخلف (catalog_waste):</strong> {selectedMovement.catalog_waste_id ? `#${selectedMovement.catalog_waste_id}` : 'غير محدد'}</p>
                  {selectedMovement.source_id && (
                    <p><strong>waste_no:</strong> {selectedMovement.source_id.split(':')[1] || '-'}</p>
                  )}
                  <p><strong>التاريخ:</strong> {selectedMovement.created_at ? new Date(selectedMovement.created_at).toLocaleString('ar-EG') : '-'}</p>
                </CardContent>
              </Card>
            )}

            {loadingInventory ? (
              <div className="text-center py-6">
                <FiRefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">جاري جلب المخزون...</p>
              </div>
            ) : inventoryData.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FiPackage className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>لا يوجد مخزون مسجل لهذا المنتج في هذا المخزن</p>
                {!selectedMovement?.product_id && !selectedMovement?.catalog_waste_id && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-right">
                    <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ ملاحظة مهمة:</p>
                    <p className="text-xs text-yellow-700">
                      المنتج والمخلف في هذه الحركة غير محددين (product_id = null, catalog_waste_id = null). 
                      هذا يعني أن Trigger لم يتمكن من تحديث المخزون تلقائياً.
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      <strong>الحل:</strong> يجب ربط المخلف ({selectedMovement?.source_id?.split(':')[1] || 'غير معروف'}) 
                      بـ waste_data_admin أو catalog_waste_materials أولاً، ثم إعادة الموافقة على الطلب.
                    </p>
                  </div>
                )}
                {!selectedMovement?.product_id && selectedMovement?.catalog_waste_id && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-right">
                    <p className="text-sm text-green-800 font-semibold mb-2">✅ تم الربط:</p>
                    <p className="text-xs text-green-700">
                      تم ربط الحركة بـ catalog_waste_materials (ID: {selectedMovement.catalog_waste_id}).
                      يجب أن يكون المخزون محدثاً إذا كان Trigger يدعم catalog_waste_id.
                    </p>
                  </div>
                )}
                {selectedMovement?.product_id && (
                  <p className="text-xs mt-2 text-gray-400">
                    قد يكون المنتج غير موجود في المخزون أو لم يتم تحديثه بعد الحركة
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المخزون الحالي</CardTitle>
                    <CardDescription>
                      {selectedMovement?.product_id
                        ? 'المخزون لهذا المنتج المحدد'
                        : 'جميع المنتجات في المخزن'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>الوحدة</TableHead>
                          <TableHead>آخر تحديث</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">
                              {item.product_id ? item.product_id.substring(0, 8) + '...' : 'غير محدد'}
                            </TableCell>
                            <TableCell className="font-semibold text-lg">
                              {item.quantity}
                            </TableCell>
                            <TableCell>{item.unit || '-'}</TableCell>
                            <TableCell>
                              {item.last_updated
                                ? new Date(item.last_updated).toLocaleString('ar-EG', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {selectedMovement?.product_id && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>ملاحظة:</strong> إذا كانت الحركة من نوع "دخول" والمنتج موجود في القائمة أعلاه، 
                      فهذا يعني أن المخزون تم تحديثه بنجاح بواسطة Trigger التلقائي.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CustomDialog>
      </div>
    </DashboardLayout>
  );
}

















