"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSubCategoryBucketConfigsThunk, addSubCategoryBucketConfigThunk, fetchCategoryBucketConfigsThunk, updateSubCategoryBucketConfigThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PlusIcon, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui/table';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { AddBasketConfigForm } from '@/domains/product-categories/components/AddBasketConfigForm';
import { useParams, useRouter } from 'next/navigation';
import { SubCategoryBucketConfig } from '@/domains/product-categories/api/basketConfigService';
import { getSubcategoryById, getCategoryNameById } from '@/domains/product-categories/api/basketConfigService';
import { getDistinctSupplierTypes, getDistinctBasketSizes, basket_supplier_type, basket_size } from '@/domains/product-categories/api/basketConfigService';
import { deleteSubCategoryBucketConfig } from '@/domains/product-categories/api/basketConfigService';

const SubCategoryBasketConfigPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const subcategoryId = params.subcategoryId as string;

  const { data: subCategoryBucketConfigs, loading, error } = useAppSelector(state => state.productCategories.subCategoryBucketConfigs);
  const { data: allCategoryBucketConfigs } = useAppSelector(state => state.productCategories.categoryBucketConfigs);
  const [isAddConfigDialogOpen, setIsAddConfigDialogOpen] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [parentCategoryName, setParentCategoryName] = useState<string | null>(null);
  const [distinctSupplierTypes, setDistinctSupplierTypes] = useState<basket_supplier_type[]>([]);
  const [distinctBasketSizes, setDistinctBasketSizes] = useState<basket_size[]>([]);
  const [editConfig, setEditConfig] = useState<SubCategoryBucketConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<SubCategoryBucketConfig | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  console.log("Page.tsx: allCategoryBucketConfigs from Redux (detailed)", JSON.stringify(allCategoryBucketConfigs, null, 2));

  useEffect(() => {
    // Fetch all category bucket configs initially when the page mounts
    dispatch(fetchCategoryBucketConfigsThunk());
  }, [dispatch]);

  useEffect(() => {
    // Fetch distinct supplier types and basket sizes once when the component mounts
    const fetchDistinctValues = async () => {
      try {
        const fetchedSupplierTypes = await getDistinctSupplierTypes();
        setDistinctSupplierTypes(fetchedSupplierTypes);

        const fetchedBasketSizes = await getDistinctBasketSizes();
        setDistinctBasketSizes(fetchedBasketSizes);
      } catch (err) {
        toast({
          title: "خطأ",
          description: "فشل في جلب أنواع الموردين أو أحجام السلات المتاحة للصفحة.",
          variant: "destructive",
        });
      }
    };
    fetchDistinctValues();
  }, []);

  useEffect(() => {
    if (subcategoryId) {
      dispatch(fetchSubCategoryBucketConfigsThunk(subcategoryId));
      const fetchCategoryDetails = async () => {
        try {
          const subcategory = await getSubcategoryById(subcategoryId);
          if (subcategory && subcategory.category_id) {
            setParentCategoryId(subcategory.category_id);
            const categoryName = await getCategoryNameById(subcategory.category_id);
            setParentCategoryName(categoryName);
          }
        } catch (err) {
          toast({
            title: "خطأ",
            description: "فشل في جلب تفاصيل الفئة الأساسية.",
            variant: "destructive",
          });
        }
      };
      fetchCategoryDetails();
    }
  }, [dispatch, subcategoryId]);

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: `فشل في جلب إعدادات سلة الفئات الفرعية: ${error}`,
        variant: "destructive",
      });
    }
  }, [dispatch, subcategoryId, error, toast]);

  const handleBackToSubCategories = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">حدث خطأ: {error}</div>
      </div>
    );
  }

  const handleConfigSubmitted = () => {
    dispatch(fetchCategoryBucketConfigsThunk());
    setIsAddConfigDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    try {
      await deleteSubCategoryBucketConfig(deleteConfig.id);
      toast({ title: 'تم الحذف', description: 'تم حذف التكوين بنجاح.' });
      dispatch(fetchSubCategoryBucketConfigsThunk(subcategoryId));
      dispatch(fetchCategoryBucketConfigsThunk());
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حذف التكوين', variant: 'destructive' });
    }
    setIsDeleteDialogOpen(false);
    setDeleteConfig(null);
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="mb-2"
              onClick={handleBackToSubCategories}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للفئات الفرعية
            </Button>
            <CardTitle className="text-2xl">
              إعدادات سلة الفئة الفرعية
            </CardTitle>
          </div>
          <Button onClick={() => setIsAddConfigDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة تكوين جديد
          </Button>
        </CardHeader>
        <CardContent>
          {loading && subCategoryBucketConfigs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">جاري تحميل الإعدادات...</p>
            </div>
          ) : subCategoryBucketConfigs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد إعدادات سلة متاحة لهذه الفئة الفرعية</p>
              <Button onClick={() => setIsAddConfigDialogOpen(true)} className="mt-4">
                إضافة تكوين سلة الآن
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الوزن الفارغ للسلة (كجم)</TableHead>
                  <TableHead className="text-right">الحد الأقصى للوزن الصافي (كجم)</TableHead>
                  <TableHead className="text-right">الحد الأقصى للحجم (لتر)</TableHead>
                  <TableHead className="text-right">الحد الأدنى لنسبة التعبئة (%)</TableHead>
                  <TableHead className="text-right">يتطلب فصل</TableHead>
                  <TableHead className="text-right">ملاحظات خاصة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">تاريخ التحديث</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subCategoryBucketConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>{config.basket_empty_weight_kg}</TableCell>
                    <TableCell>{config.max_net_weight_kg}</TableCell>
                    <TableCell>{config.max_volume_liters}</TableCell>
                    <TableCell>{config.min_fill_percentage}</TableCell>
                    <TableCell>{config.requires_separation ? 'نعم' : 'لا'}</TableCell>
                    <TableCell>{config.special_handling_notes || '-'}</TableCell>
                    <TableCell>{new Date(config.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(config.updated_at).toLocaleDateString()}</TableCell>
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
        </CardContent>
      </Card>

      <UniversalDialog
        isOpen={isAddConfigDialogOpen}
        onClose={() => setIsAddConfigDialogOpen(false)}
        title="إضافة إعدادات سلة جديدة"
        description="أدخل معلومات إعدادات السلة الجديدة للفئة الفرعية."
      >
        <AddBasketConfigForm
          subcategoryId={subcategoryId}
          parentCategoryId={parentCategoryId}
          parentCategoryName={parentCategoryName}
          allCategoryBucketConfigs={allCategoryBucketConfigs}
          distinctSupplierTypes={distinctSupplierTypes}
          distinctBasketSizes={distinctBasketSizes}
          onClose={() => setIsAddConfigDialogOpen(false)}
          onConfigSubmitted={handleConfigSubmitted}
        />
      </UniversalDialog>

      <UniversalDialog
        isOpen={!!editConfig}
        onClose={() => setEditConfig(null)}
        title="تعديل إعدادات السلة الفرعية"
        description="يمكنك تعديل بيانات التكوين ثم الحفظ."
      >
        {editConfig && (
          <AddBasketConfigForm
            subcategoryId={subcategoryId}
            parentCategoryId={parentCategoryId}
            parentCategoryName={parentCategoryName}
            allCategoryBucketConfigs={allCategoryBucketConfigs}
            distinctSupplierTypes={distinctSupplierTypes}
            distinctBasketSizes={distinctBasketSizes}
            onClose={() => setEditConfig(null)}
            onConfigSubmitted={handleConfigSubmitted}
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

export default SubCategoryBasketConfigPage; 