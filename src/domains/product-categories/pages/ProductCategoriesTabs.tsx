'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, fetchCategoryBucketConfigsThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui/table';
import { Category } from '@/types';
import Link from 'next/link';
import { VisibilitySelect } from '@/domains/product-categories/components/VisibilitySelect';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { useToast } from '@/shared/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SubCategoriesListPage } from '@/domains/product-categories/pages/SubCategoriesListPage';
import { OperationalProductsPage } from '@/domains/product-categories/pages/OperationalProductsPage';
import { Layers, ListTree, Package } from 'lucide-react';

export const ProductCategoriesTabs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: categories, loading, error } = useAppSelector(state => state.productCategories.categories);
  const [selectedCategoryIdForSub, setSelectedCategoryIdForSub] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('main');

  const handleVisibilityChange = async (
    categoryId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) => {
    try {
      const { error: err } = await categoryService.updateCategoryVisibility(categoryId, visibility);
      if (err) throw new Error(err);
      toast({ title: 'تم بنجاح', description: 'تم تحديث إعدادات الظهور' });
      dispatch(fetchCategories());
    } catch (e) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل تحديث الظهور', variant: 'destructive' });
    }
  };

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchCategoryBucketConfigsThunk());
  }, [dispatch]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">حدث خطأ: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="main" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            الفئات الرئيسية
          </TabsTrigger>
          <TabsTrigger value="sub" className="flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            الفئات الفرعية
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            جميع المنتجات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">الفئات الرئيسية</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/general-management/organization-structure">
                    التعديل من إدارة التنظيم والتسلسل
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <div className="px-6 py-2 text-sm text-amber-800 bg-amber-50 border-b border-amber-200" role="alert">
              <strong>التحكم في الظهور</strong> (عميل / وكيل) يتم من هذه الصفحة. الإضافة والحذف وإعادة الترتيب من{' '}
              <Link href="/general-management/organization-structure" className="font-medium underline">
                إدارة التنظيم والتسلسل
              </Link>
              .
            </div>
            <CardContent>
              {loading && categories.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">جاري تحميل الفئات...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">لا توجد فئات متاحة حالياً.</p>
                  <Button variant="outline" asChild className="mt-4">
                    <Link href="/general-management/organization-structure">إضافة فئة من إدارة التنظيم والتسلسل</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">الصورة</TableHead>
                      <TableHead className="text-right">الظهور</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: Category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          {category.image_url ? (
                            <img src={category.image_url} alt={category.name} className="w-12 h-12 object-cover rounded-md" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <VisibilitySelect
                            visibleToClientApp={category.visible_to_client_app ?? false}
                            visibleToAgentApp={category.visible_to_agent_app ?? false}
                            onVisibilityChange={(v) => handleVisibilityChange(category.id, v)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCategoryIdForSub(category.id);
                                setActiveTab('sub');
                              }}
                            >
                              الفئات الفرعية
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.assign(`/product-categories/basket-config-category/${category.id}`)}
                            >
                              إعدادات السلة
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
        </TabsContent>

        <TabsContent value="sub" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">الفئات الفرعية</CardTitle>
              <p className="text-sm text-muted-foreground">
                اختر الفئة الرئيسية لعرض وتحرير الفئات الفرعية التابعة لها.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">الفئة الرئيسية</label>
                <select
                  className="w-full max-w-md rounded-md border px-3 py-2"
                  value={selectedCategoryIdForSub}
                  onChange={(e) => setSelectedCategoryIdForSub(e.target.value)}
                >
                  <option value="">— اختر الفئة الرئيسية —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedCategoryIdForSub ? (
                <SubCategoriesListPage
                  categoryId={selectedCategoryIdForSub}
                  viewOnly
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  اختر فئة رئيسية من القائمة أعلاه لعرض الفئات الفرعية.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <OperationalProductsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

