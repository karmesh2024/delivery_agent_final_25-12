'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { AddStoreDialog } from '../AddStoreDialog';
import { getPublicImageUrl } from '@/lib/supabase';
import EditStoreForm from '@/domains/stores/components/EditStoreForm'; // Corrected path using alias
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';
import CategoryManagementForm from '@/domains/products/components/CategoryManagementForm';

interface Store {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  logo_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Add other store properties as needed
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStoreDialogOpen, setIsAddStoreDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isManageCategoriesDialogOpen, setIsManageCategoriesDialogOpen] = useState<boolean>(false);
  const [selectedStoreIdForCategories, setSelectedStoreIdForCategories] = useState<string | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stores');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStores(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleToggleStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchStores(); // Re-fetch stores to update the UI
    } catch (err: unknown) {
      console.error('Failed to toggle store status:', err);
      alert(`Failed to toggle store status: ${(err as Error).message}`);
    }
  };

  const handleEdit = (store: Store) => {
    setSelectedStore(store);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store?')) {
      return;
    }
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchStores(); // Re-fetch stores to update the UI
    } catch (err: unknown) {
      console.error('Failed to delete store:', err);
      alert(`Failed to delete store: ${(err as Error).message}`);
    }
  };

  const handleManageCategories = (storeId: string) => {
    setSelectedStoreIdForCategories(storeId);
    setIsManageCategoriesDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <Link href="/store-management" className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800">
        <FaArrowLeft className="mr-2" /> العودة إلى إدارة المتاجر الإلكترونية
      </Link>
      <h1 className="text-3xl font-bold mb-6">إدارة المتاجر</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddStoreDialogOpen(true)}>إضافة متجر جديد</Button>

        <CustomDialog
          isOpen={isAddStoreDialogOpen}
          onClose={() => setIsAddStoreDialogOpen(false)}
          title="إضافة متجر جديد"
        >
          <AddStoreDialog onSuccess={() => {
            setIsAddStoreDialogOpen(false);
            fetchStores();
          }} onClose={() => setIsAddStoreDialogOpen(false)} />
        </CustomDialog>
      </div>

      {loading && <p>جاري تحميل المتاجر...</p>}
      {error && <p className="text-red-500">حدث خطأ: {error}</p>}

      {!loading && !error && stores.length === 0 && (
        <p>لا توجد متاجر لعرضها. الرجاء إضافة متجر جديد.</p>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الاسم التعريفي (Slug)</TableHead>
                <TableHead>الشعار</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المنتجات</TableHead>
                <TableHead>إدارة الفئات</TableHead>
                <TableHead>إعدادات المتجر</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name_ar}</TableCell>
                  <TableCell>{store.slug}</TableCell>
                  <TableCell>
                    {store.logo_path ? (
                      <div className="relative h-10 w-10">
                        <Image
                        src={getPublicImageUrl('stores', store.logo_path) || ''}
                        alt={`${store.name_ar} Logo`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded-full"
                      />
                      </div>
                    ) : (
                      <span>لا يوجد شعار</span>
                    )}
                  </TableCell>
                  <TableCell>{store.is_active ? 'مفعل' : 'معطل'}</TableCell>
                  <TableCell>
                    <Link href={`/store-management/stores/${store.id}/products`}>
                      <Button variant="outline" size="sm">
                        عرض المنتجات
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleManageCategories(store.id)}
                    >
                      إدارة الفئات
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Link href={`/store-management/product-settings?storeId=${store.id}`}>
                      <Button variant="outline" size="sm">
                        إعدادات المتجر
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(store)}>
                      تعديل
                    </Button>
                    <Button
                      variant={store.is_active ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(store.id, store.is_active)}
                    >
                      {store.is_active ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(store.id)}>
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Store Dialog */}
      {selectedStore && (
        <CustomDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="تعديل المتجر"
          description="تعديل تفاصيل المتجر."
        >
          {/* EditStoreForm component will go here */}
          {/* <div></div> Temporary placeholder for children to fix linter error */}
          {selectedStore && (
            <EditStoreForm
              storeId={selectedStore.id}
              onFinished={() => {
                setIsEditDialogOpen(false);
                fetchStores();
                setSelectedStore(null);
              }}
            />
          )}
        </CustomDialog>
      )}

      {/* Manage Categories Dialog */}
      {isManageCategoriesDialogOpen && selectedStoreIdForCategories && (
        <CustomDialog
          isOpen={isManageCategoriesDialogOpen}
          onClose={() => setIsManageCategoriesDialogOpen(false)}
          title="إدارة الفئات الرئيسية والفرعية"
          description={`للمتجر: ${stores.find(s => s.id === selectedStoreIdForCategories)?.name_ar || ''}`}
        >
          <CategoryManagementForm 
            shopId={selectedStoreIdForCategories}
            shopName={stores.find(s => s.id === selectedStoreIdForCategories)?.name_ar || ''}
          />
        </CustomDialog>
      )}
    </div>
  );
} 