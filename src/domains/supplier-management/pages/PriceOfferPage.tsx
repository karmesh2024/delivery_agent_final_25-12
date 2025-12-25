'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { RootState } from '@/store';
import { fetchSupplierById } from '../store/supplierSlice';
import { fetchPriceOffers, updatePriceOffer, createPriceOffer } from '../store/priceOfferSlice';
import { SupplierPriceOffer } from '../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { ArrowRight, Plus, Eye, Check, X, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PriceOfferPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { currentSupplier } = useAppSelector((state: RootState) => state.supplier);
  const { priceOffers, loading, error } = useAppSelector((state: RootState) => state.priceOffer);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SupplierPriceOffer | null>(null);
  const [offerAction, setOfferAction] = useState<'view' | 'accept' | 'reject'>('view');
  const [isAddOfferDialogOpen, setIsAddOfferDialogOpen] = useState(false);

  // State for new price offer form
  const [newOfferProductId, setNewOfferProductId] = useState('');
  const [newOfferCategoryId, setNewOfferCategoryId] = useState('');
  const [newOfferSubcategoryId, setNewOfferSubcategoryId] = useState('');
  const [newOfferProposedPrice, setNewOfferProposedPrice] = useState('');
  const [newOfferQuantity, setNewOfferQuantity] = useState('');
  const [newOfferUnit, setNewOfferUnit] = useState('');
  const [newOfferValidFrom, setNewOfferValidFrom] = useState<Date | null>(null);
  const [newOfferValidTo, setNewOfferValidTo] = useState<Date | null>(null);
  const [newOfferNotes, setNewOfferNotes] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchSupplierById(parseInt(id)));
      dispatch(fetchPriceOffers(id));
    }
  }, [dispatch, id]);

  const handleOpenOfferDialog = (offer: SupplierPriceOffer, action: 'view' | 'accept' | 'reject') => {
    setSelectedOffer(offer);
    setOfferAction(action);
    setIsOfferDialogOpen(true);
  };

  const handleUpdateOfferStatus = async () => {
    if (selectedOffer) {
      try {
        await dispatch(updatePriceOffer({
          id: selectedOffer.id,
          status: offerAction === 'accept' ? 'accepted' : 'rejected'
        })).unwrap();
        
        toast.success(
          offerAction === 'accept' 
            ? 'تم قبول العرض بنجاح' 
            : 'تم رفض العرض بنجاح'
        );
        
        setIsOfferDialogOpen(false);
        // إعادة جلب العروض بعد التحديث
        if (id) {
          dispatch(fetchPriceOffers(id));
        }
      } catch (error) {
        toast.error('فشل في تحديث حالة العرض');
      }
    }
  };

  const handleAddPriceOffer = async () => {
    if (!newOfferProductId || !newOfferCategoryId || !newOfferProposedPrice || !newOfferQuantity || !newOfferUnit || !newOfferValidFrom || !newOfferValidTo) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة.');
      return;
    }

    const parsedProposedPrice = parseFloat(newOfferProposedPrice);
    const parsedQuantity = parseFloat(newOfferQuantity);

    if (isNaN(parsedProposedPrice) || isNaN(parsedQuantity)) {
      toast.error('السعر المقترح والكمية يجب أن يكونا أرقامًا صالحة.');
      return;
    }

    const newOffer: Omit<SupplierPriceOffer, 'id'> = {
      supplier_id: parseInt(id), // Ensure supplier_id is a number
      product_id: newOfferProductId,
      category_id: newOfferCategoryId,
      subcategory_id: newOfferSubcategoryId || undefined, // Allow undefined if empty
      proposed_price: parsedProposedPrice,
      quantity: parsedQuantity,
      unit: newOfferUnit,
      valid_from: newOfferValidFrom.toISOString(),
      valid_to: newOfferValidTo.toISOString(),
      status: 'pending', // Default status for new offers
      notes: newOfferNotes || undefined,
    };

    try {
      await dispatch(createPriceOffer(newOffer)).unwrap();
      toast.success('تمت إضافة عرض السعر بنجاح.');
      setIsAddOfferDialogOpen(false);
      // Reset form fields
      setNewOfferProductId('');
      setNewOfferCategoryId('');
      setNewOfferSubcategoryId('');
      setNewOfferProposedPrice('');
      setNewOfferQuantity('');
      setNewOfferUnit('');
      setNewOfferValidFrom(null);
      setNewOfferValidTo(null);
      setNewOfferNotes('');
      // Re-fetch offers to update the list
      if (id) {
        dispatch(fetchPriceOffers(id));
      }
    } catch (error: unknown) {
      toast.error(`فشل في إضافة عرض السعر: ${(error as Error).message}`);
    }
  };

  // تحديد لون حالة العرض
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ترجمة حالة العرض
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'معلق';
      case 'active':
        return 'نشط';
      case 'accepted':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      case 'expired':
        return 'منتهي';
      default:
        return status;
    }
  };

  if (loading && priceOffers.length === 0) {
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
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/suppliers/${id}`)}
          >
            <ArrowRight className="ml-2" size={16} />
            العودة للمورد
          </Button>
          <h1 className="text-2xl font-bold mr-4">
            عروض الأسعار: {currentSupplier?.name}
          </h1>
        </div>
        <Button onClick={() => setIsAddOfferDialogOpen(true)}>
          <Plus className="ml-2" size={16} />
          إضافة عرض جديد
        </Button>
      </div>

      {priceOffers.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            لا توجد عروض أسعار مسجلة لهذا المورد.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر المقترح</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>من تاريخ</TableHead>
                  <TableHead>إلى تاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceOffers.map((offer, index) => (
                  <TableRow key={offer.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{offer.product_name}</TableCell>
                    <TableCell>{offer.category_name}</TableCell>
                    <TableCell>{offer.proposed_price} جنيه</TableCell>
                    <TableCell>{offer.quantity} {offer.unit}</TableCell>
                    <TableCell>
                      {format(new Date(offer.valid_from || ''), 'P', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(offer.valid_to || ''), 'P', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusColor(offer.status)}`}
                      >
                        {translateStatus(offer.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(offer.created_at || ''), 'P', { locale: ar })}
                    </TableCell>
                    <TableCell className="space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenOfferDialog(offer, 'view')}
                      >
                        <Eye className="ml-1" size={14} />
                        عرض
                      </Button>
                      {offer.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenOfferDialog(offer, 'accept')}
                          >
                            <Check className="ml-1" size={14} />
                            قبول
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenOfferDialog(offer, 'reject')}
                          >
                            <X className="ml-1" size={14} />
                            رفض
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* حوار تفاصيل العرض / قبول / رفض */}
      <CustomDialog 
        isOpen={isOfferDialogOpen} 
        onClose={() => setIsOfferDialogOpen(false)}
        title={
          offerAction === 'view' 
            ? 'تفاصيل عرض السعر' 
            : offerAction === 'accept' 
            ? 'قبول عرض السعر' 
            : 'رفض عرض السعر'
        }
        description={/* Ensuring description accepts React.ReactNode as per CustomDialogProps */
          selectedOffer && offerAction === 'view' ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productName" className="text-right">
                  المنتج
                </Label>
                <Input
                  id="productName"
                  defaultValue={selectedOffer.product_name}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoryName" className="text-right">
                  الفئة
                </Label>
                <Input
                  id="categoryName"
                  defaultValue={selectedOffer.category_name}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="proposedPrice" className="text-right">
                  السعر المقترح
                </Label>
                <Input
                  id="proposedPrice"
                  defaultValue={`${selectedOffer.proposed_price} جنيه`}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  الكمية
                </Label>
                <Input
                  id="quantity"
                  defaultValue={`${selectedOffer.quantity} ${selectedOffer.unit}`}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validFrom" className="text-right">
                  من تاريخ
                </Label>
                <Input
                  id="validFrom"
                  defaultValue={format(new Date(selectedOffer.valid_from || ''), 'P', { locale: ar })}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validTo" className="text-right">
                  إلى تاريخ
                </Label>
                <Input
                  id="validTo"
                  defaultValue={format(new Date(selectedOffer.valid_to || ''), 'P', { locale: ar })}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  الحالة
                </Label>
                <Input
                  id="status"
                  defaultValue={translateStatus(selectedOffer.status)}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="createdAt" className="text-right">
                  تاريخ التقديم
                </Label>
                <Input
                  id="createdAt"
                  defaultValue={format(new Date(selectedOffer.created_at || ''), 'P', { locale: ar })}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  ملاحظات
                </Label>
                <Input
                  id="notes"
                  defaultValue={selectedOffer.notes || 'لا توجد ملاحظات'}
                  className="col-span-3"
                  readOnly
                />
              </div>
            </div>
          ) : offerAction === 'accept' ? (
            <div className="grid gap-4 py-4 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-lg">
                هل أنت متأكد من قبول عرض السعر هذا للمنتج "{selectedOffer?.product_name}"؟
              </p>
            </div>
          ) : (
            <div className="grid gap-4 py-4 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-lg">
                هل أنت متأكد من رفض عرض السعر هذا للمنتج "{selectedOffer?.product_name}"؟
              </p>
            </div>
          )
        }
      >
        {offerAction !== 'view' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateOfferStatus}>
              {offerAction === 'accept' ? 'قبول العرض' : 'رفض العرض'}
            </Button>
          </DialogFooter>
        )}
      </CustomDialog>

      {/* New Add Offer Dialog */}
      <CustomDialog
        isOpen={isAddOfferDialogOpen}
        onClose={() => setIsAddOfferDialogOpen(false)}
        title="إضافة عرض سعر جديد"
        description={
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newProductId" className="text-right">المنتج</Label>
              <Input
                id="newProductId"
                value={newOfferProductId}
                onChange={(e) => setNewOfferProductId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCategoryId" className="text-right">الفئة</Label>
              <Input
                id="newCategoryId"
                value={newOfferCategoryId}
                onChange={(e) => setNewOfferCategoryId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newSubcategoryId" className="text-right">الفئة الفرعية</Label>
              <Input
                id="newSubcategoryId"
                value={newOfferSubcategoryId}
                onChange={(e) => setNewOfferSubcategoryId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newProposedPrice" className="text-right">السعر المقترح</Label>
              <Input
                id="newProposedPrice"
                type="number"
                value={newOfferProposedPrice}
                onChange={(e) => setNewOfferProposedPrice(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newQuantity" className="text-right">الكمية</Label>
              <Input
                id="newQuantity"
                type="number"
                value={newOfferQuantity}
                onChange={(e) => setNewOfferQuantity(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newUnit" className="text-right">الوحدة</Label>
              <Input
                id="newUnit"
                value={newOfferUnit}
                onChange={(e) => setNewOfferUnit(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newValidFrom" className="text-right">من تاريخ</Label>
              <DatePicker
                id="newValidFrom"
                selected={newOfferValidFrom}
                onChange={(date: Date | null) => setNewOfferValidFrom(date)}
                dateFormat="P"
                locale={ar}
                className="col-span-3 w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newValidTo" className="text-right">إلى تاريخ</Label>
              <DatePicker
                id="newValidTo"
                selected={newOfferValidTo}
                onChange={(date: Date | null) => setNewOfferValidTo(date)}
                dateFormat="P"
                locale={ar}
                className="col-span-3 w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newNotes" className="text-right">ملاحظات</Label>
              <Input
                id="newNotes"
                value={newOfferNotes}
                onChange={(e) => setNewOfferNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
        }
      >
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddOfferDialogOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAddPriceOffer}>
            إضافة العرض
          </Button>
        </DialogFooter>
      </CustomDialog>
    </div>
  );
};

export default PriceOfferPage;