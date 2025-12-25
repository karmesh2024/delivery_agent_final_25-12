"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { AlertCircle, CheckCircle2, Upload, File, X, Calendar, User } from "lucide-react";
import { uploadFile, uploadDeliveryDocument, getDeliveryBoyById, supabase } from "@/lib/supabase";
import { useToast } from "@/shared/ui/toast";

interface UploadAgentDocumentsProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type DocumentType = "national_id" | "license" | "profile_image" | "vehicle_registration" | "other";

interface DocumentFile {
  id: string;
  file: File;
  type: DocumentType;
  preview: string;
  uploading: boolean;
  error: string | null;
  uploaded: boolean;
  url: string | null;
  expiry_date?: string;
  notes?: string;
}

const documentTypeLabels: Record<DocumentType, string> = {
  national_id: "صورة الهوية الوطنية",
  license: "صورة رخصة القيادة",
  profile_image: "الصورة الشخصية",
  vehicle_registration: "استمارة المركبة",
  other: "مستند آخر"
};

const requiresExpiryDate: DocumentType[] = ["license", "national_id", "vehicle_registration"];

export function UploadAgentDocuments({ agentId, onSuccess, onCancel }: UploadAgentDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>("national_id");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [documentNotes, setDocumentNotes] = useState<string>("");
  const [agentDetails, setAgentDetails] = useState<{id: string; full_name: string} | null>(null);
  const [isLoadingAgentDetails, setIsLoadingAgentDetails] = useState(true);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const agent = await getDeliveryBoyById(agentId);
        if (agent) {
          setAgentDetails({
            id: agent.id,
            full_name: agent.full_name || 'غير معروف'
          });
        }
      } catch (error) {
        toast({
          title: "تحذير",
          description: "لم نتمكن من جلب بيانات المندوب",
          type: "warning"
        });
      } finally {
        setIsLoadingAgentDetails(false);
      }
    };

    if (agentId) {
      fetchAgentDetails();
    }
  }, [agentId, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      const newDoc: DocumentFile = {
        id: Date.now().toString(),
        file,
        type: selectedType,
        preview: reader.result as string,
        uploading: false,
        error: null,
        uploaded: false,
        url: null,
        expiry_date: requiresExpiryDate.includes(selectedType) ? expiryDate : undefined,
        notes: documentNotes.trim() !== "" ? documentNotes : undefined
      };
      
      setDocuments(prev => [...prev, newDoc]);
      setSelectedType("national_id");
      setExpiryDate("");
      setDocumentNotes("");
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    reader.readAsDataURL(file);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const uploadDocument = async (doc: DocumentFile): Promise<DocumentFile> => {
    try {
      const { path, error } = await uploadFile('agents-documents', doc.file, agentId, `${doc.type}-${Date.now()}`);
      
      if (!path) {
        return { 
          ...doc, 
          uploading: false, 
          error: error ? error.message : "فشل رفع الملف إلى التخزين" 
        };
      }
      
      const result = await uploadDeliveryDocument({
        delivery_id: agentId,
        document_type: doc.type,
        document_url: path,
        expiry_date: doc.expiry_date,
        notes: doc.notes
      });
      
      if (!result) {
        return { 
          ...doc, 
          uploading: false, 
          error: "فشل تسجيل المستند في قاعدة البيانات" 
        };
      }

      // If the uploaded document is a profile image, update the profile_image_url
      if (result && doc.type === "profile_image") {
        if (!supabase) {
          toast({
            title: "خطأ في التهيئة",
            description: "لم يتم تهيئة عميل Supabase بشكل صحيح.",
            type: "error",
          });
        } else {
          const publicUrl = path; 

          if (!publicUrl) {
            toast({
                title: "خطأ في رابط الصورة",
                description: "فشل الحصول على رابط الصورة العام بعد الرفع.",
                type: "error",
            });
          } else {
            try {
              const updateResponse = await fetch('/api/agents/update-profile-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ agentId, imageUrl: publicUrl }),
              });

              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error("Error updating profile image URL via API:", errorData.error);
                toast({
                  title: "خطأ في تحديث الصورة",
                  description: `فشل تحديث رابط الصورة الشخصية: ${errorData.error || 'خطأ غير معروف في الخادم'}`,
                  type: "error",
                });
              } else {
                // console.log("Profile image URL updated successfully via API.");
              }
            } catch (apiError) {
              console.error("API call to update profile image failed:", apiError);
              toast({
                title: "خطأ في API",
                description: "فشل الاتصال بواجهة برمجة التطبيقات لتحديث الصورة الشخصية.",
                type: "error",
              });
            }
          }
        }
      }
      
      return { 
        ...doc, 
        uploading: false, 
        uploaded: true, 
        url: path 
      };
      
    } catch (error) {
      console.error("خطأ أثناء رفع المستند:", error);
      return { 
        ...doc, 
        uploading: false, 
        error: "حدث خطأ أثناء رفع المستند" 
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documents.length === 0) {
      setErrorMessage("يرجى إضافة مستند واحد على الأقل");
      return;
    }
    
    const missingExpiryDocuments = documents.filter(
      doc => requiresExpiryDate.includes(doc.type) && !doc.expiry_date
    );
    
    if (missingExpiryDocuments.length > 0) {
      setErrorMessage("يرجى إضافة تاريخ انتهاء الصلاحية للمستندات المطلوبة");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const uploadPromises = documents
        .filter(doc => !doc.uploaded)
        .map(doc => {
          setDocuments(prev => 
            prev.map(d => d.id === doc.id ? { ...d, uploading: true } : d)
          );
          return uploadDocument(doc);
        });
      
      const results = await Promise.all(uploadPromises);
      
      setDocuments(prev => 
        prev.map(doc => {
          const uploadedDoc = results.find(d => d.id === doc.id);
          return uploadedDoc || doc;
        })
      );
      
      const failedUploads = results.filter(doc => doc.error);
      
      if (failedUploads.length > 0) {
        setErrorMessage(`فشل رفع ${failedUploads.length} مستند(ات). يرجى المحاولة مرة أخرى.`);
      } else {
        setSuccessMessage("تم رفع جميع المستندات بنجاح");
        toast({
          title: "تم بنجاح",
          description: "تم رفع المستندات بنجاح",
          type: "success"
        });
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("خطأ أثناء رفع المستندات:", error);
      setErrorMessage("حدث خطأ أثناء رفع المستندات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm mb-6 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      {agentDetails && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full ml-3" />
              <div>
                <h3 className="text-lg font-medium">{agentDetails.full_name}</h3>
                <p className="text-sm text-muted-foreground">معرف المندوب: {agentId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoadingAgentDetails ? (
        <div className="w-full p-8 text-center">
          <p>جاري تحميل بيانات المندوب...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>رفع مستندات المندوب</CardTitle>
            <CardDescription>
              يرجى رفع المستندات المطلوبة للمندوب. المستندات المطلوبة تشمل صورة الهوية الوطنية ورخصة القيادة والصورة الشخصية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="document-type">نوع المستند</Label>
                    <select
                      id="document-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                      disabled={isSubmitting}
                    >
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {requiresExpiryDate.includes(selectedType) && (
                    <div>
                      <Label htmlFor="expiry-date">تاريخ انتهاء الصلاحية</Label>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <Input
                          id="expiry-date"
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={isSubmitting}
                          className="w-full"
                          required={requiresExpiryDate.includes(selectedType)}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">تاريخ انتهاء صلاحية المستند مطلوب</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="document-notes">ملاحظات (اختياري)</Label>
                  <Input
                    id="document-notes"
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية عن المستند"
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="document-file">الملف</Label>
                  <Input
                    ref={fileInputRef}
                    id="document-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={isSubmitting || (requiresExpiryDate.includes(selectedType) && !expiryDate)}
                    className="cursor-pointer"
                  />
                  {requiresExpiryDate.includes(selectedType) && !expiryDate && (
                    <p className="text-xs text-amber-500 mt-1">الرجاء تحديد تاريخ انتهاء الصلاحية أولاً</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`relative rounded-lg border p-4 flex flex-col ${
                        doc.uploading ? "bg-gray-50" : 
                        doc.error ? "bg-red-50 border-red-200" : 
                        doc.uploaded ? "bg-green-50 border-green-200" : "bg-white"
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeDocument(doc.id)}
                          disabled={isSubmitting || doc.uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <File className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium truncate">
                          {documentTypeLabels[doc.type]}
                        </span>
                      </div>
                      
                      <div className="h-32 overflow-hidden rounded-sm bg-gray-50 my-2">
                        {doc.file.type.startsWith("image/") ? (
                          <img
                            src={doc.preview}
                            alt={doc.file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <File className="h-10 w-10 text-gray-400" />
                            <span className="text-sm text-gray-500 mt-2">{doc.file.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {doc.expiry_date && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="font-medium">تاريخ الانتهاء:</span> {doc.expiry_date}
                        </div>
                      )}
                      
                      {doc.notes && (
                        <div className="mt-1 text-xs text-gray-600 truncate">
                          <span className="font-medium">ملاحظات:</span> {doc.notes}
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs">
                        {doc.uploading && (
                          <span className="text-blue-600">جاري الرفع...</span>
                        )}
                        {doc.error && (
                          <span className="text-red-600">{doc.error}</span>
                        )}
                        {doc.uploaded && (
                          <span className="text-green-600">تم الرفع بنجاح</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {documents.length === 0 && (
                    <div className="col-span-full text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">لم يتم إضافة أي مستندات بعد</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  رجوع
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || documents.length === 0}
                  className={isSubmitting ? "cursor-not-allowed opacity-70" : ""}
                >
                  {isSubmitting ? "جاري الرفع..." : "رفع المستندات"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 