'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Prisma } from '@prisma/client';
import { SchemaBuilder, Field } from '@/domains/products/components/SchemaBuilder';
import { TargetAudience, TargetAudienceFormData, ProductType as ProductTypeInterface } from '@/domains/products/types/types';
import TargetAudienceForm from '@/domains/target-audiences/components/TargetAudienceForm';
import CategoryManagementForm from '@/domains/products/components/CategoryManagementForm';
import { toast } from '@/shared/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { ProductType } from '@/domains/products/types/types';
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProductTypeForForm extends Omit<ProductType, 'schema_template'> {
  schema_template: Prisma.JsonObject | null;
}

interface Store {
  id: string;
  name_ar: string;
  name_en: string | null;
  // Add other store properties as needed
}

export default function ProductSettingsPage() {
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams?.get('storeId') || null;

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(storeIdFromUrl);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductTypeDialogOpen, setIsAddProductTypeDialogOpen] = useState<boolean>(false);
  const [isAddTargetAudienceDialogOpen, setIsAddTargetAudienceDialogOpen] = useState<boolean>(false);
  const [editingTargetAudience, setEditingTargetAudience] = useState<TargetAudience | null>(null);
  const [editingProductType, setEditingProductType] = useState<ProductTypeForForm | null>(null);

  const [newProductType, setNewProductType] = useState<ProductTypeForForm>({
    id: '',
    name_ar: '',
    name_en: '',
    is_active: true,
    store_id: '',
    schema_template: null,
  });

  const [selectedStoreName, setSelectedStoreName] = useState<string>('');

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Store[] = await response.json();
      setStores(data);

      if (storeIdFromUrl) {
        const currentStore = data.find(store => store.id === storeIdFromUrl);
        if (currentStore) {
          setSelectedStoreName(currentStore.name_ar || currentStore.name_en || 'متجر غير معروف');
        } else {
          setSelectedStoreName('متجر غير معروف (غير موجود)');
        }
      } else if (data.length > 0) {
        setSelectedShopId(data[0].id);
        setSelectedStoreName(data[0].name_ar || data[0].name_en || 'متجر غير معروف');
      }
    } catch (err: unknown) {
      console.error("Failed to fetch stores:", err);
      toast({
        title: "خطأ",
        description: "فشل جلب المتاجر.",
        variant: "destructive",
      });
      setError((err as Error).message);
    }
  };

  const fetchProductTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedShopId) {
        setProductTypes([]);
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/product-types?shop_id=${selectedShopId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ProductType[] = await response.json();
      setProductTypes(data);
    } catch (err: unknown) {
      setError((err as Error).message);
      toast({
        title: "خطأ",
        description: "فشل جلب أنواع المنتجات.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedShopId]);

  const fetchTargetAudiences = useCallback(async (shopId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/target-audiences?shop_id=${shopId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TargetAudience[] = await response.json();
      setTargetAudiences(data);
    } catch (err: unknown) {
      setError((err as Error).message);
      toast({
        title: "خطأ",
        description: "فشل جلب الجمهور المستهدف.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedShopId]);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedShopId) {
      fetchProductTypes();
      fetchTargetAudiences(selectedShopId);
    }
  }, [selectedShopId, fetchProductTypes, fetchTargetAudiences]);

  const handleSchemaChange = useCallback((schema: Prisma.JsonObject | null) => {
    setNewProductType(prev => ({ ...prev, schema_template: schema }));
  }, []);

  const handleAddProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProductType ? 'PUT' : 'POST';
      const url = editingProductType ? `/api/product-types?id=${editingProductType.id}` : '/api/product-types';

      const payload = {
        ...newProductType,
        shop_id: selectedShopId,
        is_active: newProductType.is_active ?? true,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: "نجاح",
        description: `تم ${editingProductType ? 'تعديل' : 'إضافة'} نوع المنتج بنجاح.`,
      });
      setNewProductType({ id: '', name_ar: '', name_en: '', is_active: true, store_id: '', schema_template: null });
      setIsAddProductTypeDialogOpen(false);
      setEditingProductType(null);
      fetchProductTypes();
    } catch (err: unknown) {
      console.error('Failed to add product type:', err);
      toast({
        title: "خطأ",
        description: `فشل في ${editingProductType ? 'تعديل' : 'إضافة'} نوع المنتج: ${(err as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveTargetAudience = async (data: TargetAudienceFormData) => {
    try {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/api/target-audiences?id=${data.id}` : '/api/target-audiences';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, shop_id: selectedShopId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: "نجاح",
        description: `تم ${data.id ? 'تحديث' : 'إضافة'} الجمهور المستهدف بنجاح.`, 
      });
      setIsAddTargetAudienceDialogOpen(false);
      setEditingTargetAudience(null);
      if (selectedShopId) {
        fetchTargetAudiences(selectedShopId);
      }
    } catch (err: unknown) {
      console.error('Failed to save target audience:', err);
      toast({
        title: "خطأ",
        description: `فشل في ${data.id ? 'تحديث' : 'إضافة'} الجمهور المستهدف: ${(err as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTargetAudience = async (id: string) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا الجمهور المستهدف؟')) {
      try {
        const response = await fetch(`/api/target-audiences?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        toast({
          title: "نجاح",
          description: "تم حذف الجمهور المستهدف بنجاح.",
        });
        if (selectedShopId) {
          fetchTargetAudiences(selectedShopId);
        }
      } catch (err: unknown) {
        console.error('Failed to delete target audience:', err);
        toast({
          title: "خطأ",
          description: `فشل في حذف الجمهور المستهدف: ${(err as Error).message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditTargetAudience = (audience: TargetAudience) => {
    setEditingTargetAudience(audience);
    setIsAddTargetAudienceDialogOpen(true);
  };

  const handleEditProductType = (type: ProductTypeForForm) => {
    setEditingProductType(type);
    setNewProductType({
      id: type.id,
      name_ar: type.name_ar,
      name_en: type.name_en ?? '',
      is_active: type.is_active ?? true,
      store_id: type.store_id,
      schema_template: type.schema_template || null,
    });
    setIsAddProductTypeDialogOpen(true);
  };

  const handleDeleteProductType = async (id: string) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا النوع؟')) {
      try {
        const response = await fetch(`/api/product-types?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        toast({
          title: "نجاح",
          description: "تم حذف النوع بنجاح.",
        });
        if (selectedShopId) {
          fetchProductTypes();
        }
      } catch (err: unknown) {
        console.error('Failed to delete product type:', err);
        toast({
          title: "خطأ",
          description: `فشل في حذف النوع: ${(err as Error).message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSelectedShopChange = (value: string) => {
    setSelectedShopId(value);
    const selected = stores.find(store => store.id === value);
    setSelectedStoreName(selected?.name_ar || selected?.name_en || 'متجر غير معروف');
  };

  return (
    <div className="container mx-auto py-10">
      <Link href="/store-management" className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800">
        <FaArrowLeft className="mr-2" /> العودة إلى إدارة المتاجر الإلكترونية
      </Link>
      <h1 className="text-3xl font-bold mb-6">إعدادات المنتجات للمتجر: {selectedStoreName}</h1>

      <Tabs defaultValue="product-types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="product-types">إدارة أنواع المنتجات</TabsTrigger>
          <TabsTrigger value="target-audiences">إدارة الجمهور المستهدف</TabsTrigger>
          <TabsTrigger value="categories">إدارة الفئات</TabsTrigger>
        </TabsList>

        <TabsContent value="product-types" className="mt-4">
          {loading && <p>جاري تحميل أنواع المنتجات...</p>}
          {error && <p className="text-red-500">خطأ: {error}</p>}
          {(!loading && !error && productTypes.length === 0 && selectedShopId) && (
            <p className="text-center text-muted-foreground">لا توجد أنواع منتجات لعرضها. يرجى إضافة نوع جديد.</p>
          )}
          {/* Product Type Management Table */}
          <div className="mt-6">
            <Button onClick={() => setIsAddProductTypeDialogOpen(true)} className="mb-4" disabled={isAddProductTypeDialogOpen}>إضافة نوع منتج جديد</Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم (عربي)</TableHead>
                  <TableHead>الاسم (انجليزي)</TableHead>
                  <TableHead>السمات الديناميكية (Schema)</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name_ar}</TableCell>
                    <TableCell>{type.name_en}</TableCell>
                    <TableCell className="font-mono text-sm">{JSON.stringify(type.schema_template, null, 2)}</TableCell>
                    <TableCell>{type.is_active ? 'نشط' : 'غير نشط'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditProductType(type)} className="mr-2">تعديل</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProductType(type.id)}>حذف</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <CustomDialog
            isOpen={isAddProductTypeDialogOpen}
            onClose={() => {
              setIsAddProductTypeDialogOpen(false);
              setEditingProductType(null);
              setNewProductType({ id: '', name_ar: '', name_en: '', is_active: true, store_id: '', schema_template: null });
            }}
            title={editingProductType ? "تعديل نوع المنتج" : "إضافة نوع منتج جديد"}
            description={editingProductType ? "قم بتعديل اسم نوع المنتج والقالب السمة الديناميكي." : "حدد اسم نوع المنتج وقم ببناء القالب السمة الديناميكي."}
            footer={
              <DialogFooter>
                <Button type="button" onClick={handleAddProductType}>{editingProductType ? 'تعديل' : 'إضافة'}</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddProductTypeDialogOpen(false)}>إلغاء</Button>
              </DialogFooter>
            }
          >
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              <form onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }} className="space-y-4">
                <div>
                  <Label htmlFor="product-type-name-ar">الاسم (عربي)</Label>
                  <Input
                    id="product-type-name-ar"
                    name="name_ar"
                    value={newProductType.name_ar}
                    onChange={(e) => setNewProductType(prev => ({ ...prev, name_ar: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-type-name-en">الاسم (انجليزي)</Label>
                  <Input
                    id="product-type-name-en"
                    name="name_en"
                    value={newProductType.name_en || ''}
                    onChange={(e) => setNewProductType(prev => ({ ...prev, name_en: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>قالب السمة الديناميكي</Label>
                  <SchemaBuilder
                    initialSchema={newProductType.schema_template}
                    onChange={handleSchemaChange}
                  />
                </div>
              </form>
            </div>
          </CustomDialog>
        </TabsContent>

        <TabsContent value="target-audiences" className="mt-4">
          {loading && <p>جاري تحميل الجمهور المستهدف...</p>}
          {error && <p className="text-red-500">خطأ: {error}</p>}
          {(!loading && !error && targetAudiences.length === 0 && selectedShopId) && (
            <p className="text-center text-muted-foreground">لا توجد جماهير مستهدفة لعرضها. يرجى إضافة جمهور جديد.</p>
          )}
          {selectedShopId ? (
            <>
              <div className="mt-6">
                <Button onClick={() => {
                  setEditingTargetAudience(null);
                  setIsAddTargetAudienceDialogOpen(true);
                }} className="mb-4">إضافة جمهور مستهدف جديد</Button>
              </div>
              <CustomDialog
                isOpen={isAddTargetAudienceDialogOpen}
                onClose={() => {
                  setIsAddTargetAudienceDialogOpen(false);
                  setEditingTargetAudience(null);
                }}
                title={editingTargetAudience ? "تعديل الجمهور المستهدف" : "إضافة جمهور مستهدف جديد"}
                description="املأ التفاصيل لإدارة الجمهور المستهدف."
                className="max-h-[80vh] overflow-y-auto"
              >
                <TargetAudienceForm
                  shopId={selectedShopId}
                  initialData={editingTargetAudience || undefined}
                  onSave={handleSaveTargetAudience}
                  onCancel={() => {
                    setIsAddTargetAudienceDialogOpen(false);
                    setEditingTargetAudience(null);
                  }}
                />
              </CustomDialog>
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم (عربي)</TableHead>
                      <TableHead>الاسم (انجليزي)</TableHead>
                      <TableHead>الوصف (عربي)</TableHead>
                      <TableHead>نوع الجمهور</TableHead>
                      <TableHead>نسبة الخصم</TableHead>
                      <TableHead>نشط</TableHead>
                      <TableHead>المناطق الجغرافية</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetAudiences.map((audience) => (
                      <TableRow key={audience.id}>
                        <TableCell className="font-medium">{audience.name_ar}</TableCell>
                        <TableCell>{audience.name_en || 'N/A'}</TableCell>
                        <TableCell>{audience.description_ar || 'N/A'}</TableCell>
                        <TableCell>{audience.audience_type || 'N/A'}</TableCell>
                        <TableCell>{audience.discount_percentage?.toString() || '0'}%</TableCell>
                        <TableCell>{audience.is_active ? 'نعم' : 'لا'}</TableCell>
                        <TableCell>
                          {audience.store_target_audience_geographic_zones && audience.store_target_audience_geographic_zones.length > 0 ? (
                            audience.store_target_audience_geographic_zones.map(link => link.geographic_zones?.name).filter(Boolean).join(', ')
                          ) : (
                            'لا يوجد'
                          )}
                        </TableCell>
                        <TableCell className="text-right flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditTargetAudience(audience)}>تعديل</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTargetAudience(audience.id)}>حذف</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">الرجاء اختيار متجر لإدارة الجمهور المستهدف.</p>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          {selectedShopId ? (
            <CategoryManagementForm 
              shopId={selectedShopId || ''} 
              shopName={selectedStoreName}
            />
          ) : (
            <p>الرجاء تحديد متجر لعرض وإدارة الفئات.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 