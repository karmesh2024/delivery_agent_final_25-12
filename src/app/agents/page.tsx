/**
 * صفحة المندوبين - معدلة لاستخدام هيكل DDD و Redux
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Agent, AgentStatus } from "@/types";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { FiAlertCircle, FiPlus } from "react-icons/fi";
import { Button } from '@/shared/ui/button';
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// استيراد المكونات من الهيكل الجديد
import { AgentStatusFilter } from "@/components/AgentStatusFilter";
import { AgentCard } from "@/components/AgentCard";
import { AgentDetailsDialog } from "@/components/AgentDetailsDialog";
import { AgentDetail } from "@/components/AgentDetail";
import { FullAddAgentForm } from "@/components/FullAddAgentForm";
import { UploadAgentDocuments } from "@/components/UploadAgentDocuments";
import { AgentZonesManager } from "@/components/AgentZonesManager";
import { AgentSummary } from "@/components/AgentSummary";
import { EditAgentForm } from "@/components/EditAgentForm";
import { AgentsSearch } from "@/components/AgentsSearch";

// استيراد Redux hooks وتحويلات البيانات
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAgents } from "@/store/agentsSlice";
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from "@/shared/ui/toast";

// تعريف نوع البيانات للمندوب الجديد
interface NewAgentData {
  name: string;
  phone: string;
  email: string;
  preferred_vehicle: "tricycle" | "pickup_truck" | "light_truck";
  status: AgentStatus;
}

export default function AgentsPage() {
  // استخدام Redux لإدارة الحالة
  const dispatch = useAppDispatch();
  const { items: agents, status } = useAppSelector(state => state.agents);
  const isLoading = status === 'loading';
  const { toast } = useToast();

  // حالات محلية للتعامل مع التصفية والتفاصيل
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchFilteredAgents, setSearchFilteredAgents] = useState<Agent[]>([]);
  const [activeStatus, setActiveStatus] = useState<AgentStatus>("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // حالات التحميل الكسول
  const [visibleAgents, setVisibleAgents] = useState<Agent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const AGENTS_PER_PAGE = 9;
  
  // إضافة حالة لتبويب العرض الحالي
  const [activeTab, setActiveTab] = useState("all-agents");
  // حالات إضافة مندوب جديد
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const [currentSubTab, setCurrentSubTab] = useState("basic-info");
  // Add state for delivery code and password for the summary
  const [newAgentDeliveryCode, setNewAgentDeliveryCode] = useState<string | null>(null);
  const [newAgentPassword, setNewAgentPassword] = useState<string | null>(null);
  
  const [connectionInfo, setConnectionInfo] = useState<{
    hasCredentials: boolean;
    error: string | null;
    message: string;
  }>({
    hasCredentials: false,
    error: null,
    message: 'جاري التحقق من الاتصال...'
  });

  // التحقق من اتصال Redux
  useEffect(() => {
    async function checkConnection() {
      try {
        setConnectionInfo({
          hasCredentials: true,
          error: null,
          message: "تم الاتصال بنجاح. جاري جلب بيانات المندوبين..."
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

  // جلب بيانات المندوبين باستخدام Redux
  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  // تصفية المندوبين حسب الحالة
  useEffect(() => {
    const filtered = activeStatus === "all" 
      ? agents 
      : agents.filter(agent => agent.status === activeStatus);
    
    setFilteredAgents(filtered);
    setPage(1);
    setHasMore(filtered.length > AGENTS_PER_PAGE);
    setVisibleAgents(filtered.slice(0, AGENTS_PER_PAGE));
  }, [activeStatus, agents]);

  // تحديث المندوبين المرئيين عند تغيير نتائج البحث
  useEffect(() => {
    const agentsToShow = searchFilteredAgents.length > 0 ? searchFilteredAgents : filteredAgents;
    setPage(1);
    setHasMore(agentsToShow.length > AGENTS_PER_PAGE);
    setVisibleAgents(agentsToShow.slice(0, AGENTS_PER_PAGE));
  }, [searchFilteredAgents, filteredAgents]);

  // وظيفة لتحميل المزيد من المندوبين
  const loadMoreAgents = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * AGENTS_PER_PAGE;
    const endIndex = nextPage * AGENTS_PER_PAGE;
    
    setTimeout(() => {
      const agentsToShow = searchFilteredAgents.length > 0 ? searchFilteredAgents : filteredAgents;
      const newVisibleAgents = [
        ...visibleAgents,
        ...agentsToShow.slice(startIndex, endIndex)
      ];
      
      setVisibleAgents(newVisibleAgents);
      setPage(nextPage);
      setHasMore(newVisibleAgents.length < agentsToShow.length);
      setIsLoadingMore(false);
    }, 200); // تأخير صغير للتأثير البصري
  }, [searchFilteredAgents, filteredAgents, hasMore, isLoadingMore, page, visibleAgents]);

  // مراقبة العنصر المرجعي عند التمرير
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        loadMoreAgents();
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMoreAgents]);

  // Status filter options - استخدام النتائج المفلترة الحالية
  const currentAgents = searchFilteredAgents.length > 0 ? searchFilteredAgents : filteredAgents;
  const statusFilters = [
    { id: "all" as AgentStatus, label: "جميع المندوبين", count: agents.length },
    { 
      id: "online" as AgentStatus, 
      label: "متاح", 
      count: agents.filter(a => a.status === "online").length 
    },
    { 
      id: "offline" as AgentStatus, 
      label: "غير نشط", 
      count: agents.filter(a => a.status === "offline").length 
    },
    { 
      id: "busy" as AgentStatus, 
      label: "مشغول", 
      count: agents.filter(a => a.status === "busy").length
    }
  ];

  // معالجة اختيار المندوب
  const handleAgentSelect = useCallback((agent: Agent) => {
    console.log("Agent selected for details:", agent.id, agent.name);
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  }, []);

  // معالجة إضافة مندوب جديد - المعلومات الأساسية
  const handleAgentCreated = (agentId: string, deliveryCode: string, passwordSetByAdmin: string) => {
    setNewAgentId(agentId);
    setNewAgentDeliveryCode(deliveryCode);
    setNewAgentPassword(passwordSetByAdmin);
    toast({
      title: "تم إنشاء معلومات المندوب الأساسية بنجاح",
      description: "يمكنك الآن رفع مستندات المندوب.",
      type: "success"
    });
    setCurrentSubTab("documents");
  };
  
  // معالجة رفع المستندات
  const handleDocumentsUploaded = () => {
    toast({
      title: "تم رفع المستندات بنجاح",
      description: "يمكنك الآن إضافة مناطق العمل",
      type: "success"
    });
    setCurrentSubTab("zones");
  };
  
  // معالجة إضافة مناطق العمل - تعديل للانتقال للملخص
  const handleZonesAdded = () => {
    toast({
      title: "تم إضافة مناطق العمل بنجاح",
      description: "الآن يمكنك مراجعة ملخص بيانات المندوب",
      type: "success"
    });
    setCurrentSubTab("summary");
  };

  // معالجة إلغاء العملية
  const handleCancel = () => {
    setActiveTab("all-agents");
    setNewAgentId(null);
    setNewAgentDeliveryCode(null);
    setNewAgentPassword(null);
    setCurrentSubTab("basic-info");
  };

  return (
    <DashboardLayout title="مندوبي التوصيل">
      <PermissionGuard permissionCode="agents:view" fallback={<div>ليس لديك صلاحية لعرض المندوبين</div>}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">مندوبي التوصيل</h1>
          <div className="flex items-center gap-4">
            <AgentStatusFilter 
              statuses={statusFilters}
              activeStatus={activeStatus}
              onStatusChange={(status) => setActiveStatus(status)}
            />
          </div>
        </div>

        {/* تبويبات عرض المندوبين وإضافة مندوب جديد */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto">
            <TabsTrigger value="all-agents">قائمة المندوبين</TabsTrigger>
            <PermissionGuard permissionCode="admins:create">
              <TabsTrigger value="add-agent">إضافة مندوب جديد</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permissionCode="agents:manage">
              <TabsTrigger value="edit-agent">تعديل بيانات مندوب</TabsTrigger>
            </PermissionGuard>
          </TabsList>

          <TabsContent value="all-agents">
            {/* عرض معلومات الاتصال بقاعدة البيانات */}
            <Alert className={`mb-4 ${connectionInfo.error ? 'bg-red-50' : 'bg-green-50'}`}>
              <FiAlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-bold">{connectionInfo.message}</div>
                {connectionInfo.error && (
                  <div className="text-red-600 text-sm mt-1">{connectionInfo.error}</div>
                )}
              </AlertDescription>
            </Alert>

            {/* مكون البحث والفلترة */}
            <div className="mb-6">
              <AgentsSearch
                agents={filteredAgents}
                onFilteredAgents={setSearchFilteredAgents}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">جاري تحميل بيانات المندوبين...</p>
              </div>
            ) : visibleAgents.length > 0 ? (
              <div className="max-h-[calc(100vh-350px)] overflow-y-auto pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onViewDetails={() => handleAgentSelect(agent)}
                      onCall={(agent) => console.log("Calling agent:", agent.phone)}
                      className="h-full"
                    />
                  ))}
                </div>
                {/* عنصر التحميل المرجعي */}
                <div 
                  ref={loaderRef} 
                  className="flex justify-center items-center py-4 mt-4"
                >
                  {hasMore && visibleAgents.length > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 border-4 border-t-blue-500 border-b-transparent border-r-transparent border-l-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-gray-500">جاري تحميل المزيد...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Alert className="mb-6">
                <FiAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchFilteredAgents.length === 0 && filteredAgents.length > 0
                    ? "لم يتم العثور على مندوبين يطابقون معايير البحث. حاول تغيير كلمات البحث أو الفلاتر."
                    : "لم يتم العثور على مندوبين بالحالة المحددة. حاول تغيير الفلتر أو إضافة مندوبين جدد."
                  }
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="add-agent">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>بيانات المندوب الجديد</CardTitle>
                <CardDescription>أدخل جميع البيانات المطلوبة لإضافة مندوب جديد</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={currentSubTab} onValueChange={setCurrentSubTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="basic-info">المعلومات الأساسية</TabsTrigger>
                    <TabsTrigger value="documents" disabled={!newAgentId}>المستندات</TabsTrigger>
                    <TabsTrigger value="zones" disabled={!newAgentId}>مناطق العمل</TabsTrigger>
                    <TabsTrigger value="summary" disabled={!newAgentId}>ملخص البيانات</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic-info">
                    <Card>
                      <CardHeader>
                        <CardTitle>المعلومات الأساسية للمندوب</CardTitle>
                        <CardDescription>
                          أدخل البيانات الأساسية لإنشاء حساب مندوب جديد. كلمة المرور التي تحددها هنا سيستخدمها المندوب لتسجيل الدخول الأولي مع رمز التوصيل الخاص به.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FullAddAgentForm 
                          onSuccess={handleAgentCreated} 
                          onCancel={handleCancel} 
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="documents">
                    {newAgentId && (
                      <Card>
                        <CardHeader>
                          <CardTitle>مستندات المندوب</CardTitle>
                          <CardDescription>
                            ارفع المستندات المطلوبة للمندوب مثل صورة الرخصة والهوية.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <UploadAgentDocuments 
                            agentId={newAgentId} 
                            onSuccess={handleDocumentsUploaded} 
                            onCancel={() => setCurrentSubTab("summary")}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="zones">
                    {newAgentId && (
                      <Card>
                        <CardHeader>
                          <CardTitle>مناطق عمل المندوب</CardTitle>
                          <CardDescription>
                            حدد مناطق العمل المفضلة للمندوب.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AgentZonesManager 
                            agentId={newAgentId} 
                            onSuccess={handleZonesAdded} 
                            onCancel={() => setCurrentSubTab("summary")}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="summary">
                    {newAgentId && (
                      <Card>
                        <CardHeader>
                          <CardTitle>ملخص بيانات المندوب</CardTitle>
                          <CardDescription>
                            تم إنشاء المندوب بنجاح. هذه هي تفاصيله الأولية.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AgentSummary 
                            agentId={newAgentId} 
                            deliveryCode={newAgentDeliveryCode}
                            passwordSetByAdmin={newAgentPassword}
                            onComplete={() => {
                              toast({ title: "اكتملت عملية إضافة المندوب", type: "info" });
                              setActiveTab("all-agents");
                              setNewAgentId(null);
                              setCurrentSubTab("basic-info");
                              setNewAgentDeliveryCode(null);
                              setNewAgentPassword(null);
                              dispatch(fetchAgents());
                            }}
                            onBack={() => setCurrentSubTab("zones")}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit-agent">
            <PermissionGuard permissionCode="agents:manage" fallback={<div>ليس لديك صلاحية لتعديل المندوبين</div>}>
              <Card>
                <CardHeader>
                  <CardTitle>تعديل بيانات مندوب</CardTitle>
                  <CardDescription>اختر مندوبًا من القائمة لتعديل بياناته.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditAgentForm />
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>

        {/* حل بديل: نافذة حوار مباشرة باستخدام CSS بدلاً من مكونات Dialog */}
        {isDetailOpen && selectedAgent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* طبقة خلفية شفافة */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsDetailOpen(false)}
            ></div>
            
            {/* محتوى النافذة */}
            <div className="relative z-[10000] w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
              {/* زر الإغلاق */}
              <button 
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setIsDetailOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* العنوان */}
              <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold">تفاصيل المندوب {selectedAgent.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  هذا المربع يعرض معلومات مفصلة عن مندوب التوصيل
                </p>
              </div>
              
              {/* محتوى التفاصيل */}
              <AgentDetail
                agent={selectedAgent}
                onClose={() => setIsDetailOpen(false)}
              />
            </div>
          </div>
        )}
      </PermissionGuard>
    </DashboardLayout>
  );
}