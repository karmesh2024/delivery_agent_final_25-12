/**
 * صفحة الوكلاء المعتمدين - معدلة لاستخدام هيكل DDD و Redux
 */

"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchApprovedAgents, deleteApprovedAgent } from '@/domains/approved-agents/store/approvedAgentsSlice';
import { NewAgentPayload, AgentStatus, ApprovedAgent, DocumentType } from '@/types';
import { useToast } from '@/shared/ui/toast';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { FiAlertCircle, FiUserPlus, FiUsers } from "react-icons/fi";
import { AgentStatusFilter } from "@/components/AgentStatusFilter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { supabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button } from "@/shared/ui/button";
import Link from 'next/link';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';

// Define the type for a join request
interface JoinRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
  business_type: string;
  status: 'pending' | 'approved' | 'rejected';
}

// استيراد المكونات التي قد تكون مشتركة أو مخصصة للوكلاء
import { 
  ApprovedAgentCard, 
  ApprovedAgentDetail, 
  ApprovedAgentBasicInfoForm,
  ApprovedAgentDetailsForm,
  EditApprovedAgentForm,
  UploadApprovedAgentDocuments,
  ApprovedAgentZonesManager,
  ApprovedAgentSummary,
} from "@/domains/approved-agents/components";
import { EditApprovedAgentPage } from "@/domains/approved-agents/pages/EditApprovedAgentPage";

