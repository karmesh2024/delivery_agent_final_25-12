import React, { useState, useEffect } from 'react';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { ApprovedAgent, UpdateAgentPayload, AgentDocument, GeographicZone, AgentCommission, ApprovedAgentZone, NewApprovedAgentZone, CommissionType, CommissionUnit, DocumentType, documentTypeLabels } from '@/types';
import { useToast } from '@/shared/ui/use-toast';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { PlusCircledIcon, MinusCircledIcon } from '@radix-ui/react-icons';
import { Switch } from '@/shared/ui/switch'; // Assuming a Switch component exists
import { Checkbox } from '@/shared/ui/checkbox'; // Assuming a Checkbox component exists
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';


interface DocumentUploadItem {
  id?: string;
  document_type: DocumentType;
  file: File | null;
  document_url?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
}

interface EditApprovedAgentPageProps {
  agentId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const EditApprovedAgentPage: React.FC<EditApprovedAgentPageProps> = ({ agentId, onComplete, onCancel }) => {
  console.log("EditApprovedAgentPage rendered. agentId:", agentId);
  const { toast } = useToast();

  const [agent, setAgent] = useState<ApprovedAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<UpdateAgentPayload>({});
  const [commissionInputs, setCommissionInputs] = useState<AgentCommission[]>([]);
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<NewApprovedAgentZone[]>([]);
  const [documentUploads, setDocumentUploads] = useState<DocumentUploadItem[]>([]);
  const [approvedStatus, setApprovedStatus] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("basic-info"); // New state for active tab
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null); // New state for avatar file

