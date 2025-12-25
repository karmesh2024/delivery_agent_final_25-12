import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategoryBucketConfigsThunk, updateCategoryBucketConfigThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Button } from '@/shared/ui/button';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui/table';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { CategoryBasketConfigForm } from './CategoryBasketConfigForm';
import { CategoryBucketConfig, deleteCategoryBucketConfig } from '@/domains/product-categories/api/basketConfigService';

interface CategoryBasketConfigDetailsProps {
  categoryId: string;
}

export const CategoryBasketConfigDetails: React.FC<CategoryBasketConfigDetailsProps> = ({ categoryId }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: categoryBucketConfigs, loading, error } = useAppSelector(state => state.productCategories.categoryBucketConfigs);
  const [isAddConfigDialogOpen, setIsAddConfigDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<CategoryBucketConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<CategoryBucketConfig | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter configurations relevant to the current categoryId
  const filteredConfigs = categoryBucketConfigs.filter(config => config.category_id === categoryId);

  useEffect(() => {
    dispatch(fetchCategoryBucketConfigsThunk());
  }, [dispatch, categoryId]);

  const handleDelete = async () => {
    if (!deleteConfig) return;
    try {
      await deleteCategoryBucketConfig(deleteConfig.id);
      toast({ title: 'تم الحذف', description: 'تم حذف التكوين بنجاح.' });
      dispatch(fetchCategoryBucketConfigsThunk());
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حذف التكوين', variant: 'destructive' });
    }
    setIsDeleteDialogOpen(false);
    setDeleteConfig(null);
  };

  if (loading && filteredConfigs.length === 0) {
    return <div className="flex justify-center items-center min-h-[200px]">جاري تحميل الإعدادات...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-red-500">حدث خطأ: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddConfigDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          إضافة تكوين جديد
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">جاري تحميل الإعدادات...</p>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">لا توجد إعدادات سلة متاحة لهذه الفئة الرئيسية.</p>
          <Button onClick={() => setIsAddConfigDialogOpen(true)} className="mt-4">
            إضافة تكوين سلة الآن
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نوع المورد</TableHead>
              <TableHead className="text-right">حجم السلة</TableHead>
              <TableHead className="text-right">الوزن الفارغ (كجم)</TableHead>
              <TableHead className="text-right">الحد الأقصى للوزن الصافي (كجم)</TableHead>
              <TableHead className="text-right">الحد الأقصى للحجم (لتر)</TableHead>
              <TableHead className="text-right">الحد الأدنى للتعبئة (%)</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConfigs.map((config: CategoryBucketConfig) => (
              <TableRow key={config.id}>
                <TableCell>{config.supplier_type}</TableCell>
                <TableCell>{config.basket_size}</TableCell>
                <TableCell>{config.basket_empty_weight_kg}</TableCell>
                <TableCell>{config.max_net_weight_kg}</TableCell>
                <TableCell>{config.max_volume_liters ?? '-'}</TableCell>
                <TableCell>{config.min_fill_percentage}</TableCell>
                <TableCell>{config.description ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditConfig(config)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => { setDeleteConfig(config); setIsDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <UniversalDialog
        isOpen={isAddConfigDialogOpen}
        onClose={() => setIsAddConfigDialogOpen(false)}
        title="إضافة إعدادات سلة جديدة"
        description="أدخل معلومات إعدادات السلة الجديدة للفئة الرئيسية."
      >
        <CategoryBasketConfigForm
          categoryId={categoryId}
          onClose={() => setIsAddConfigDialogOpen(false)}
        />
      </UniversalDialog>

      <UniversalDialog
        isOpen={!!editConfig}
        onClose={() => setEditConfig(null)}
        title="تعديل إعدادات السلة"
        description="يمكنك تعديل بيانات التكوين ثم الحفظ."
      >
        {editConfig && (
          <CategoryBasketConfigForm
            categoryId={categoryId}
            onClose={() => setEditConfig(null)}
            initialConfig={editConfig}
            isEdit={true}
          />
        )}
      </UniversalDialog>

      <UniversalDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="تأكيد الحذف"
        description="هل أنت متأكد أنك تريد حذف هذا التكوين؟ لا يمكن التراجع عن هذه العملية."
      >
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleDelete}>تأكيد الحذف</Button>
        </div>
      </UniversalDialog>
    </div>
  );
}; 