import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { FiPlus, FiTrash } from 'react-icons/fi';

export interface UploadApprovedAgentDocumentsProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onProgressChange: (uploadedCount: number, totalRequired: number, missingDocuments: string[]) => void;
}

export const UploadApprovedAgentDocuments: React.FC<UploadApprovedAgentDocumentsProps> = ({ agentId, onSuccess, onCancel, onProgressChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [contractPages, setContractPages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    // Define all required static document types
    const REQUIRED_STATIC_DOCUMENT_TYPES = [
      "national_id_front",
      "national_id_back",
      "tax_card_front",
      "tax_card_back",
      "personal_photo",
    ];

    const missingDocs: string[] = [];
    let uploadedCount = 0;
    let totalRequired = REQUIRED_STATIC_DOCUMENT_TYPES.length;

    // Check for missing static documents and count uploaded ones
    REQUIRED_STATIC_DOCUMENT_TYPES.forEach(docType => {
      if (!selectedFiles[docType]) {
        missingDocs.push(docType);
      } else {
        uploadedCount++;
      }
    });

    // Handle dynamic contract pages
    const presentContractPages: number[] = [];
    contractPages.forEach((file, index) => {
      if (file) {
        presentContractPages.push(index + 1); // Store page numbers based on 1-indexing
      }
    });

    // If no contract pages are present, and we assume at least one is required.
    if (contractPages.length === 0) {
      missingDocs.push('contract_page_1');
      totalRequired++; // Account for the assumed first contract page
    } else {
      // Check for continuity of contract pages
      const maxPresentPage = presentContractPages.length > 0 ? Math.max(...presentContractPages) : 0;
      for (let i = 1; i <= maxPresentPage; i++) {
        if (!presentContractPages.includes(i)) {
          missingDocs.push(`contract_page_${i}`);
        }
      }
      totalRequired += contractPages.length; // Add the number of contract page inputs
      uploadedCount += presentContractPages.length; // Add the number of uploaded contract pages
    }

    // Pass progress information to parent
    onProgressChange(uploadedCount, totalRequired, missingDocs);

    return () => {
      Object.values(previewUrls).forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [selectedFiles, contractPages, previewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFiles(prev => ({ ...prev, [name]: file }));
      setPreviewUrls(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
    } else {
      setSelectedFiles(prev => ({ ...prev, [name]: null }));
      setPreviewUrls(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleContractFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      const newContractPages = [...contractPages];
      newContractPages[index] = file;
      setContractPages(newContractPages);
      setPreviewUrls(prev => ({ ...prev, [`contract_page_${index}`]: URL.createObjectURL(file) }));
    } else {
      const newContractPages = [...contractPages];
      newContractPages[index] = null as unknown as File;
      setContractPages(newContractPages);
      setPreviewUrls(prev => ({ ...prev, [`contract_page_${index}`]: null }));
    }
  };

  const addContractPage = () => {
    setContractPages(prev => [...prev, null as unknown as File]);
    setPreviewUrls(prev => ({ ...prev, [`contract_page_${contractPages.length}`]: null }));
  };

  const removeContractPage = (index: number) => {
    const removedFileKey = `contract_page_${index}`;
    if (previewUrls[removedFileKey]) {
      URL.revokeObjectURL(previewUrls[removedFileKey] as string);
    }
    setContractPages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[removedFileKey];
      return newUrls;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const documentTypes = [
        "national_id_front", "national_id_back", 
        "tax_card_front", "tax_card_back", // إضافة البطاقة الضريبية
        "personal_photo", // إضافة الصور الشخصية
      ];

      const uploadPromises = documentTypes.map(async (docType) => {
        const file = selectedFiles[docType];
        if (file) {
          const { publicUrl, error: uploadError } = await approvedAgentService.uploadAgentDocument(agentId, file, docType);
          if (uploadError) {
            throw new Error(`فشل رفع الملف ${docType}: ${uploadError}`);
          }
          if (publicUrl) {
            return { docType, publicUrl, status: "success" };
          } else {
            return { docType, status: "failed", error: "فشل رفع الملف" };
          }
        }
        return { docType, status: "skipped" };
      });

      // رفع مستندات التعاقد متعددة الصفحات
      const contractUploadPromises = contractPages.map(async (file, index) => {
        if (file) {
          const docType = `contract_page_${index + 1}`;
          const { publicUrl, error: uploadError } = await approvedAgentService.uploadAgentDocument(agentId, file, docType);
          if (uploadError) {
            throw new Error(`فشل رفع صفحة العقد ${index + 1}: ${uploadError}`);
          }
          if (publicUrl) {
            return { docType, publicUrl, status: "success" };
          } else {
            return { docType, status: "failed", error: "فشل رفع الملف" };
          }
        }
        return { docType: `contract_page_${index + 1}`, status: "skipped" };
      });

      const results = await Promise.all([...uploadPromises, ...contractUploadPromises]);

      const failedUploads = results.filter(r => r.status === "failed");

      if (failedUploads.length > 0) {
        const failedDocTypes = failedUploads.map(f => f.docType).join(', ');
        toast({
          title: "خطأ في رفع المستندات",
          description: `فشل رفع المستندات التالية: ${failedDocTypes}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم رفع مستندات الوكيل المعتمد بنجاح.",
          variant: "success",
        });
        onSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      console.error("Error uploading documents:", errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">
        الرجاء رفع المستندات المطلوبة التالية.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>مستندات الهوية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <Label htmlFor="national_id_front">صورة البطاقة الشخصية (الوجه الأمامي)</Label>
              <Input type="file" id="national_id_front" name="national_id_front" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>
            {previewUrls.national_id_front && (
              <img src={previewUrls.national_id_front} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <Label htmlFor="national_id_back">صورة البطاقة الشخصية (الوجه الخلفي)</Label>
              <Input type="file" id="national_id_back" name="national_id_back" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>
            {previewUrls.national_id_back && (
              <img src={previewUrls.national_id_back} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>البطاقة الضريبية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <Label htmlFor="tax_card_front">صورة البطاقة الضريبية (الوجه الأمامي)</Label>
              <Input type="file" id="tax_card_front" name="tax_card_front" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>
            {previewUrls.tax_card_front && (
              <img src={previewUrls.tax_card_front} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <Label htmlFor="tax_card_back">صورة البطاقة الضريبية (الوجه الخلفي)</Label>
              <Input type="file" id="tax_card_back" name="tax_card_back" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>
            {previewUrls.tax_card_back && (
              <img src={previewUrls.tax_card_back} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصور الشخصية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <Label htmlFor="personal_photo">صورة شخصية للوكيل</Label>
              <Input type="file" id="personal_photo" name="personal_photo" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>
            {previewUrls.personal_photo && (
              <img src={previewUrls.personal_photo} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مستندات التعاقد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contractPages.map((file, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-grow flex items-center space-x-2">
                <Label htmlFor={`contract_page_${index}`}>صفحة العقد {index + 1}</Label>
                <Input
                  type="file"
                  id={`contract_page_${index}`}
                  name={`contract_page_${index}`}
                  onChange={(e) => handleContractFileChange(index, e)}
                  accept=".pdf,image/*"
                />
              </div>
              {previewUrls[`contract_page_${index}`] && (
                <img src={previewUrls[`contract_page_${index}`] as string} alt="معاينة" className="w-24 h-24 object-cover rounded-md" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeContractPage(index)}
              >
                <FiTrash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addContractPage}>
            <FiPlus className="h-4 w-4 ml-2" /> إضافة صفحة عقد
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'جاري الرفع...' : 'رفع المستندات'}
        </Button>

      </div>
    </div>
  );
}; 