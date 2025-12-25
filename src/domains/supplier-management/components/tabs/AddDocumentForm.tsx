'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PlusCircle, FileText, Calendar, AlertCircle, Upload } from 'lucide-react';
import { useAppSelector } from '@/store/index';
import { SupplierDocument, DocumentType } from '../../types';
import { toast } from 'react-toastify';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

interface AddDocumentFormProps {
  supplierName?: string;
  supplierCode?: string;
  onAddDocument: (newDocument: SupplierDocument) => void; // Callback to add document to parent
  supplierId?: string; // تم تغيير النوع إلى string
  documentTypes: DocumentType[]; // إضافة خاصية أنواع المستندات هنا
}

const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ supplierName, supplierCode, onAddDocument, supplierId }) => {
  const referenceData = useAppSelector((state) => state.referenceData);
  
  const { documentTypes, loading: typesLoading } = useMemo(() => {
    return {
      documentTypes: referenceData?.documentTypes || [],
      loading: referenceData?.loading || false,
    };
  }, [referenceData]);

  console.log("Document Types from Redux:", documentTypes);

  const supabase = createClientComponentClient();

  const [newDocument, setNewDocument] = useState<Partial<SupplierDocument>>(() => ({
    document_type_id: undefined,
    document_name: '',
    document_number: '',
    issue_date: undefined,
    expiry_date: undefined,
    status: 'pending',
    is_verified: false,
    is_confidential: false,
    access_level: 'normal',
    days_before_expiry_alert: 30,
    description: undefined,
    file_name: undefined,
    file_size: undefined,
    file_type: undefined,
    file_extension: undefined,
    storage_url: undefined,
    thumbnail_url: undefined,
    download_url: undefined,
    storage_provider: 'local',
    storage_path: undefined,
    file_hash: undefined,
    verification_method: undefined,
    reviewed_by: undefined,
    reviewed_at: undefined,
    review_notes: undefined,
    rejection_reason: undefined,
    expiry_alert_sent: false,
    expiry_alert_date: undefined,
    notes: undefined,
    tags: undefined,
  }));
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const getDocumentType = useCallback((typeId: number | undefined): DocumentType | undefined => {
    if (typeId === undefined || !documentTypes || documentTypes.length === 0) {
      return undefined;
    }
    return documentTypes.find(type => type.id === typeId);
  }, [documentTypes]);

  const handleFieldChange = useCallback((field: keyof Partial<SupplierDocument>, value: string | number | boolean | string[]) => {
    setNewDocument(prev => {
      const updatedDoc: Partial<SupplierDocument> = { ...prev };

      switch (field) {
        case 'document_type_id':
        case 'file_size':
        case 'days_before_expiry_alert':
        case 'reviewed_by':
          updatedDoc[field] = value as number;
          break;
        case 'is_verified':
        case 'is_confidential':
        case 'expiry_alert_sent':
          updatedDoc[field] = value as boolean;
          break;
        case 'status':
          updatedDoc[field] = value as 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_renewal';
          break;
        case 'access_level':
          updatedDoc[field] = value as 'public' | 'normal' | 'restricted' | 'confidential';
          break;
        case 'tags':
          updatedDoc[field] = value as string[];
          break;
        case 'issue_date':
        case 'expiry_date':
          updatedDoc[field] = (value === '' ? undefined : value) as string | undefined;
          break;
        case 'reviewed_at':
        case 'review_notes':
        case 'rejection_reason':
        case 'expiry_alert_date':
        case 'notes':
        case 'description':
        case 'document_name':
        case 'document_number':
        case 'file_name':
        case 'file_type':
        case 'file_extension':
        case 'storage_url':
        case 'thumbnail_url':
        case 'download_url':
        case 'storage_provider':
        case 'storage_path':
        case 'file_hash':
        case 'verification_method':
          updatedDoc[field] = value as string;
          break;
        default:
          console.warn(`Unhandled field: ${field} with value: ${value}`);
          break;
      }
      
      if (field === 'document_type_id') {
        const docType = getDocumentType(updatedDoc.document_type_id as number);
        if (docType && !docType.requires_expiry) {
          updatedDoc.expiry_date = undefined;
        }
      }
      return updatedDoc;
    });
  }, [getDocumentType]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFormError(null);
    } else {
      setFile(null);
    }
  }, []);

  const validateForm = useCallback(() => {
    if (newDocument.document_type_id === undefined) {
      setFormError('يجب اختيار نوع المستند.');
      return false;
    }
    if (!newDocument.document_name || newDocument.document_name.trim() === '') {
      setFormError('اسم المستند مطلوب.');
      return false;
    }
    if (!file) {
      setFormError('يجب إرفاق ملف المستند.');
      return false;
    }

    const docType = getDocumentType(newDocument.document_type_id as number);
    if (docType?.requires_expiry && (!newDocument.expiry_date || newDocument.expiry_date.trim() === '')) {
      setFormError('تاريخ الانتهاء مطلوب لهذا النوع من المستندات.');
      return false;
    }
    setFormError(null);
    return true;
  }, [newDocument, file, getDocumentType]);

  const getFileExtension = useCallback((fileName: string): string => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }, []);

  const handleSaveDocument = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!file) return;

    setFormError(null);
    setIsSaving(true);

    try {
      console.log("AddDocumentForm: newDocument before saving:", newDocument);
      const fileExtension = getFileExtension(file.name);
      const fileNameInStorage = `${supplierId || 'temp'}/${newDocument.document_type_id || 'unknown'}-${Date.now()}${fileExtension}`;
      const bucketName = 'supplier-documents';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileNameInStorage, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('خطأ في رفع الملف إلى Supabase Storage:', uploadError);
        toast.error(`فشل رفع المستند: ${uploadError.message}`);
        setFormError(`فشل رفع المستند: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileNameInStorage);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        toast.error('فشل الحصول على رابط المستند بعد الرفع.');
        setFormError('فشل الحصول على رابط المستند بعد الرفع.');
        return;
      }

      const documentToSave: SupplierDocument = {
        supplier_id: supplierId ? parseInt(supplierId) : undefined,
        document_type_id: newDocument.document_type_id as number,
        document_name: newDocument.document_name as string,
        description: newDocument.description ?? undefined,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_extension: fileExtension,
        storage_url: publicUrlData.publicUrl,
        thumbnail_url: publicUrlData.publicUrl,
        download_url: publicUrlData.publicUrl,
        storage_provider: 'supabase',
        storage_path: fileNameInStorage,
        file_hash: newDocument.file_hash ?? undefined,
        issue_date: (newDocument.issue_date === '' || newDocument.issue_date === undefined) ? null : newDocument.issue_date,
        expiry_date: (newDocument.expiry_date === '' || newDocument.expiry_date === undefined) ? null : newDocument.expiry_date,
        status: (newDocument.status ?? 'pending'),
        is_verified: newDocument.is_verified ?? false,
        verification_method: newDocument.verification_method ?? undefined,
        reviewed_by: newDocument.reviewed_by ?? undefined,
        reviewed_at: newDocument.reviewed_at ?? undefined,
        review_notes: newDocument.review_notes ?? undefined,
        rejection_reason: newDocument.rejection_reason ?? undefined,
        expiry_alert_sent: newDocument.expiry_alert_sent ?? false,
        expiry_alert_date: newDocument.expiry_alert_date ?? undefined,
        days_before_expiry_alert: newDocument.days_before_expiry_alert ?? 30,
        is_confidential: newDocument.is_confidential ?? false,
        access_level: (newDocument.access_level ?? 'normal'),
        notes: newDocument.notes ?? undefined,
        tags: newDocument.tags ?? undefined,
      };

      onAddDocument(documentToSave);
      toast.success('تم إضافة المستند بنجاح!');
      setNewDocument(() => ({
        document_type_id: undefined,
        document_name: '',
        document_number: '',
        issue_date: undefined,
        expiry_date: undefined,
        status: 'pending',
        is_verified: false,
        is_confidential: false,
        access_level: 'normal',
        days_before_expiry_alert: 30,
        description: undefined,
        file_name: undefined,
        file_size: undefined,
        file_type: undefined,
        file_extension: undefined,
        storage_url: undefined,
        thumbnail_url: undefined,
        download_url: undefined,
        storage_provider: 'local',
        storage_path: undefined,
        file_hash: undefined,
        verification_method: undefined,
        reviewed_by: undefined,
        reviewed_at: undefined,
        review_notes: undefined,
        rejection_reason: undefined,
        expiry_alert_sent: false,
        expiry_alert_date: undefined,
        notes: undefined,
        tags: undefined,
      }));
      setFile(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع عند حفظ المستند.';
      console.error('خطأ في حفظ المستند:', error);
      toast.error(`فشل حفظ المستند: ${errorMessage}`);
      setFormError(`فشل حفظ المستند: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, file, supplierId, newDocument, getFileExtension, supabase, onAddDocument]);

  if (typesLoading) {
    return <div className="p-4 text-center">جاري تحميل أنواع المستندات...</div>;
  }

  return (
    <Card className="p-4 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold mb-4">إضافة مستند جديد</CardTitle>
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {formError}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document_type_id">
              <RequiredIndicator />نوع المستند
            </Label>
            <Select
              value={newDocument.document_type_id !== undefined ? String(newDocument.document_type_id) : ""}
              onValueChange={(value) => handleFieldChange('document_type_id', parseInt(value))}
            >
              <SelectTrigger id="document_type_id">
                <SelectValue placeholder="اختر نوع المستند" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.type_name_ar || type.type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_name">
              <RequiredIndicator />اسم المستند (وصف موجز)
            </Label>
            <Input
              id="document_name"
              type="text"
              placeholder="مثال: رخصة البلدية، شهادة الضريبة"
              value={newDocument.document_name || ''}
              onChange={(e) => handleFieldChange('document_name', e.target.value)}
            />
            {!newDocument.document_name && <span className="text-red-500 text-sm">مطلوب</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_number">رقم المستند (اختياري)</Label>
            <Input
              id="document_number"
              type="text"
              placeholder="مثال: 123456789"
              value={newDocument.document_number || ''}
              onChange={(e) => handleFieldChange('document_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">وصف تفصيلي (اختياري)</Label>
            <Input
              id="description"
              type="text"
              placeholder="أي تفاصيل إضافية عن المستند"
              value={newDocument.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue_date">تاريخ الإصدار (اختياري)</Label>
            <Input
              id="issue_date"
              type="date"
              value={newDocument.issue_date || ''}
              onChange={(e) => handleFieldChange('issue_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry_date">
              {getDocumentType(newDocument.document_type_id as number)?.requires_expiry && <RequiredIndicator />}
              تاريخ الانتهاء
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={newDocument.expiry_date || ''}
              onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
              disabled={!getDocumentType(newDocument.document_type_id as number)?.requires_expiry}
            />
            {getDocumentType(newDocument.document_type_id as number)?.requires_expiry && !newDocument.expiry_date && <span className="text-red-500 text-sm">مطلوب</span>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">
              <RequiredIndicator />ملف المستند
            </Label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  {file ? (
                    <p className="mb-2 text-sm text-gray-500 text-center">
                      <span className="font-semibold">{file.name}</span>
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-500 text-center">
                        <span className="font-semibold">انقر للتحميل</span> أو اسحب وأفلت
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        PDF, DOCX, JPG, PNG, (حد أقصى 5MB)
                      </p>
                    </>
                  )}
                </div>
                <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {!file && <span className="text-red-500 text-sm">مطلوب</span>}
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button type="button" onClick={handleSaveDocument} className="w-full mt-4" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'إضافة مستند'}
            <PlusCircle className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddDocumentForm; 