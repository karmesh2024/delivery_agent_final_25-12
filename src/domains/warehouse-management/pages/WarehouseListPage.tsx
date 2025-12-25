'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWarehouses, deleteWarehouse } from '../store/warehouseSlice';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Pencil, Trash2, Plus, BarChart3, Package, TreePine, Eye } from 'lucide-react';
import { UniversalDialog } from '@/shared/components/ui/universal-dialog';
import { toast } from 'react-toastify';

const WarehouseListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { warehouses, loading, error } = useAppSelector((state) => state.warehouse);
  // خريطة محافظات مصر لعرض الاسم من خلال region_id
  const egyptGovernorates: Array<{ id: number; name: string }> = [
    { id: 1, name: 'القاهرة' },
    { id: 2, name: 'الجيزة' },
    { id: 3, name: 'الإسكندرية' },
    { id: 4, name: 'الدقهلية' },
    { id: 5, name: 'الشرقية' },
    { id: 6, name: 'القليوبية' },
    { id: 7, name: 'كفر الشيخ' },
    { id: 8, name: 'الغربية' },
    { id: 9, name: 'المنوفية' },
    { id: 10, name: 'البحيرة' },
    { id: 11, name: 'بورسعيد' },
    { id: 12, name: 'الإسماعيلية' },
    { id: 13, name: 'السويس' },
    { id: 14, name: 'دمياط' },
    { id: 15, name: 'الفيوم' },
    { id: 16, name: 'بني سويف' },
    { id: 17, name: 'المنيا' },
    { id: 18, name: 'أسيوط' },
    { id: 19, name: 'سوهاج' },
    { id: 20, name: 'قنا' },
    { id: 21, name: 'الأقصر' },
    { id: 22, name: 'أسوان' },
    { id: 23, name: 'البحر الأحمر' },
    { id: 24, name: 'الوادي الجديد' },
    { id: 25, name: 'مطروح' },
    { id: 26, name: 'شمال سيناء' },
    { id: 27, name: 'جنوب سيناء' },
  ];

  const getRegionNameById = (id?: number | null) => {
    if (!id) return '';
    return egyptGovernorates.find(g => g.id === id)?.name || '';
  };

  const getHierarchyLevelLabel = (level?: string) => {
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

  const getHierarchyLevelColor = (level?: string) => {
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleEdit = (id: number) => {
    router.push(`/warehouse-management/warehouses/${id}`);
  };

  const handleDelete = (id: number) => {
    setWarehouseToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (warehouseToDelete) {
      try {
        await dispatch(deleteWarehouse(warehouseToDelete)).unwrap();
        toast.success('تم حذف المخزن بنجاح');
        setIsDeleteDialogOpen(false);
      } catch (error) {
        toast.error('فشل في حذف المخزن');
      }
    }
  };

  const handleViewInventory = (id: number) => {
    router.push(`/warehouse-management/warehouses/${id}/inventory`);
  };

  if (loading && warehouses.length === 0) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المخازن</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/warehouse-management/warehouses/tree')}
          >
            <TreePine className="ml-2" size={16} />
            عرض الشجرة الهرمية
          </Button>
          <Button onClick={() => router.push('/dashboard/warehouses/new')}>
            <Plus className="ml-2" size={16} />
            إضافة مخزن جديد
          </Button>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">لا توجد مخازن مسجلة. قم بإضافة مخزن جديد.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>اسم المخزن</TableHead>
                <TableHead>المستوى الهرمي</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>المنطقة</TableHead>
                <TableHead>السعة</TableHead>
                <TableHead>المخزون الحالي</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse, index) => (
                <TableRow key={warehouse.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHierarchyLevelColor((warehouse as any).warehouse_level)}`}>
                      {getHierarchyLevelLabel((warehouse as any).warehouse_level)}
                    </span>
                  </TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>{getRegionNameById((warehouse as any).region_id)}</TableCell>
                  <TableCell>{warehouse.capacity}</TableCell>
                  <TableCell>{warehouse.current_stock}</TableCell>
                  <TableCell className="space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/warehouse-management/warehouses/${warehouse.id}`)}
                    >
                      <Eye className="ml-1" size={14} />
                      عرض
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInventory(warehouse.id)}
                    >
                      <Package className="ml-1" size={14} />
                      المخزون
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(warehouse.id)}
                    >
                      <Pencil className="ml-1" size={14} />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(warehouse.id)}
                    >
                      <Trash2 className="ml-1" size={14} />
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UniversalDialog
        isOpen={isDeleteDialogOpen}
        title="تأكيد الحذف"
        description="هل أنت متأكد من رغبتك في حذف هذا المخزن؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default WarehouseListPage; 