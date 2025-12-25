"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FullAddAgentForm, UploadAgentDocuments, AgentZonesManager, AgentSummary } from "@/components";
import { useToast } from "@/shared/ui/toast";

export default function AddNewAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("basic-info");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);
  const [passwordSetByAdmin, setPasswordSetByAdmin] = useState<string | null>(null);
  
  const handleAgentCreated = (id: string, code: string, password: string) => {
    setAgentId(id);
    setDeliveryCode(code);
    setPasswordSetByAdmin(password);
    toast({
      title: "تم إنشاء المندوب بنجاح",
      description: "يمكنك الآن إضافة المستندات ومناطق العمل",
      type: "success"
    });
    setCurrentTab("documents");
  };
  
  const handleDocumentsUploaded = () => {
    toast({
      title: "تم رفع المستندات بنجاح",
      description: "يمكنك الآن إضافة مناطق العمل",
      type: "success"
    });
    setCurrentTab("zones");
  };
  
  const handleZonesAdded = () => {
    toast({
      title: "تم إضافة مناطق العمل بنجاح",
      description: "الآن يمكنك مراجعة ملخص بيانات المندوب",
      type: "success"
    });
    setCurrentTab("summary");
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => router.push("/agents")}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة إلى قائمة المندوبين
        </Button>
        <h1 className="text-2xl font-bold">إضافة مندوب جديد</h1>
      </div>
      
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>بيانات المندوب الجديد</CardTitle>
          <CardDescription>أدخل جميع البيانات المطلوبة لإضافة مندوب جديد</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic-info">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="documents" disabled={!agentId}>المستندات</TabsTrigger>
              <TabsTrigger value="zones" disabled={!agentId}>مناطق العمل</TabsTrigger>
              <TabsTrigger value="summary" disabled={!agentId}>ملخص البيانات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic-info">
              <FullAddAgentForm 
                onSuccess={handleAgentCreated} 
                onCancel={() => router.push("/agents")} 
              />
            </TabsContent>
            
            <TabsContent value="documents">
              {agentId ? (
                <UploadAgentDocuments 
                  agentId={agentId} 
                  onSuccess={handleDocumentsUploaded}
                  onCancel={() => setCurrentTab("basic-info")}
                />
              ) : (
                <div className="text-center p-8">
                  <p>يرجى إكمال المعلومات الأساسية أولاً</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="zones">
              {agentId ? (
                <AgentZonesManager 
                  agentId={agentId} 
                  onSuccess={handleZonesAdded}
                  onCancel={() => setCurrentTab("documents")}
                />
              ) : (
                <div className="text-center p-8">
                  <p>يرجى إكمال المعلومات الأساسية والمستندات أولاً</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="summary">
              {agentId ? (
                <AgentSummary 
                  agentId={agentId} 
                  deliveryCode={deliveryCode}
                  passwordSetByAdmin={passwordSetByAdmin}
                  onComplete={() => router.push("/agents")}
                  onBack={() => setCurrentTab("zones")}
                />
              ) : (
                <div className="text-center p-8">
                  <p>يرجى إكمال كافة الخطوات السابقة أولاً</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 