export default function ApprovedAgentsPage() {
  const dispatch = useAppDispatch();
  const { items: newAgents, status, error } = useAppSelector(state => state.approvedAgents);
  const { toast } = useToast();

  const isLoading = status === 'loading';

  const [filteredAgents, setFilteredAgents] = useState<ApprovedAgent[]>([]);
  const [activeStatus, setActiveStatus] = useState<AgentStatus>("all");
  const [selectedAgent, setSelectedAgent] = useState<ApprovedAgent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<{
    hasCredentials: boolean;
    error: string | null;
    message: string;
  }>({ 
    hasCredentials: false,
    error: null,
    message: 'جاري التحقق من الاتصال...'
  });

  // حالات إضافة وكيل معتمد جديد
  const [newApprovedAgentId, setNewApprovedAgentId] = useState<string | null>(null);
  const [currentSubTab, setCurrentSubTab] = useState("basic-info");
  const [newApprovedAgentPassword, setNewApprovedAgentPassword] = useState<string | null>(null);
  
  // حالة لطلبات الوكلاء الجدد
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // New state for stepper step completion
  const [stepCompletion, setStepCompletion] = useState({
    basicInfo: false,
    details: false,
    documents: false,
    zones: false,
    summary: false,
  });

  const [overallProgress, setOverallProgress] = useState(0);
  const [documentsUploadedCount, setDocumentsUploadedCount] = useState(0);
  const [documentsTotalRequired, setDocumentsTotalRequired] = useState(0);
  const [missingDocumentsList, setMissingDocumentsList] = useState<string[]>([]);
  const [selectedAgentMissingDocuments, setSelectedAgentMissingDocuments] = useState<string[]>([]);

  // New state for editing agent
  const [editingAgent, setEditingAgent] = useState<ApprovedAgent | null>(null);

  // إضافة متغير حالة جديد لتتبع حالة النافذة المنبثقة للتعديل
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New state for join request detail dialog
  const [selectedJoinRequest, setSelectedJoinRequest] = useState<JoinRequest | null>(null);
  const [isJoinRequestDetailOpen, setIsJoinRequestDetailOpen] = useState(false);

  // التحقق من اتصال Redux
  useEffect(() => {
    async function checkConnection() {
      try {
        // التحقق من وجود عميل Supabase
        if (!supabase) {
          throw new Error("Supabase client is not initialized.");
        }
        setConnectionInfo({
          hasCredentials: true,
          error: null,
          message: "تم الاتصال بنجاح. جاري جلب بيانات الوكلاء المعتمدين..."
        });
      } catch (e) {
        setConnectionInfo({
          hasCredentials: true,
          error: e instanceof Error ? e.message : 'خطأ غير معروف',
          message: 'حدث خطأ أثناء اختبار الاتصال'
        });
      }
    }
    checkConnection();
  }, []);

  // جلب بيانات الوكلاء المعتمدين باستخدام Redux
  useEffect(() => {
    dispatch(fetchApprovedAgents());
  }, [dispatch]);

  // جلب بيانات طلبات الوكلاء الجدد
  useEffect(() => {
    async function fetchJoinRequests() {
      setIsLoadingJoinRequests(true);
      try {
        const { data, error } = (await supabase?.from('join_requests')
          .select('*')
          .order('created_at', { ascending: false })) || { data: null, error: new Error('Supabase client is not initialized') };
          
        if (error) throw error;
        setJoinRequests(data || []);
      } catch (error) {
        console.error('Error fetching join requests:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب طلبات الوكلاء الجدد",
          type: "error",
        });
      } finally {
        setIsLoadingJoinRequests(false);
      }
    }
    
    if (activeTab === 'joinRequests') {
      fetchJoinRequests();
    }
  }, [activeTab, toast]);

  // Handle approving a join request
  const handleApproveRequest = async (request: JoinRequest) => {
    if (!request.id) return;

    const { success, error } = await approvedAgentService.updateJoinRequestStatus(request.id, 'approved');
    
    if (success) {
      toast({
        title: "تمت الموافقة",
        description: `تمت الموافقة على طلب ${request.name} بنجاح.`, 
        type: "success",
      });
      // Optionally, create a new approved agent here or trigger another flow
      // After approval, refresh the list of join requests
      await (async () => {
        const { data, error } = (await supabase?.from('join_requests')
          .select('*')
          .order('created_at', { ascending: false })) || { data: null, error: new Error('Supabase client is not initialized') };
        if (error) console.error('Error re-fetching join requests:', error);
        setJoinRequests(data || []);
      })();

    } else {
      toast({
        title: "خطأ",
        description: error || `فشل الموافقة على طلب ${request.name}.`,
        type: "error",
      });
    }
  };

  // Handle rejecting a join request
  const handleRejectRequest = async (request: JoinRequest) => {
    if (!request.id) return;

    const { success, error } = await approvedAgentService.updateJoinRequestStatus(request.id, 'rejected');

    if (success) {
      toast({
        title: "تم الرفض",
        description: `تم رفض طلب ${request.name} بنجاح.`, 
        type: "success",
      });
      // After rejection, refresh the list of join requests
      await (async () => {
        const { data, error } = (await supabase?.from('join_requests')
          .select('*')
          .order('created_at', { ascending: false })) || { data: null, error: new Error('Supabase client is not initialized') };
        if (error) console.error('Error re-fetching join requests:', error);
        setJoinRequests(data || []);
      })();
    } else {
      toast({
        title: "خطأ",
        description: error || `فشل رفض طلب ${request.name}.`,
        type: "error",
      });
    }
  };

  // Filter agents by status (تعديل منطق الفلترة)
  useEffect(() => {
    const processAgents = () => {
      const processed = newAgents
        .filter((agent): agent is ApprovedAgent => agent !== null && agent !== undefined)
        .map(agent => ({
          ...agent,
          phone: agent.profile?.phone || null,
          status: agent.details?.approved ? 'online' : 'offline',
        }));

      if (activeStatus === "all") {
        setFilteredAgents(processed);
      } else if (activeStatus === "online") {
        setFilteredAgents(processed.filter(agent => agent.details?.approved));
      } else if (activeStatus === "offline") {
        setFilteredAgents(processed.filter(agent => !agent.details?.approved));
      } else {
        setFilteredAgents([]); 
      }
    };

    processAgents();

  }, [activeStatus, newAgents]);

  // Status filter options (تعديل ليعكس الوكلاء المعتمدين)
  const statusFilters = [
    { id: "all" as AgentStatus, label: "جميع الوكلاء المعتمدين", count: newAgents.length },
    {
      id: "online" as AgentStatus,
      label: "متاح",
      count: newAgents.filter(a => a.details?.approved).length
    },
    {
      id: "offline" as AgentStatus,
      label: "غير نشط",
      count: newAgents.filter(a => !a.details?.approved).length
    },
    {
      id: "busy" as AgentStatus,
      label: "مشغول",
      count: 0
    }
  ];

  // معالجة اختيار الوكيل
  const handleAgentSelect = (agent: ApprovedAgent) => {
    setSelectedAgent(agent);

    // Define all required static document types for existing agents
    const REQUIRED_STATIC_DOCUMENT_TYPES: DocumentType[] = [
      "national_id_front", "national_id_back",
      "tax_card_front", "tax_card_back",
      "personal_photo", // This should now be correctly detected if present
    ];

    const agentDocumentTypes = agent.documents?.map(doc => doc.document_type) || [];
    const currentMissingDocs: string[] = [];

    // Check for missing static documents
    REQUIRED_STATIC_DOCUMENT_TYPES.forEach(requiredDoc => {
      if (!agentDocumentTypes.includes(requiredDoc)) {
        currentMissingDocs.push(requiredDoc);
      }
    });

    // Handle dynamic contract pages
    const presentContractPages: number[] = [];
    agent.documents?.forEach(doc => {
      if (doc.document_type.startsWith('contract_page_')) {
        const pageNumStr = doc.document_type.replace('contract_page_', '');
        const pageNum = parseInt(pageNumStr, 10);
        if (!isNaN(pageNum)) {
          presentContractPages.push(pageNum);
        }
      }
    });

    if (presentContractPages.length === 0) {
      // If no contract pages are present, and we expect at least one, mark contract_page_1 as missing.
      // Assuming at least one contract page is generally required.
      // If there's a backend flag for this, it would be more robust.
      // For now, if no contract pages exist, we will add 'contract_page_1' to missing.
      currentMissingDocs.push('contract_page_1');
    } else {
      // If some contract pages are present, check for continuity up to the maximum page number
      const maxContractPageNum = Math.max(...presentContractPages);
      for (let i = 1; i <= maxContractPageNum; i++) {
        if (!presentContractPages.includes(i)) {
          currentMissingDocs.push(`contract_page_${i}`);
        }
      }
    }

    setSelectedAgentMissingDocuments(currentMissingDocs);
    setIsDetailOpen(true);
  };

  // معالجة تعديل الوكيل
  const handleAgentEdit = (agent: ApprovedAgent) => {
    setEditingAgent(agent);
    setActiveTab("editAgent"); // Switch to edit tab
  };

  // Callback for document upload progress
  const handleDocumentsProgressChange = (uploadedCount: number, totalRequired: number, missingDocuments: string[]) => {
    setDocumentsUploadedCount(uploadedCount);
    setDocumentsTotalRequired(totalRequired);
    setMissingDocumentsList(missingDocuments);
  };

  // onSuccess callback لإضافة وكيل - الخطوة الأولى (معلومات أساسية)
  const handleBasicInfoAdded = (agentId: string, passwordSetByAdmin: string) => {
    setNewApprovedAgentId(agentId);
    setNewApprovedAgentPassword(passwordSetByAdmin);
    toast({
      title: "تم إنشاء المعلومات الأساسية بنجاح",
      description: "يمكنك الآن إدخال تفاصيل الوكيل.",
      type: "success",
    });
    setCurrentSubTab("details"); // الانتقال إلى خطوة التفاصيل
    setStepCompletion(prev => ({ ...prev, basicInfo: true }));
  };

  // onSuccess callback لتفاصيل الوكيل
  const handleDetailsAdded = () => {
    toast({
      title: "تم تحديث تفاصيل الوكيل بنجاح",
      description: "يمكنك الآن رفع المستندات.",
      type: "success",
    });
    setCurrentSubTab("documents"); // الانتقال إلى خطوة المستندات
    setStepCompletion(prev => ({ ...prev, details: true }));
  };

  // onSuccess callback لرفع المستندات
  const handleDocumentsUploaded = () => {
    toast({
      title: "تم رفع المستندات بنجاح",
      description: "يمكنك الآن إضافة مناطق العمل.",
      type: "success",
    });
    setCurrentSubTab("zones");
    setStepCompletion(prev => ({ ...prev, documents: true }));
  };

  // onSuccess callback لإضافة مناطق العمل
  const handleZonesAdded = () => {
    toast({
      title: "تم إضافة مناطق العمل بنجاح",
      description: "الآن يمكنك مراجعة ملخص بيانات الوكيل.",
      type: "success",
    });
    setCurrentSubTab("summary");
    setStepCompletion(prev => ({ ...prev, zones: true }));
  };

  // onComplete callback للملخص النهائي
  const handleSummaryComplete = () => {
    toast({
      title: "اكتملت عملية إضافة الوكيل المعتمد",
      description: "تم إضافة الوكيل بنجاح.",
      type: "info",
    });
    setActiveTab("agentList"); // العودة إلى قائمة الوكلاء
    setNewApprovedAgentId(null);
    setNewApprovedAgentPassword(null);
    setCurrentSubTab("basic-info");
    dispatch(fetchApprovedAgents()); // تحديث القائمة
    setStepCompletion({ // Reset completion
      basicInfo: false,
      details: false,
      documents: false,
      zones: false,
      summary: false,
    });
    setOverallProgress(0);
    setDocumentsUploadedCount(0);
    setDocumentsTotalRequired(0);
    setMissingDocumentsList([]);
  };

  // onCancel callback عام
  const handleCancel = () => {
    setActiveTab("agentList");
    setNewApprovedAgentId(null);
    setNewApprovedAgentPassword(null);
    setCurrentSubTab("basic-info");
    setStepCompletion({ // Reset completion
      basicInfo: false,
      details: false,
      documents: false,
      zones: false,
      summary: false,
    });
    setOverallProgress(0);
    setDocumentsUploadedCount(0);
    setDocumentsTotalRequired(0);
    setMissingDocumentsList([]);
  };

  // Calculate overall progress based on step completion (simplified for now)
  useEffect(() => {
    const completedSteps = Object.values(stepCompletion).filter(Boolean).length;
    const totalSteps = Object.keys(stepCompletion).length;

    // Adjust progress for documents step based on actual document upload progress
    let documentsProgress = 0;
    if (documentsTotalRequired > 0) {
      documentsProgress = (documentsUploadedCount / documentsTotalRequired) * 100;
    }

    // If documents step is considered complete, contribute full weight to overall progress
    // Otherwise, contribute proportional progress
    if (stepCompletion.documents) {
      // Documents step already marked complete, no special handling needed here for its weight
    } else if (documentsProgress > 0) {
      // If documents step is not yet marked complete, but has some progress, calculate partial completion.
      // This is a simplification. A more robust solution might allocate a specific 'weight' to the documents step.
      // For now, we'll just consider it partially complete if some documents are uploaded.
      // We can define 'documents' as being 1/5th of the total progress, and if it's partially done, it contributes that much.
      const documentsStepWeight = 1; // Assuming documents step is one of the 5 steps
      const partialDocumentsContribution = (documentsProgress / 100) * documentsStepWeight;
      
      // Add partial contribution, then subtract the full weight of the documents step if not fully complete
      // This logic might need refinement based on exact weighting desired
      const adjustedCompletedSteps = completedSteps + partialDocumentsContribution;
      setOverallProgress(Math.round((adjustedCompletedSteps / totalSteps) * 100));
      return;
    }

    setOverallProgress(Math.round((completedSteps / totalSteps) * 100));

  }, [stepCompletion, documentsUploadedCount, documentsTotalRequired]);

  // دالة حذف الوكيل
  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الوكيل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        const resultAction = await dispatch(deleteApprovedAgent(agentId));
        if (deleteApprovedAgent.fulfilled.match(resultAction)) {
          toast({
            title: "تم الحذف",
            description: "تم حذف الوكيل بنجاح من النظام.",
            type: "success",
          });
        } else {
          toast({
            title: "خطأ",
            description: (resultAction.payload as string) || "فشل حذف الوكيل. يرجى المحاولة مرة أخرى.",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Error during agent deletion:", err);
        toast({
          title: "خطأ تقني",
          description: "حدث خطأ غير متوقع أثناء محاولة الحذف.",
          type: "error",
        });
      }
    }
  };

  // دالة مساعدة لتعريب أسماء المستندات
  const localizeDocumentType = (docType: string): string => {
    const docTypeMap: Record<string, string> = {
      national_id_front: "صورة البطاقة الشخصية (الوجه الأمامي)",
      national_id_back: "صورة البطاقة الشخصية (الوجه الخلفي)",
      tax_card_front: "صورة البطاقة الضريبية (الوجه الأمامي)",
      tax_card_back: "صورة البطاقة الضريبية (الوجه الخلفي)",
      personal_photo: "صورة شخصية للوكيل",
      // يمكن إضافة المزيد من التعريبات هنا حسب الحاجة
    };
    // إذا كان نوع المستند هو صفحة عقد ديناميكية، حاول تعريبها
    if (docType.startsWith('contract_page_')) {
      const pageNum = docType.replace('contract_page_', '');
      return `صفحة العقد ${pageNum}`;
    }
    return docTypeMap[docType] || docType; // ارجع النوع الأصلي إذا لم يتم العثور على تعريب
  };

  return (
    <DashboardLayout title="الوكلاء المعتمدون">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">الوكلاء المعتمدون</h1>
        <p className="text-gray-600 mb-6">هذه الصفحة تعرض قائمة الوكلاء المعتمدين وتسمح بإضافتهم وتعديلهم.</p>
        
        {/* البطاقات الرئيسية */}
        {showDashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
              {/* بطاقة إضافة وكيل معتمد جديد */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <FiUserPlus className="ml-2 text-green-500" />
                    إضافة وكيل جديد
                  </CardTitle>
                  <CardDescription>
                    إضافة وكيل معتمد جديد للنظام وإعداد بياناته
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    إضافة وكيل جديد للنظام وإعداد الحساب وتفعيله.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setShowDashboard(false);
                      setActiveTab("addAgent");
                      setCurrentSubTab("basic-info");
                    }}
                  >
                    إضافة وكيل معتمد جديد +
                  </Button>
                </CardContent>
              </Card>
              
              {/* بطاقة طلبات الوكلاء الجدد */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <FiUsers className="ml-2 text-blue-500" />
                    طلبات الوكلاء الجدد
                  </CardTitle>
                  <CardDescription>
                    مراجعة والموافقة على طلبات الانضمام للوكلاء الجدد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    عرض وإدارة طلبات الوكلاء الجدد الذين قدموا طلباتهم للانضمام.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setShowDashboard(false);
                      setActiveTab("joinRequests");
                    }}
                  >
                    عرض طلبات الانضمام
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* إضافة قائمة الوكلاء الحاليين أسفل البطاقات */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">قائمة الوكلاء الحاليين</h2>
                <div className="flex space-x-4 rtl:space-x-reverse">
                  <AgentStatusFilter 
                    statuses={statusFilters}
                    activeStatus={activeStatus}
                    onStatusChange={(status) => setActiveStatus(status)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">جاري تحميل بيانات الوكلاء المعتمدين...</p>
                </div>
              ) : filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgents.map((agent: ApprovedAgent) => (
                    <ApprovedAgentCard
                      key={agent.id}
                      agent={agent}
                      onViewDetails={handleAgentSelect}
                      onCall={(agent: ApprovedAgent) => console.log("Calling agent:", agent.profile?.phone)}
                      onEdit={(agent) => {
                        setEditingAgent(agent);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={(agent) => handleDeleteAgent(agent.id)}
                      className="h-full"
                    />
                  ))}
                </div>
              ) : (
                <Alert className="mb-6">
                  <FiAlertCircle className="h-4 w-4 ml-2" />
                  <AlertDescription>
                    لا توجد سجلات وكلاء معتمدين لعرضها.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* عرض رسالة الاتصال */}
        {connectionInfo.error && (
          <Alert className="mb-4 bg-red-50">
            <FiAlertCircle className="h-4 w-4 ml-2" />
            <AlertDescription>
              <div className="font-bold text-red-600">{connectionInfo.error}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* عرض محتوى التبويب النشط */}
        {!showDashboard && (
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDashboard(true);
                setActiveTab("dashboard");
              }}
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        )}

        {activeTab === "agentList" && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">قائمة الوكلاء</h2>
              <div className="flex space-x-4 rtl:space-x-reverse">
                <AgentStatusFilter 
                  statuses={statusFilters}
                  activeStatus={activeStatus}
                  onStatusChange={(status) => setActiveStatus(status)}
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("addAgent")}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  + إضافة وكيل معتمد جديد
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">جاري تحميل بيانات الوكلاء المعتمدين...</p>
              </div>
            ) : filteredAgents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map((agent: ApprovedAgent) => (
                  <ApprovedAgentCard
                    key={agent.id}
                    agent={agent}
                    onViewDetails={handleAgentSelect}
                    onCall={(agent: ApprovedAgent) => console.log("Calling agent:", agent.profile?.phone)}
                    onEdit={(agent) => {
                      setEditingAgent(agent);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={(agent) => handleDeleteAgent(agent.id)}
                    className="h-full"
                  />
                ))}
              </div>
            ) : (
              <Alert className="mb-6">
                <FiAlertCircle className="h-4 w-4 ml-2" />
                <AlertDescription>
                  لا توجد سجلات وكلاء معتمدين لعرضها.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {activeTab === "joinRequests" && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">طلبات الوكلاء الجدد</h2>
            </div>
            
            {isLoadingJoinRequests ? (
              <div className="text-center py-8">جاري تحميل الطلبات...</div>
            ) : joinRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الهاتف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع العمل</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {joinRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{request.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{request.business_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : request.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' ? 'قيد المراجعة' : 
                             request.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-2"
                            onClick={() => {
                              console.log('View button clicked for request:', request);
                              setSelectedJoinRequest(request);
                              setIsJoinRequestDetailOpen(true);
                              console.log('isJoinRequestDetailOpen after click:', true);
                            }}
                          >
                            عرض
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="ml-2"
                                onClick={() => {
                                  handleApproveRequest(request);
                                }}
                              >
                                موافقة
                              </Button>
                              
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  handleRejectRequest(request);
                                }}
                              >
                                رفض
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">لا توجد طلبات وكلاء جديدة</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "addAgent" && (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>إضافة وكيل معتمد جديد</CardTitle>
                <CardDescription>
                  {currentSubTab === "basic-info" && "الخطوة 1 من 5: أدخل المعلومات الأساسية للوكيل."}
                  {currentSubTab === "details" && "الخطوة 2 من 5: أدخل تفاصيل عمل الوكيل."}
                  {currentSubTab === "documents" && "الخطوة 3 من 5: رفع المستندات المطلوبة."}
                  {currentSubTab === "zones" && "الخطوة 4 من 5: إدارة مناطق عمل الوكيل."}
                  {currentSubTab === "summary" && "الخطوة النهائية: مراجعة ملخص بيانات الوكيل."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={currentSubTab} onValueChange={setCurrentSubTab} className="mb-4">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-md text-gray-600">
                    <TabsTrigger value="basic-info" disabled={!!newApprovedAgentId}>المعلومات الأساسية</TabsTrigger>
                    <TabsTrigger value="details" disabled={!newApprovedAgentId}>التفاصيل</TabsTrigger>
                    <TabsTrigger value="documents" disabled={!newApprovedAgentId}>المستندات</TabsTrigger>
                    <TabsTrigger value="zones" disabled={!newApprovedAgentId}>المناطق</TabsTrigger>
                    <TabsTrigger value="summary" disabled={!newApprovedAgentId}>الملخص</TabsTrigger>
                  </TabsList>
                </Tabs>

                {!newApprovedAgentId && currentSubTab === "basic-info" && (
                  <ApprovedAgentBasicInfoForm onSuccess={handleBasicInfoAdded} onCancel={handleCancel} />
                )}

                {newApprovedAgentId && currentSubTab === "details" && (
                  <ApprovedAgentDetailsForm
                    agentId={newApprovedAgentId}
                    onSuccess={handleDetailsAdded}
                    onCancel={() => setCurrentSubTab("basic-info")}
                  />
                )}

                {newApprovedAgentId && currentSubTab === "documents" && (
                  <UploadApprovedAgentDocuments
                    agentId={newApprovedAgentId}
                    onSuccess={handleDocumentsUploaded}
                    onCancel={() => setCurrentSubTab("details")}
                    onProgressChange={handleDocumentsProgressChange}
                  />
                )}

                {newApprovedAgentId && currentSubTab === "zones" && (
                  <ApprovedAgentZonesManager
                    agentId={newApprovedAgentId}
                    onSuccess={handleZonesAdded}
                    onCancel={() => setCurrentSubTab("documents")}
                  />
                )}

                {newApprovedAgentId && currentSubTab === "summary" && (
                  <ApprovedAgentSummary
                    agentId={newApprovedAgentId}
                    passwordSetByAdmin={newApprovedAgentPassword || "N/A"}
                    onComplete={handleSummaryComplete}
                    onBack={() => setCurrentSubTab("zones")}
                    missingDocuments={missingDocumentsList}
                    onEdit={(agentToEdit: ApprovedAgent) => {
                      if (agentToEdit) {
                        setEditingAgent(agentToEdit);
                        setIsEditDialogOpen(true);
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stepper and Progress Bar */}
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">تقدم إضافة الوكيل</h3>
                <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4 rtl:space-x-reverse">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.basicInfo ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                        {stepCompletion.basicInfo ? '✓' : '1'}
                      </span>
                      <span className="mr-2 text-sm text-gray-600">المعلومات الأساسية</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.details ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                        {stepCompletion.details ? '✓' : '2'}
                      </span>
                      <span className="mr-2 text-sm text-gray-600">التفاصيل</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.documents ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                        {stepCompletion.documents ? '✓' : '3'}
                      </span>
                      <span className="mr-2 text-sm text-gray-600">
                        المستندات {documentsTotalRequired > 0 && `(${Math.round((documentsUploadedCount / documentsTotalRequired) * 100)}%)`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.zones ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                        {stepCompletion.zones ? '✓' : '4'}
                      </span>
                      <span className="mr-2 text-sm text-gray-600">المناطق</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.summary ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                        {stepCompletion.summary ? '✓' : '5'}
                      </span>
                      <span className="mr-2 text-sm text-gray-600">الملخص</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-600 mt-2">{overallProgress}% اكتمال تعبئة الحقول</p>
                  </div>
              </div>
            )}

        {/* باقي محتوى التبويبات */}
        <CustomDialog
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`تفاصيل الوكيل: ${selectedAgent?.profile?.full_name || ""}`}
          className="max-w-[66%]"
        >
          {selectedAgent && (
            <ApprovedAgentDetail
              agent={selectedAgent}
              onEdit={() => {
                setEditingAgent(selectedAgent);
                setIsDetailOpen(false);
                setIsEditDialogOpen(true);
              }}
              missingDocuments={selectedAgentMissingDocuments}
            />
          )}
        </CustomDialog>

        {/* إضافة CustomDialog للتعديل في نهاية المكون (قبل إغلاق الـ DashboardLayout) */}
        <CustomDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setEditingAgent(null);
            setIsEditDialogOpen(false);
          }}
          title={`تعديل بيانات الوكيل: ${editingAgent?.profile?.full_name || ""}`}
          className="max-w-[66%]"
        >
          {editingAgent && (
            <div className="max-h-[80vh] overflow-auto">
              <EditApprovedAgentPage
                key={editingAgent.id}
                agentId={editingAgent.id}
                onComplete={() => {
                  setEditingAgent(null);
                  setIsEditDialogOpen(false);
                  dispatch(fetchApprovedAgents());
                }}
                onCancel={() => {
                  setEditingAgent(null);
                  setIsEditDialogOpen(false);
                }}
              />
            </div>
          )}
        </CustomDialog>
        {/* CustomDialog for Join Request Details */}
        <CustomDialog
          isOpen={isJoinRequestDetailOpen}
          onClose={() => {
            console.log('Closing join request detail dialog.');
            setIsJoinRequestDetailOpen(false);
          }}
          title={`تفاصيل طلب الوكيل: ${selectedJoinRequest?.name || ""}`}
          className="max-w-[40%]"
        >
          {selectedJoinRequest && (
            <div className="p-4 space-y-4" dir="rtl">
              <p><strong>الاسم:</strong> {selectedJoinRequest.name}</p>
              <p><strong>الهاتف:</strong> {selectedJoinRequest.phone}</p>
              <p><strong>العنوان:</strong> {selectedJoinRequest.address}</p>
              <p><strong>نوع العمل:</strong> {selectedJoinRequest.business_type}</p>
              <p><strong>الحالة:</strong> {
                selectedJoinRequest.status === 'pending' ? 'قيد المراجعة' :
                selectedJoinRequest.status === 'approved' ? 'تمت الموافقة' :
                'مرفوض'
              }</p>
            </div>
          )}
        </CustomDialog>
      </div>
    </DashboardLayout>
  );
} 