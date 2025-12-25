'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PurchaseInvoiceItem, PurchaseInvoice } from '../types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPurchaseInvoice } from '../store/purchasingSlice';
import { fetchSuppliers } from '@/domains/supplier-management/store/supplierSlice';
import { fetchWarehouses } from '@/domains/warehouse-management/store/warehouseSlice';
import { toast } from 'sonner';
import { Loader2, Search, X, Plus, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';

interface PurchaseInvoiceFormProps {
  warehouseId?: number;
  invoiceId?: string;
  initialData?: PurchaseInvoice;
}

const emptyLine: PurchaseInvoiceItem = {
  product_id: '',
  catalog_product_id: '',
  sku: '',
  name: '',
  quantity: 1,
  unit_price: 0,
  total_price: 0,
  measurement_unit: 'piece',
  discount_value: 0,
};

interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  type: 'catalog' | 'store';
  image_url?: string | null;
  total_quantity?: number;
}

export const PurchaseInvoiceForm: React.FC<PurchaseInvoiceFormProps> = ({ warehouseId, invoiceId, initialData }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { suppliers } = useAppSelector((state) => state.supplier);
  const { warehouses } = useAppSelector((state) => state.warehouse);

  const isEditMode = !!invoiceId && !!initialData;

  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || '');
  const [supplierId, setSupplierId] = useState(initialData?.supplier_id?.toString() || '');
  const [warehouse, setWarehouse] = useState(initialData?.warehouse_id?.toString() || warehouseId?.toString() || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialData?.invoice_date ? new Date(initialData.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [items, setItems] = useState<PurchaseInvoiceItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((item) => ({
          ...item,
          product_id: item.product_id || '',
          catalog_product_id: item.catalog_product_id || '',
          sku: item.sku || '',
          name: item.name || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          measurement_unit: item.measurement_unit || 'piece',
          discount_value: item.discount_value || 0,
        }))
      : [{ ...emptyLine }]
  );
  const [saving, setSaving] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState<number | null>(null);
  const [productSearchResults, setProductSearchResults] = useState<Record<number, ProductSearchResult[]>>({});
  const [productSearchQuery, setProductSearchQuery] = useState<Record<number, string>>({});
  const [showAddProductDialog, setShowAddProductDialog] = useState<number | null>(null);
  const [showBrowseProductsDialog, setShowBrowseProductsDialog] = useState<number | null>(null);
  const [recentProducts, setRecentProducts] = useState<ProductSearchResult[]>([]);
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([]);
  const [loadingRecentProducts, setLoadingRecentProducts] = useState(false);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [focusedSearchIndex, setFocusedSearchIndex] = useState<number | null>(null);
  const [newProductData, setNewProductData] = useState({
    sku: '',
    name: '',
    product_code: '',
    description: '',
  });
  const [addingProduct, setAddingProduct] = useState(false);
  const [generatingInvoiceNumber, setGeneratingInvoiceNumber] = useState(false);

  // تحميل الموردين والمخازن
  useEffect(() => {
    const loadData = async () => {
      if (suppliers.length === 0) {
        setLoadingSuppliers(true);
        try {
          await dispatch(fetchSuppliers()).unwrap();
        } catch (error) {
          toast.error('فشل في تحميل الموردين');
        } finally {
          setLoadingSuppliers(false);
        }
      }

      if (warehouses.length === 0) {
        setLoadingWarehouses(true);
        try {
          await dispatch(fetchWarehouses()).unwrap();
        } catch (error) {
          toast.error('فشل في تحميل المخازن');
        } finally {
          setLoadingWarehouses(false);
        }
      }
    };

    loadData();
  }, [dispatch, suppliers.length, warehouses.length]);

  // تحميل أول 4 منتجات عند focus على حقل البحث
  const loadRecentProducts = async () => {
    if (loadingRecentProducts || recentProducts.length > 0) return;
    
    setLoadingRecentProducts(true);
    try {
      const response = await fetch('/api/catalog/products?limit=4');
      if (!response.ok) throw new Error('فشل تحميل المنتجات');
      
      const data = await response.json();
      const products: ProductSearchResult[] = (data.products || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        type: 'catalog',
        image_url: p.image_url || null,
        total_quantity: p.total_quantity || 0,
      }));
      
      setRecentProducts(products);
    } catch (error) {
      console.error('Error loading recent products:', error);
    } finally {
      setLoadingRecentProducts(false);
    }
  };

  // تحميل جميع المنتجات للـ Dialog
  const loadAllProducts = async () => {
    if (loadingAllProducts) return;
    
    setLoadingAllProducts(true);
    try {
      const response = await fetch('/api/catalog/products');
      if (!response.ok) throw new Error('فشل تحميل المنتجات');
      
      const data = await response.json();
      const products: ProductSearchResult[] = (data.products || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        type: 'catalog',
        image_url: p.image_url || null,
        total_quantity: p.total_quantity || 0,
      }));
      
      setAllProducts(products);
    } catch (error) {
      console.error('Error loading all products:', error);
      toast.error('فشل تحميل المنتجات');
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // البحث عن المنتجات (يدعم البحث بالـ SKU والاسم)
  const searchProducts = async (index: number, query: string) => {
    if (!query || query.trim().length < 2) {
      setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    setSearchingProducts(index);
    setProductSearchQuery((prev) => ({ ...prev, [index]: query }));

    try {
      // البحث بالـ SKU والاسم معاً
      const response = await fetch(`/api/products/search-warehouse-inventory?sku=${encodeURIComponent(query)}&name=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('فشل البحث');

      const data = await response.json();
      const results: ProductSearchResult[] = [];

      // معالجة نتائج catalog_products
      if (data.catalog_products) {
        data.catalog_products.forEach((p: any) => {
          results.push({
            id: p.id.toString(),
            sku: p.sku || '',
            name: p.name || '',
            type: 'catalog',
          });
        });
      }

      // معالجة نتائج store_products
      if (data.store_products) {
        data.store_products.forEach((p: any) => {
          results.push({
            id: p.id,
            sku: p.sku || '',
            name: p.name_ar || p.name_en || '',
            type: 'store',
          });
        });
      }

      setProductSearchResults((prev) => ({ ...prev, [index]: results }));
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('فشل البحث عن المنتجات');
      setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setSearchingProducts(null);
    }
  };

  // اختيار منتج من نتائج البحث
  const selectProduct = (index: number, product: ProductSearchResult) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = {
          ...item,
          product_id: product.type === 'store' ? product.id : '',
          catalog_product_id: product.type === 'catalog' ? product.id : '',
          sku: product.sku,
          name: product.name,
        };
        // إعادة حساب سعر الوحدة بعد تحديث البيانات
        const quantity = Number(updated.quantity) || 0;
        const totalPrice = Number(updated.total_price) || 0;
        const discount = Number(updated.discount_value || 0);
        if (quantity > 0) {
          const priceAfterDiscount = totalPrice - discount;
          updated.unit_price = Math.max(0, priceAfterDiscount / quantity);
        } else {
          updated.unit_price = 0;
        }
        return updated;
      })
    );
    setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
    setProductSearchQuery((prev) => ({ ...prev, [index]: '' }));
  };

  // إضافة منتج جديد للكتالوج
  const handleAddNewProduct = async (index: number) => {
    if (!newProductData.sku || !newProductData.name) {
      toast.error('يرجى إدخال SKU واسم المنتج');
      return;
    }

    setAddingProduct(true);
    try {
      const response = await fetch('/api/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newProductData.sku.trim(),
          product_code: newProductData.product_code.trim() || undefined,
          name: newProductData.name.trim(),
          description: newProductData.description.trim() || null,
          warehouse_id: warehouse ? Number(warehouse) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل إضافة المنتج');
      }

      const newProduct = await response.json();
      toast.success('تم إضافة المنتج للكتالوج بنجاح');

      // تحديث البند بالمنتج الجديد
      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          const updated = {
            ...item,
            catalog_product_id: newProduct.id,
            sku: newProduct.sku,
            name: newProduct.name,
          };
          // إعادة حساب سعر الوحدة بعد تحديث البيانات
          const quantity = Number(updated.quantity) || 0;
          const totalPrice = Number(updated.total_price) || 0;
          const discount = Number(updated.discount_value || 0);
          if (quantity > 0) {
            const priceAfterDiscount = totalPrice - discount;
            updated.unit_price = Math.max(0, priceAfterDiscount / quantity);
          } else {
            updated.unit_price = 0;
          }
          return updated;
        })
      );

      // إغلاق Dialog ومسح البحث
      setShowAddProductDialog(null);
      setNewProductData({ sku: '', name: '', product_code: '', description: '' });
      setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
      setProductSearchQuery((prev) => ({ ...prev, [index]: '' }));
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error?.message || 'فشل إضافة المنتج');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleItemChange = (index: number, key: keyof PurchaseInvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [key]: value };
        
        // حساب سعر الوحدة تلقائياً عند تغيير المبلغ الكلي أو الكمية أو الخصم
        if (key === 'quantity' || key === 'total_price' || key === 'discount_value') {
          const quantity = key === 'quantity' ? Number(value) || 0 : Number(updated.quantity) || 0;
          const totalPrice = key === 'total_price' ? Number(value) || 0 : Number(updated.total_price) || 0;
          const discount = key === 'discount_value' ? Number(value) || 0 : Number(updated.discount_value || 0);
          
          // حساب: سعر الوحدة = (المبلغ الكلي - الخصم) / الكمية
          if (quantity > 0) {
            const priceAfterDiscount = totalPrice - discount;
            updated.unit_price = Math.max(0, priceAfterDiscount / quantity);
          } else {
            updated.unit_price = 0;
          }
        }
        
        return updated;
      })
    );
  };

  // توليد رقم فاتورة متسلسل
  const generateInvoiceNumber = async () => {
    setGeneratingInvoiceNumber(true);
    try {
      const response = await fetch('/api/purchasing/invoices/generate-number');
      if (!response.ok) {
        throw new Error('فشل توليد رقم الفاتورة');
      }
      const data = await response.json();
      setInvoiceNumber(data.invoice_number);
      toast.success('تم توليد رقم الفاتورة بنجاح');
    } catch (error: any) {
      console.error('Error generating invoice number:', error);
      toast.error('فشل توليد رقم الفاتورة');
    } finally {
      setGeneratingInvoiceNumber(false);
    }
  };

  const addLine = () => setItems((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setProductSearchResults((prev) => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
    setProductSearchQuery((prev) => {
      const newQuery = { ...prev };
      delete newQuery[index];
      return newQuery;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!warehouse || !invoiceDate) {
      toast.error('يرجى تعبئة بيانات الفاتورة الأساسية');
      return;
    }
    if (items.some((item) => !item.quantity || item.quantity <= 0)) {
      toast.error('يجب أن تكون الكمية أكبر من صفر لكل بند');
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && invoiceId) {
        // تحديث الفاتورة الموجودة
        const response = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_id: supplierId ? Number(supplierId) : null,
            notes: notes || null,
            items: items.map((item) => ({
              product_id: item.product_id || undefined,
              catalog_product_id: item.catalog_product_id || undefined,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              measurement_unit: item.measurement_unit,
              discount_value: item.discount_value,
              notes: item.notes,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'فشل تحديث الفاتورة');
        }

        toast.success('تم تحديث فاتورة المشتريات بنجاح');
        router.push(`/financial-management/purchasing/invoices/${invoiceId}`);
      } else {
        // إنشاء فاتورة جديدة
        await dispatch(
          createPurchaseInvoice({
            invoice_number: invoiceNumber || undefined,
            supplier_id: supplierId ? Number(supplierId) : undefined,
            warehouse_id: Number(warehouse),
            invoice_date: new Date(invoiceDate).toISOString(),
            notes: notes || undefined,
            items: items.map((item) => ({
              product_id: item.product_id || undefined,
              catalog_product_id: item.catalog_product_id || undefined,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              measurement_unit: item.measurement_unit,
              discount_value: item.discount_value,
              notes: item.notes,
            })),
          })
        ).unwrap();
        toast.success('تم حفظ فاتورة المشتريات بنجاح');
        router.push('/financial-management/purchasing');
      }
    } catch (error: any) {
      toast.error(error?.message || 'تعذر حفظ الفاتورة');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>رقم الفاتورة</Label>
              <div className="flex gap-2">
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="سيتم توليده تلقائياً إن لم يتم إدخاله"
                  className="flex-1"
                  disabled={isEditMode}
                />
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateInvoiceNumber}
                    disabled={generatingInvoiceNumber}
                    title="توليد رقم فاتورة متسلسل"
                  >
                    {generatingInvoiceNumber ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>المورد</Label>
              <Select value={supplierId || 'none'} onValueChange={(value) => setSupplierId(value === 'none' ? '' : value)} disabled={loadingSuppliers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSuppliers ? 'جاري التحميل...' : 'اختر المورد'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مورد</SelectItem>
                  {suppliers
                    .filter((s) => s.is_active)
                    .map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name_ar || supplier.name} ({supplier.supplier_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المخزن *</Label>
              <Select value={warehouse} onValueChange={setWarehouse} disabled={loadingWarehouses || isEditMode} required>
                <SelectTrigger>
                  <SelectValue placeholder={loadingWarehouses ? 'جاري التحميل...' : 'اختر المخزن'} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id.toString()}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ الفاتورة *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                disabled={isEditMode}
              />
            </div>
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="معلومات إضافية" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بنود الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm">البند {index + 1}</h4>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* البحث عن المنتج */}
              <div className="relative">
                <Label>البحث عن المنتج (SKU أو الاسم)</Label>
                <div className="relative">
                  <Input
                    value={productSearchQuery[index] || ''}
                    onChange={(e) => {
                      const query = e.target.value;
                      setProductSearchQuery((prev) => ({ ...prev, [index]: query }));
                      if (query.length >= 2) {
                        searchProducts(index, query);
                      } else {
                        setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
                      }
                    }}
                    onFocus={() => {
                      setFocusedSearchIndex(index);
                      loadRecentProducts();
                    }}
                    onBlur={() => {
                      // تأخير إخفاء القائمة قليلاً للسماح بالنقر
                      setTimeout(() => {
                        setFocusedSearchIndex(null);
                      }, 200);
                    }}
                    placeholder="ابحث بالـ SKU أو الاسم..."
                    className="pr-10"
                  />
                  {searchingProducts === index && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {searchingProducts !== index && productSearchQuery[index] && (
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* عرض أول 4 منتجات عند focus بدون بحث */}
                {focusedSearchIndex === index && 
                 (!productSearchQuery[index] || productSearchQuery[index].length < 2) &&
                 (recentProducts.length > 0 || loadingRecentProducts) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {loadingRecentProducts ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : (
                      <>
                        {recentProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectProduct(index, product)}
                          >
                            <div className="flex items-center gap-3">
                              {/* صورة المنتج */}
                              <div className="flex-shrink-0">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                    <span className="text-xs text-gray-400">لا صورة</span>
                                  </div>
                                )}
                              </div>
                              {/* معلومات المنتج */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{product.name}</div>
                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                {product.total_quantity !== undefined && (
                                  <div className="text-xs text-green-600 mt-1">
                                    الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                                Catalog
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="p-2 border-t bg-gray-50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setShowBrowseProductsDialog(index);
                              loadAllProducts();
                            }}
                          >
                            اختر أكثر...
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* نتائج البحث */}
                {productSearchQuery[index] && 
                 productSearchQuery[index].length >= 2 &&
                 productSearchResults[index] && 
                 productSearchResults[index].length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {productSearchResults[index].map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectProduct(index, product)}
                      >
                        <div className="flex items-center gap-3">
                          {/* صورة المنتج */}
                          <div className="flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                <span className="text-xs text-gray-400">لا صورة</span>
                              </div>
                            )}
                          </div>
                          {/* معلومات المنتج */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                            {product.total_quantity !== undefined && (
                              <div className="text-xs text-green-600 mt-1">
                                الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                              </div>
                            )}
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                            {product.type === 'catalog' ? 'Catalog' : 'Store'}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 border-t bg-gray-50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowBrowseProductsDialog(index);
                          loadAllProducts();
                        }}
                      >
                        اختر أكثر...
                      </Button>
                    </div>
                  </div>
                )}

                {/* زر إضافة منتج جديد عند عدم وجود نتائج */}
                {productSearchQuery[index] && 
                 productSearchQuery[index].length >= 2 &&
                 !searchingProducts &&
                 (!productSearchResults[index] || productSearchResults[index].length === 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                    <div className="text-sm text-gray-600 mb-2">
                      لم يتم العثور على منتج بهذا الاسم أو SKU
                    </div>
                    <Dialog open={showAddProductDialog === index} onOpenChange={(open) => {
                      if (!open) {
                        setShowAddProductDialog(null);
                        setNewProductData({ sku: '', name: '', product_code: '', description: '' });
                      } else {
                        setShowAddProductDialog(index);
                        // تعبئة SKU واسم المنتج من البحث
                        setNewProductData((prev) => ({
                          ...prev,
                          sku: productSearchQuery[index] || '',
                          name: productSearchQuery[index] || '',
                        }));
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة منتج جديد للكتالوج
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>إضافة منتج جديد للكتالوج</DialogTitle>
                          <DialogDescription>
                            سيتم إضافة المنتج للكتالوج الرئيسي ويمكن استخدامه في جميع الفواتير
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>SKU *</Label>
                            <Input
                              value={newProductData.sku}
                              onChange={(e) => setNewProductData((prev) => ({ ...prev, sku: e.target.value }))}
                              placeholder="رمز المنتج"
                              required
                            />
                          </div>
                          <div>
                            <Label>اسم المنتج *</Label>
                            <Input
                              value={newProductData.name}
                              onChange={(e) => setNewProductData((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="اسم المنتج"
                              required
                            />
                          </div>
                          <div>
                            <Label>رمز المنتج (Product Code)</Label>
                            <Input
                              value={newProductData.product_code}
                              onChange={(e) => setNewProductData((prev) => ({ ...prev, product_code: e.target.value }))}
                              placeholder="سيتم توليده تلقائياً إن لم يتم إدخاله"
                            />
                          </div>
                          <div>
                            <Label>الوصف</Label>
                            <Textarea
                              value={newProductData.description}
                              onChange={(e) => setNewProductData((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="وصف المنتج (اختياري)"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowAddProductDialog(null);
                                setNewProductData({ sku: '', name: '', product_code: '', description: '' });
                              }}
                            >
                              إلغاء
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleAddNewProduct(index)}
                              disabled={addingProduct || !newProductData.sku || !newProductData.name}
                            >
                              {addingProduct ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  جاري الإضافة...
                                </>
                              ) : (
                                'إضافة للكتالوج'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              {/* بيانات المنتج المختار */}
              {(item.sku || item.name) && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">SKU:</span> {item.sku}
                    </div>
                    <div>
                      <span className="font-medium">الاسم:</span> {item.name}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>الكمية *</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label>المبلغ الكلي للبند (ج.م) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.total_price}
                    onChange={(e) => handleItemChange(index, 'total_price', Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label>الخصم (ج.م)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount_value || 0}
                    onChange={(e) => handleItemChange(index, 'discount_value', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>الوحدة</Label>
                  <Select
                    value={item.measurement_unit || 'piece'}
                    onValueChange={(value) => handleItemChange(index, 'measurement_unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">قطعة</SelectItem>
                      <SelectItem value="kg">كيلوجرام</SelectItem>
                      <SelectItem value="g">جرام</SelectItem>
                      <SelectItem value="liter">لتر</SelectItem>
                      <SelectItem value="ml">مليلتر</SelectItem>
                      <SelectItem value="box">صندوق</SelectItem>
                      <SelectItem value="pack">عبوة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ملخص السعر الكلي للبند */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">المبلغ الكلي للبند:</span>
                    <span className="font-medium">
                      {Number(item.total_price || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                    </span>
                  </div>
                  {(item.discount_value || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">الخصم:</span>
                      <span className="font-medium text-red-600">
                        - {Number(item.discount_value || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </span>
                    </div>
                  )}
                  {(item.discount_value || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">المبلغ بعد الخصم:</span>
                      <span className="font-medium text-green-600">
                        {((item.total_price || 0) - (item.discount_value || 0)).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </span>
                    </div>
                  )}
                  {/* سعر الوحدة المحسوب تلقائياً */}
                  {item.quantity > 0 && (
                    <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border border-blue-200">
                      <span className="text-gray-700 font-semibold">سعر الوحدة (محسوب تلقائياً):</span>
                      <span className="text-lg font-bold text-blue-700">
                        {item.unit_price.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
                    <span>الحساب: سعر الوحدة = (المبلغ الكلي - الخصم) ÷ الكمية</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addLine} className="w-full">
            + إضافة بند جديد
          </Button>

          {/* إجمالي الفاتورة */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">إجمالي الفاتورة:</span>
              <span className="text-2xl font-bold text-blue-700">
                {totalAmount.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog لعرض جميع منتجات الكتالوج */}
      <Dialog 
        open={showBrowseProductsDialog !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowBrowseProductsDialog(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>اختر منتج من الكتالوج</DialogTitle>
            <DialogDescription>
              اختر منتجاً من قائمة جميع منتجات الكتالوج
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingAllProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">جاري تحميل المنتجات...</span>
              </div>
            ) : allProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد منتجات في الكتالوج
              </div>
            ) : (
              <div className="space-y-2">
                {allProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-blue-50 cursor-pointer border rounded-lg transition-colors"
                    onClick={() => {
                      if (showBrowseProductsDialog !== null) {
                        selectProduct(showBrowseProductsDialog, product);
                        setShowBrowseProductsDialog(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* صورة المنتج */}
                      <div className="flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-400">لا صورة</span>
                          </div>
                        )}
                      </div>
                      {/* معلومات المنتج */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base truncate">{product.name}</div>
                        <div className="text-sm text-gray-500 mt-1">SKU: {product.sku}</div>
                        {product.total_quantity !== undefined && (
                          <div className="text-sm text-green-600 font-medium mt-1">
                            الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                        Catalog
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBrowseProductsDialog(null)}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'جاري التحديث...' : 'جاري الحفظ...'}
            </>
          ) : (
            isEditMode ? 'تحديث فاتورة المشتريات' : 'حفظ فاتورة المشتريات'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseInvoiceForm;