  useEffect(() => {
    console.log("EditApprovedAgentPage useEffect triggered. agentId:", agentId);

    if (!agentId) {
      setError("معرف الوكيل غير متوفر.");
      setIsLoading(false);
      return;
    }

    const fetchAgentAndZones = async () => {
      console.log("fetchAgentAndZones started for agentId:", agentId);
      setIsLoading(true);
      setError(null);
      try {
        const { agent: fetchedAgent, error: agentError } = await approvedAgentService.getApprovedAgentSummary(agentId);
        if (agentError) {
          throw new Error(agentError);
        }
        if (!fetchedAgent) {
          throw new Error("لم يتم العثور على بيانات الوكيل.");
        }

        setAgent(fetchedAgent);
        console.log("Agent data set to:", fetchedAgent);
        console.log("Initial formState values from fetchedAgent:", {
          full_name: fetchedAgent.profile?.full_name || fetchedAgent.full_name || undefined,
          phone: fetchedAgent.profile?.phone || fetchedAgent.phone || undefined,
          email: fetchedAgent.profile?.email || fetchedAgent.email || undefined,
          avatar_url: fetchedAgent.profile?.avatar_url || undefined,
          billing_address: fetchedAgent.profile?.billing_address || undefined,
          payment_info: fetchedAgent.profile?.payment_info || undefined,
        });
        setFormState({
          full_name: fetchedAgent.profile?.full_name || fetchedAgent.full_name || undefined,
          phone: fetchedAgent.profile?.phone || fetchedAgent.phone || undefined,
          email: fetchedAgent.profile?.email || fetchedAgent.email || undefined,
          storage_location: fetchedAgent.details?.storage_location || undefined,
          region: fetchedAgent.details?.region || undefined,
          agent_type: fetchedAgent.details?.agent_type || undefined,
          payment_method: fetchedAgent.details?.payment_method || undefined,
          function_specific_commissions: fetchedAgent.details?.function_specific_commissions || [],
          approved: fetchedAgent.details?.approved || false,
          notes: fetchedAgent.details?.notes || undefined,
          avatar_url: fetchedAgent.profile?.avatar_url || undefined,
          billing_address: fetchedAgent.profile?.billing_address || undefined,
          payment_info: fetchedAgent.profile?.payment_info || undefined,
          initial_balance: fetchedAgent.wallet?.balance || undefined,
          currency: fetchedAgent.wallet?.currency || undefined,
          wallet_type: fetchedAgent.wallet?.wallet_type || undefined,
        });
        setCommissionInputs(fetchedAgent.details?.function_specific_commissions || []);
        
        // Map existing ApprovedAgentZone to NewApprovedAgentZone for form state
        const mappedSelectedZones: NewApprovedAgentZone[] = (fetchedAgent.approved_agent_zones || []).map(zone => ({
          agent_id: zone.agent_id || agentId, // Ensure agent_id is always a string
          geographic_zone_id: zone.geographic_zone_id || '', // Ensure not null
          zone_name: zone.zone_name,
          is_active: zone.is_active || false,
          is_primary: zone.is_primary || false,
        }));
        setSelectedZones(mappedSelectedZones);

        setApprovedStatus(fetchedAgent.details?.approved || false);

        // Initialize document uploads with existing documents
        const existingDocuments: DocumentUploadItem[] = (fetchedAgent.documents || []).map(doc => ({
          id: doc.id,
          document_type: doc.document_type,
          file: null, // No file initially for existing documents
          document_url: doc.document_url,
          verification_status: doc.verification_status,
        }));
        setDocumentUploads(existingDocuments);

        // Fetch geographic zones
        const { data: fetchedZones, error: zonesError } = await approvedAgentService.getGeographicZones();
        if (zonesError) {
          console.error("Error fetching geographic zones:", zonesError);
          // Don't throw fatal error, just log. Zones might not be critical for basic edit.
        }
        setZones(fetchedZones || []);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء جلب بيانات الوكيل.";
        setError(errorMessage);
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        console.log("fetchAgentAndZones finished. Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    fetchAgentAndZones();
  }, [agentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string | boolean) => {
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleCommissionChange = (index: number, field: keyof AgentCommission, value: string | number) => {
    const newCommissions = [...commissionInputs];
    const updatedCommission = { ...newCommissions[index] };

    if (field === 'value') {
      updatedCommission.value = parseFloat(value as string);
    } else if (field === 'type') {
      updatedCommission.type = value as CommissionType;
    } else if (field === 'unit') {
      updatedCommission.unit = value as CommissionUnit;
    }

    newCommissions[index] = updatedCommission;
    setCommissionInputs(newCommissions);
    setFormState(prevState => ({ ...prevState, function_specific_commissions: newCommissions }));
  };

  const addCommission = () => {
    setCommissionInputs(prev => [...prev, { type: 'other', value: 0, unit: 'fixed_amount' }]);
  };

  const removeCommission = (index: number) => {
    const newCommissions = commissionInputs.filter((_, i) => i !== index);
    setCommissionInputs(newCommissions);
    setFormState(prevState => ({ ...prevState, function_specific_commissions: newCommissions }));
  };

  const handleZoneSelection = (zone: GeographicZone, isSelected: boolean) => {
    if (!agentId) return; // Should ideally not happen if route is guarded
    
    let updatedSelectedZones: NewApprovedAgentZone[];
    if (isSelected) {
      updatedSelectedZones = [...selectedZones, {
        agent_id: agentId, // agentId is guaranteed to be a string here
        geographic_zone_id: zone.id,
        zone_name: zone.name,
        is_active: true,
        is_primary: false, // Default to false, can be changed later if needed
      }];
    } else {
      updatedSelectedZones = selectedZones.filter(selectedZone => selectedZone.geographic_zone_id !== zone.id);
    }
    setSelectedZones(updatedSelectedZones);

    // Update formState with the new selectedZones, ensuring it's also of NewApprovedAgentZone[] type
    setFormState(prevState => ({
      ...prevState,
      approved_agent_zones: updatedSelectedZones,
    }));
  };

  const handleDocumentFileChange = (index: number, file: File) => {
    const newDocuments = [...documentUploads];
    newDocuments[index].file = file;
    setDocumentUploads(newDocuments);
  };

  const addDocumentField = () => {
    setDocumentUploads(prev => [...prev, { document_type: 'national_id_front', file: null }]);
  };

  const removeDocumentField = (index: number) => {
    setDocumentUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleApprovedToggle = (checked: boolean) => {
    setApprovedStatus(checked);
    setFormState(prevState => ({ ...prevState, approved: checked }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatarFile(e.target.files[0]);
    }
  };

  const handleUpdateSection = async (section: 'basic-info' | 'details' | 'commissions' | 'zones' | 'wallet' | 'documents') => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      switch (section) {
        case 'basic-info':
          let currentAvatarUrl = formState.avatar_url; // Initialize with current form state avatar
          if (newAvatarFile) {
            try {
              const { publicUrl, error: uploadError } = await approvedAgentService.uploadAgentDocument(
                agentId,
                newAvatarFile,
                'personal_photo'
              );
              if (uploadError) {
                throw new Error(`خطأ في رفع الصورة الشخصية: ${uploadError}`);
              }
              if (publicUrl) {
                currentAvatarUrl = publicUrl;
                setNewAvatarFile(null); // Clear the file input after successful upload
              } else {
                throw new Error("لم يتم استلام رابط الصورة الشخصية بعد الرفع.");
              }
            } catch (uploadErr: unknown) {
              const uploadErrorMessage = uploadErr instanceof Error ? uploadErr.message : "حدث خطأ غير متوقع أثناء رفع الصورة الشخصية.";
              toast({
                title: "خطأ",
                description: uploadErrorMessage,
                variant: "destructive",
              });
              setIsLoading(false);
              return; // Stop the update process if avatar upload fails
            }
          }

          console.log("Payload for updateAgentProfile:", {
            full_name: formState.full_name,
            email: formState.email,
            phone: formState.phone,
            avatar_url: currentAvatarUrl,
            billing_address: formState.billing_address,
            payment_info: formState.payment_info,
          });
          const { success: profileUpdateSuccess, error: profileUpdateError } = await approvedAgentService.updateAgentProfile(agentId, {
            full_name: formState.full_name,
            email: formState.email,
            phone: formState.phone,
            avatar_url: currentAvatarUrl, // Use the potentially new URL
            billing_address: formState.billing_address,
            payment_info: formState.payment_info,
          });

          if (!profileUpdateSuccess) {
            console.error('Error updating agent profile:', profileUpdateError);
            toast({
              title: "خطأ",
              description: profileUpdateError || "حدث خطأ غير متوقع أثناء تحديث الملف الشخصي.",
              variant: "destructive",
            });
            return;
          }
          break; // End of basic-info case

        case 'details':
          const { error: detailsUpdateError } = await approvedAgentService.updateApprovedAgentDetails(agentId, {
            storage_location: formState.storage_location,
            region: formState.region,
            agent_type: formState.agent_type === null ? undefined : formState.agent_type,
            payment_method: formState.payment_method,
            notes: formState.notes,
            approved: formState.approved,
          });

          if (detailsUpdateError) {
            console.error('Error updating agent details:', detailsUpdateError);
            toast({
              title: "خطأ",
              description: detailsUpdateError || "حدث خطأ غير متوقع أثناء تحديث التفاصيل.",
              variant: "destructive",
            });
            return;
          }
          break; // End of details case

        case 'commissions':
          // For now, it's part of details update. If commissionInputs are changed, `details` case will handle it.
          const { error: commissionsUpdateError } = await approvedAgentService.updateApprovedAgentDetails(agentId, {
            function_specific_commissions: commissionInputs,
          });
          if (commissionsUpdateError) {
            console.error('Error updating commissions:', commissionsUpdateError);
            toast({
              title: "خطأ",
              description: commissionsUpdateError || "حدث خطأ غير متوقع أثناء تحديث العمولات.",
              variant: "destructive",
            });
            return;
          }
          break;

        case 'zones':
          if (!agent) {
            toast({
              title: "خطأ",
              description: "بيانات الوكيل غير متوفرة لتحديث المناطق.",
              variant: "destructive",
            });
            return; // Stop if agent data is not available
          }

          const existingZoneIds = new Set(agent.approved_agent_zones?.map(z => z.geographic_zone_id) || []);
          const newSelectedZoneIds = new Set(selectedZones.map(z => z.geographic_zone_id));

          const zonesToAdd = selectedZones.filter(zone => !existingZoneIds.has(zone.geographic_zone_id));
          const zonesToDelete = agent.approved_agent_zones?.filter(zone => !newSelectedZoneIds.has(zone.geographic_zone_id ?? '')) || [];

          console.log("Zones to Add:", zonesToAdd);
          console.log("Zones to Delete:", zonesToDelete);

          let hasErrors = false;

          // Add new zones
          for (const zone of zonesToAdd) {
            console.log("Attempting to add zone:", zone);
            const { error: addError } = await approvedAgentService.addApprovedAgentZone(zone);
            if (addError) {
              console.error("Error adding zone:", addError);
              toast({
                title: "خطأ",
                description: `فشل إضافة المنطقة ${zone.zone_name}: ${addError}`,
                variant: "destructive",
              });
              hasErrors = true;
            }
          }

          // Delete removed zones
          for (const zone of zonesToDelete) {
            console.log("Attempting to delete zone:", zone.id); // Assuming zone.id is the ID of the approved_agent_zone record
            // We need the ID of the approved_agent_zone record, not the geographic_zone_id for deletion
            // Find the full approved_agent_zone object to get its ID
            const approvedZoneToDelete = agent.approved_agent_zones?.find(az => az.geographic_zone_id === zone.geographic_zone_id);
            if (approvedZoneToDelete && approvedZoneToDelete.id) {
              const { error: deleteError } = await approvedAgentService.deleteApprovedAgentZone(approvedZoneToDelete.id as string);
              if (deleteError) {
                console.error("Error deleting zone:", deleteError);
                toast({
                  title: "خطأ",
                  description: `فشل حذف المنطقة ${zone.zone_name}: ${deleteError}`,
                  variant: "destructive",
                });
                hasErrors = true;
              }
            } else {
              console.warn("Could not find approved_agent_zone ID for deletion:", zone);
            }
          }

          if (hasErrors) {
            return; // Stop if any errors occurred during zone updates
          }
          break;

        case 'wallet':
          // Assuming wallet updates might go via `updateAgentProfile` or a dedicated wallet service.
          // Since no direct wallet update function in approvedAgentService, assuming it's part of profile or not implemented.
          toast({
            title: "تنبيه",
            description: "تحديث تفاصيل المحفظة غير مدعوم حاليًا في هذا القسم.",
            variant: "default",
          });
          break;

        case 'documents':
          // Document handling is more complex due to file uploads.
          // This case should likely re-iterate through `documentUploads` state,
          // upload new files, then record their info.
          // Also handle verification status updates for existing documents.
          // For simplicity, I will leave it as a placeholder/future implementation for now.
          toast({
            title: "تنبيه",
            description: "تحديث المستندات غير مدعوم حاليًا في هذا القسم.",
            variant: "default",
          });
          break;

        default:
          console.warn("Unhandled section update:", section);
          setIsLoading(false);
          return;
      }

      // After successful update of a section, re-fetch agent summary to refresh the UI
      const { agent: refetchedAgent, error: refetchError } = await approvedAgentService.getApprovedAgentSummary(agentId);
      console.log("Refetched agent after update:", refetchedAgent);
      if (refetchError) {
        console.error('Error refetching agent after update:', refetchError);
        toast({
          title: "خطأ",
          description: refetchError || "خطأ في جلب بيانات الوكيل بعد التحديث.",
          variant: "destructive",
        });
        return;
      }

      if (refetchedAgent) {
        setAgent(refetchedAgent);
        setFormState({
          full_name: refetchedAgent.profile?.full_name || refetchedAgent.full_name || undefined,
          phone: refetchedAgent.profile?.phone || refetchedAgent.phone || undefined,
          email: refetchedAgent.profile?.email || refetchedAgent.email || undefined,
          storage_location: refetchedAgent.details?.storage_location || undefined,
          region: refetchedAgent.details?.region || undefined,
          agent_type: refetchedAgent.details?.agent_type || undefined,
          payment_method: refetchedAgent.details?.payment_method || undefined,
          function_specific_commissions: refetchedAgent.details?.function_specific_commissions || [],
          approved: refetchedAgent.details?.approved || false,
          notes: refetchedAgent.details?.notes || undefined,
          avatar_url: refetchedAgent.profile?.avatar_url || undefined,
          billing_address: refetchedAgent.profile?.billing_address || undefined,
          payment_info: refetchedAgent.profile?.payment_info || undefined,
          initial_balance: refetchedAgent.wallet?.balance || undefined,
          currency: refetchedAgent.wallet?.currency || undefined,
          wallet_type: refetchedAgent.wallet?.wallet_type || undefined,
        });
        setCommissionInputs(refetchedAgent.details?.function_specific_commissions || []);
        const mappedSelectedZones: NewApprovedAgentZone[] = (refetchedAgent.approved_agent_zones || []).map(zone => ({
          agent_id: zone.agent_id || agentId,
          geographic_zone_id: zone.geographic_zone_id || '',
          zone_name: zone.zone_name,
          is_active: zone.is_active || false,
          is_primary: zone.is_primary || false,
        }));
        setSelectedZones(mappedSelectedZones);
        setApprovedStatus(refetchedAgent.details?.approved || false);
        const existingDocuments: DocumentUploadItem[] = (refetchedAgent.documents || []).map(doc => ({
          id: doc.id,
          document_type: doc.document_type,
          file: null,
          document_url: doc.document_url,
          verification_status: doc.verification_status,
        }));
        setDocumentUploads(existingDocuments);
      }

      toast({
        title: "نجاح",
        description: "تم تحديث بيانات الوكيل بنجاح!",
        variant: "default",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحديث بيانات الوكيل.";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل بيانات الوكيل للتعديل...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">خطأ: {error}</div>;
  }

  if (!agent) {
    return <div className="text-center py-8 text-gray-500">لا توجد بيانات للوكيل المراد تعديله.</div>;
  }

  // دالة مساعدة لتعريب أسماء المستندات (يمكن إعادة استخدامها من ApprovedAgentSummary)
  const localizeDocumentType = (docType: string): string => {
    switch (docType) {
      case "national_id_front":
        return "الهوية الوطنية (الوجه الأمامي)";
      case "national_id_back":
        return "الهوية الوطنية (الوجه الخلفي)";
      case "personal_photo":
        return "الصورة الشخصية";
      case "driving_license_front":
        return "رخصة القيادة (الوجه الأمامي)";
      case "driving_license_back":
        return "رخصة القيادة (الوجه الخلفي)";
      case "vehicle_registration":
        return "استمارة السيارة";
      case "car_insurance":
        return "تأمين السيارة";
      case "medical_report":
        return "التقرير الطبي";
      case "criminal_record":
        return "صحيفة الحالة الجنائية";
      default:
        return docType;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-right">تعديل بيانات الوكيل: {agent.profile?.full_name || agent.full_name || agent.id}</CardTitle>
          <p className="text-right text-gray-600">قم بتحديث معلومات الوكيل والمستندات الناقصة.</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap w-full bg-gray-100 p-1 rounded-md text-gray-600 justify-evenly">
              <TabsTrigger value="basic-info" className="flex-1">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">التفاصيل</TabsTrigger>
              <TabsTrigger value="commissions" className="flex-1">عمولات الوظائف</TabsTrigger>
              <TabsTrigger value="zones" className="flex-1">المناطق</TabsTrigger>
              <TabsTrigger value="wallet" className="flex-1">تفاصيل المحفظة</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">المستندات</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name" className="text-right">الاسم الكامل</Label>
                  <Input id="full_name" value={formState.full_name || ''} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
                  <Input id="phone" value={formState.phone || ''} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="email" className="text-right">البريد الإلكتروني</Label>
                  <Input id="email" type="email" value={formState.email || ''} onChange={handleChange} />
                </div>
                <div className="col-span-2">
                  <Label className="text-right">الصورة الشخصية</Label>
                  <div className="flex items-center gap-4 mt-2 justify-end">
                    {formState.avatar_url ? (
                      <img src={formState.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">لا توجد صورة</div>
                    )}
                    <Input
                      id="avatar_file_upload"
                      type="file"
                      className="w-fit"
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                    />
                  </div>
                  {newAvatarFile && <p className="text-sm text-gray-500 text-right mt-1">ملف الصورة الجديد: {newAvatarFile.name}</p>}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => handleUpdateSection('basic-info')} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث المعلومات الأساسية"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storage_location" className="text-right">موقع التخزين</Label>
                  <Input id="storage_location" value={formState.storage_location || ''} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="region" className="text-right">المنطقة</Label>
                  <Input id="region" value={formState.region || ''} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="agent_type" className="text-right">نوع الوكيل</Label>
                  <Select onValueChange={(value) => handleSelectChange('agent_type', value)} value={formState.agent_type || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الوكيل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فردي</SelectItem>
                      <SelectItem value="company">شركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method" className="text-right">طريقة الدفع</Label>
                  <Input id="payment_method" value={formState.payment_method || ''} onChange={handleChange} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="notes" className="text-right">ملاحظات</Label>
                  <Textarea id="notes" value={formState.notes || ''} onChange={handleChange} rows={3} />
                </div>
              </div>
              <div className="flex items-center space-x-2 justify-end p-4 border rounded-md">
                <Label htmlFor="approved" className="text-base font-semibold">تمت الموافقة على الوكيل</Label>
                <Switch
                  id="approved"
                  checked={approvedStatus}
                  onCheckedChange={handleApprovedToggle}
                  aria-label="Toggle agent approval status"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => handleUpdateSection('details')} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث التفاصيل"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="commissions" className="mt-6 space-y-6">
              <div className="space-y-4">
                {commissionInputs.map((commission, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-4 p-4 border rounded-md">
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor={`commission-type-${index}`} className="text-right">النوع</Label>
                      <Select onValueChange={(value) => handleCommissionChange(index, 'type', value)} value={commission.type}>
                        <SelectTrigger id={`commission-type-${index}`}>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waste_purchase">شراء النفايات</SelectItem>
                          <SelectItem value="product_sale">بيع المنتجات</SelectItem>
                          <SelectItem value="cash_withdrawal">سحب نقدي</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Label htmlFor={`commission-value-${index}`} className="text-right">القيمة</Label>
                      <Input
                        id={`commission-value-${index}`}
                        type="number"
                        value={commission.value}
                        onChange={(e) => handleCommissionChange(index, 'value', e.target.value)}
                        step="0.01"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label htmlFor={`commission-unit-${index}`} className="text-right">الوحدة</Label>
                      <Select onValueChange={(value) => handleCommissionChange(index, 'unit', value)} value={commission.unit}>
                        <SelectTrigger id={`commission-unit-${index}`}>
                          <SelectValue placeholder="اختر الوحدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">نسبة مئوية</SelectItem>
                          <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeCommission(index)}>
                      <MinusCircledIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCommission} className="w-full flex items-center gap-2">
                  <PlusCircledIcon className="h-4 w-4" /> إضافة عمولة جديدة
                </Button>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => handleUpdateSection('commissions')} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث العمولات"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="zones" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map(zone => (
                  <div key={zone.id} className="flex items-center space-x-2 p-2 border rounded-md justify-end">
                    <Label htmlFor={`zone-${zone.id}`} className="flex-1 text-right cursor-pointer">{zone.name}</Label>
                    <Checkbox
                      id={`zone-${zone.id}`}
                      checked={selectedZones.some(selected => selected.geographic_zone_id === zone.id)}
                      onCheckedChange={(checked) => handleZoneSelection(zone, checked === true)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => handleUpdateSection('zones')} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث المناطق"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initial_balance" className="text-right">الرصيد الأولي</Label>
                  <Input id="initial_balance" type="number" value={formState.initial_balance || 0} onChange={handleChange} step="0.01" />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-right">العملة</Label>
                  <Input id="currency" value={formState.currency || 'SAR'} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="wallet_type" className="text-right">نوع المحفظة</Label>
                  <Input id="wallet_type" value={formState.wallet_type || 'AGENT_WALLET'} onChange={handleChange} />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={() => handleUpdateSection('wallet')} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث تفاصيل المحفظة"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-6 space-y-6">
              <div className="space-y-4">
                {documentUploads.map((doc, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-4 p-4 border rounded-md">
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor={`doc-type-${index}`} className="text-right">نوع المستند</Label>
                      <Select
                        value={doc.document_type}
                        onValueChange={(value) => {
                          const newDocs = [...documentUploads];
                          newDocs[index].document_type = value as DocumentType;
                          setDocumentUploads(newDocs);
                        }}
                      >
                        <SelectTrigger id={`doc-type-${index}`}>
                          <SelectValue placeholder="اختر نوع المستند" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(documentTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor={`doc-file-${index}`} className="text-right">تحميل ملف جديد</Label>
                      <Input
                        id={`doc-file-${index}`}
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentFileChange(index, e.target.files[0]);
                          }
                        }}
                      />
                      {doc.document_url && <p className="text-xs text-gray-500 mt-1 text-right">المستند الحالي: <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">عرض</a></p>}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor={`doc-status-${index}`} className="text-right">حالة التحقق</Label>
                      <Select onValueChange={async (value) => {
                        const newStatus = value as 'pending' | 'approved' | 'rejected';
                        const newDocs = [...documentUploads];
                        newDocs[index].verification_status = newStatus;
                        setDocumentUploads(newDocs);

                        if (doc.id) {
                            // Call API to update status if it's an existing document
                            console.log(`Attempting to update status for document ${doc.id} to ${newStatus}`);
                            const { error: statusUpdateError } = await approvedAgentService.updateAgentDocumentStatus(doc.id, newStatus);
                            if (statusUpdateError) {
                                toast({
                                    title: "خطأ في تحديث حالة المستند",
                                    description: statusUpdateError,
                                    variant: "destructive",
                                });
                                // Revert UI state if API call fails
                                setDocumentUploads(prevDocs => {
                                    const revertedDocs = [...prevDocs];
                                    const originalDoc = agent?.documents?.find(d => d.id === doc.id);
                                    if (originalDoc) {
                                        revertedDocs[index].verification_status = originalDoc.verification_status;
                                    }
                                    return revertedDocs;
                                });
                            } else {
                                toast({
                                    title: "نجاح",
                                    description: "تم تحديث حالة المستند بنجاح!",
                                    variant: "default",
                                });
                                // After successful update, re-fetch agent summary to refresh the UI with latest data
                                const { agent: refetchedAgent, error: refetchError } = await approvedAgentService.getApprovedAgentSummary(agentId);
                                if (refetchError) {
                                    console.error('Error refetching agent after document status update:', refetchError);
                                } else if (refetchedAgent) {
                                    setAgent(refetchedAgent);
                                    // Also update documentUploads state to reflect the fetched data
                                    const updatedDocumentUploads = (refetchedAgent.documents || []).map(d => ({
                                        id: d.id,
                                        document_type: d.document_type,
                                        file: null,
                                        document_url: d.document_url,
                                        verification_status: d.verification_status,
                                    }));
                                    setDocumentUploads(updatedDocumentUploads);
                                }
                            }
                        }
                      }} value={doc.verification_status || 'pending'}>
                        <SelectTrigger id={`doc-status-${index}`}>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">معلق</SelectItem>
                          <SelectItem value="approved">موافق عليه</SelectItem>
                          <SelectItem value="rejected">مرفوض</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={async () => {
                      if (doc.id) {
                        // Confirm deletion for existing documents
                        if (window.confirm("هل أنت متأكد أنك تريد حذف هذا المستند؟ هذا الإجراء لا يمكن التراجع عنه.")) {
                          const { error: deleteError } = await approvedAgentService.deleteAgentDocument(doc.id);
                          if (deleteError) {
                            toast({
                              title: "خطأ في حذف المستند",
                              description: deleteError,
                              variant: "destructive",
                            });
                            return;
                          }
                          toast({
                            title: "نجاح",
                            description: "تم حذف المستند بنجاح!",
                            variant: "default",
                          });
                        }
                      } else {
                        // For new documents not yet uploaded, just remove from UI
                        removeDocumentField(index);
                      }
                      // After deletion (or removal of new document), refresh UI
                      const { agent: refetchedAgent, error: refetchError } = await approvedAgentService.getApprovedAgentSummary(agentId);
                      if (refetchError) {
                        console.error('Error refetching agent after document deletion:', refetchError);
                      } else if (refetchedAgent) {
                        setAgent(refetchedAgent);
                        const updatedDocumentUploads = (refetchedAgent.documents || []).map(d => ({
                          id: d.id,
                          document_type: d.document_type,
                          file: null,
                          document_url: d.document_url,
                          verification_status: d.verification_status,
                        }));
                        setDocumentUploads(updatedDocumentUploads);
                      }
                    }}>
                      <MinusCircledIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addDocumentField} className="w-full flex items-center gap-2">
                  <PlusCircledIcon className="h-4 w-4" /> إضافة مستند جديد
                </Button>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="button" onClick={async () => {
                  if (!agentId) return;

                  setIsLoading(true);
                  setError(null);

                  try {
                    const documentOperations: Promise<{ publicUrl: string | null; error: string | null }>[] = [];

                    for (const doc of documentUploads) {
                        if (doc.file) { // Only process if a file is selected
                            if (doc.id) { // Existing document being updated with a new file
                                console.log(`Updating document ${doc.id} with new file for agent ${agentId}`);
                                documentOperations.push(
                                    approvedAgentService.updateAgentDocument(doc.id, agentId, doc.file, doc.document_type)
                                        .then(res => {
                                            if (res.error) {
                                                toast({
                                                    title: "خطأ في تحديث المستند بملف جديد",
                                                    description: res.error,
                                                    variant: "destructive",
                                                });
                                                throw new Error(res.error); 
                                            }
                                            return res;
                                        })
                                );
                            } else { // New document being uploaded
                                console.log(`Uploading new document of type ${doc.document_type} for agent ${agentId}`);
                                documentOperations.push(
                                    approvedAgentService.uploadAgentDocument(agentId, doc.file, doc.document_type)
                                        .then(res => {
                                            if (res.error) {
                                                toast({
                                                    title: "خطأ في رفع مستند جديد",
                                                    description: res.error,
                                                    variant: "destructive",
                                                });
                                                throw new Error(res.error);
                                            }
                                            return res;
                                        })
                                );
                            }
                        }
                    }

                    await Promise.all(documentOperations);

                    toast({
                        title: "نجاح",
                        description: "تم تحديث المستندات بنجاح!",
                        variant: "default",
                    });
                    // After successful update of documents, re-fetch agent summary to refresh the UI
                    const { agent: refetchedAgent, error: refetchError } = await approvedAgentService.getApprovedAgentSummary(agentId);
                    console.log("Refetched agent after document update:", refetchedAgent);
                    if (refetchError) {
                        console.error('Error refetching agent after document update:', refetchError);
                        toast({
                            title: "خطأ",
                            description: refetchError || "خطأ في جلب بيانات الوكيل بعد تحديث المستندات.",
                            variant: "destructive",
                        });
                    } else if (refetchedAgent) {
                        setAgent(refetchedAgent);
                        // Update documentUploads state to reflect the fetched data
                        const updatedDocumentUploads = (refetchedAgent.documents || []).map(d => ({
                            id: d.id,
                            document_type: d.document_type,
                            file: null,
                            document_url: d.document_url,
                            verification_status: d.verification_status,
                        }));
                        setDocumentUploads(updatedDocumentUploads);
                    }

                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحديث المستندات.";
                    toast({
                      title: "خطأ",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }

                }} disabled={isLoading}>
                  {isLoading ? "جاري التحديث..." : "تحديث المستندات"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <div className="flex justify-between mt-8 p-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </Card>
    </div>
  );
}; 