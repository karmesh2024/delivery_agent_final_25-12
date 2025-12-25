'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Trash2, PlusCircle, Edit, FileText, Calendar, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { createSelector } from 'reselect';
import { Badge } from '@/shared/components/ui/badge';
import { formatDate } from '@/shared/utils/formatters';
import { SupplierDocument, DocumentType } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { RootState } from '@/store/index';
import { toast } from 'react-toastify';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { updateSupplierDocumentStatus } from '@/domains/supplier-management/store/supplierSlice';

interface ExistingDocumentsTabProps {
  documents: SupplierDocument[];
  supplierName?: string;
  supplierCode?: string;
}

const selectDocumentTypes = (state: RootState) => state.referenceData?.documentTypes || [];
const selectLoading = (state: RootState) => state.referenceData?.loading || false;

const selectMemoizedDocumentData = createSelector(
  selectDocumentTypes,
  selectLoading,
  (documentTypes, loading) => ({
    documentTypes,
    loading,
  })
);

const DocumentsTab: React.FC<ExistingDocumentsTabProps> = ({
  documents,
  supplierName,
  supplierCode
}) => {
  // Use document types data from Redux with default empty array to prevent undefined errors
  const { documentTypes, loading: typesLoading } = useAppSelector(selectMemoizedDocumentData);
  const dispatch = useAppDispatch();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [filterByExpiry, setFilterByExpiry] = useState('all');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [currentDocumentToEdit, setCurrentDocumentToEdit] = useState<SupplierDocument | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SupplierDocument['status']>('pending');

  // Get document type by ID - wrap in useCallback to prevent unnecessary re-renders
  const getDocumentType = useCallback((typeId: number): DocumentType | undefined => {
    if (!documentTypes || documentTypes.length === 0) {
      return undefined;
    }
    return documentTypes.find((type: DocumentType) => type.id === typeId);
  }, [documentTypes]);
  
  // Filtered documents based on search term and selected document type
  const filteredDocuments = documents.filter(doc => {
    const docType = getDocumentType(doc.document_type_id);
    const matchesSearch = searchTerm === '' || 
                          doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          docType?.type_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDocType = selectedDocType === 'all' || (docType && docType.id === parseInt(selectedDocType));

    const matchesExpiry = filterByExpiry === 'all' || 
                          (filterByExpiry === 'expired' && doc.expiry_date && new Date(doc.expiry_date) < new Date()) ||
                          (filterByExpiry === 'valid' && (!doc.expiry_date || new Date(doc.expiry_date) >= new Date()));
                          
    return matchesSearch && matchesDocType && matchesExpiry;
  });

  const getFileExtension = (fileName: string): string => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'approved':
        return 'معتمد';
      case 'pending':
        return 'قيد المراجعة';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'غير معروف';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>المستندات الحالية</CardTitle>
        <CardDescription>عرض وإدارة المستندات المرفوعة للمورد.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="بحث بالاسم، النوع، أو الرقم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select onValueChange={setSelectedDocType} value={selectedDocType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="تصفية حسب نوع المستند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {documentTypes.map((type: DocumentType) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.type_name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterByExpiry} value={filterByExpiry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="تصفية حسب تاريخ الانتهاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="valid">سارية</SelectItem>
              <SelectItem value="expired">منتهية الصلاحية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Documents Table */}
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">لا توجد مستندات مرفوعة حالياً.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المستند</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الرقم</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc, index) => {
                const docType = getDocumentType(doc.document_type_id);
                const statusInfo = getStatusColor(doc.status);
                const statusText = getStatusText(doc.status);
                const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                
                return (
                  <TableRow key={doc.id || index}>
                    <TableCell className="font-medium">
                      <a href={doc.download_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        {doc.document_name}
                        {doc.file_extension && <span className="text-gray-500 text-xs ml-1">{doc.file_extension}</span>}
                      </a>
                    </TableCell>
                    <TableCell>{docType ? docType.type_name_ar : 'غير معروف'}</TableCell>
                    <TableCell>{doc.document_number || 'N/A'}</TableCell>
                    <TableCell>{doc.issue_date ? formatDate(doc.issue_date) : 'N/A'}</TableCell>
                    <TableCell>
                      {doc.expiry_date ? (
                        <span className={isExpired ? 'text-red-500' : ''}>
                          {formatDate(doc.expiry_date)}
                          {isExpired && <Badge variant="destructive" className="mr-2">منتهي</Badge>}
                        </span>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo}>{statusText}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.download_url, '_blank')}
                        disabled={!doc.download_url}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentDocumentToEdit(doc);
                          setSelectedStatus(doc.status || 'pending');
                          setIsStatusDialogOpen(true);
                        }}
                      >
                        تغيير الحالة
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CustomDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        title={`تغيير حالة المستند: ${currentDocumentToEdit?.document_name || ''}`}
      >
        <div className="grid gap-4 py-4">
          <Label>اختر الحالة الجديدة:</Label>
          <RadioGroup
            value={selectedStatus || 'pending'}
            onValueChange={(value: string) => setSelectedStatus(value as SupplierDocument['status'])}
            className="flex flex-col space-y-1"
          >
            {['pending', 'approved', 'rejected', 'expired', 'needs_renewal'].map(status => (
              <div className="flex items-center space-x-3 space-x-reverse" key={status}>
                <RadioGroupItem value={status} id={`status-${status}`} />
                <Label htmlFor={`status-${status}`}>{getStatusText(status)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>إلغاء</Button>
          <Button onClick={async () => {
            if (currentDocumentToEdit && selectedStatus && currentDocumentToEdit.id) {
              try {
                await dispatch(updateSupplierDocumentStatus({
                  documentId: currentDocumentToEdit.id,
                  newStatus: selectedStatus
                })).unwrap();
                toast.success('تم تحديث حالة المستند بنجاح!');
                setIsStatusDialogOpen(false);
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
                toast.error(`فشل تحديث حالة المستند: ${errorMessage}`);
                console.error('Error updating document status:', error);
              }
            }
          }}>حفظ التغييرات</Button>
        </DialogFooter>
      </CustomDialog>
    </Card>
  );
};

export default DocumentsTab;
