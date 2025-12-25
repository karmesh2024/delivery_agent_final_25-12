"use client";

import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AgentZonesManager } from "./AgentZonesManager";
import { AgentSummary } from "./AgentSummary";

interface AgentFormProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// تعريف أنواع البيانات للمكونات الفرعية
interface BasicInfoProps {
  formData: Record<string, string | number | boolean>;
  onChange: (data: Record<string, string | number | boolean>) => void;
  onNext: () => void;
  onCancel: () => void;
}

interface DocumentsProps {
  agentId: string;
  onNext: () => void;
  onBack: () => void;
}

// تعريف التبويبات المتوفرة
type TabType = "basic" | "documents" | "zones" | "summary";

export function AgentForm({ agentId, onSuccess, onCancel }: AgentFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({
    // أي بيانات أولية مطلوبة
  });

  // تغيير التبويب النشط
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // التقدم إلى التبويب التالي
  const handleNextTab = () => {
    if (activeTab === "basic") setActiveTab("documents");
    else if (activeTab === "documents") setActiveTab("zones");
    else if (activeTab === "zones") setActiveTab("summary");
  };

  // الرجوع إلى التبويب السابق
  const handlePreviousTab = () => {
    if (activeTab === "summary") setActiveTab("zones");
    else if (activeTab === "zones") setActiveTab("documents");
    else if (activeTab === "documents") setActiveTab("basic");
  };

  // معالجة تغييرات في البيانات الأساسية
  const handleBasicInfoChange = (data: Record<string, string | number | boolean>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // إتمام إضافة مناطق العمل والانتقال للملخص النهائي
  const handleZonesSuccess = () => {
    console.log("Zones added successfully, moving to summary tab");
    handleNextTab(); // الانتقال إلى تبويب الملخص
  };

  // مكونات التبويبات المختلفة تم تعريفها مؤقتاً كمكونات بسيطة
  // ينبغي استبدالها بالمكونات الفعلية أو استيرادها

  // مكون المعلومات الأساسية
  const AgentBasicInfo = ({ formData, onChange, onNext, onCancel }: BasicInfoProps) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
      {/* نموذج البيانات الأساسية هنا */}
      <div className="flex justify-end space-x-2 rtl:space-x-reverse">
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button onClick={onNext}>التالي</Button>
      </div>
    </div>
  );

  // مكون المستندات
  const AgentDocuments = ({ agentId, onNext, onBack }: DocumentsProps) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">المستندات</h2>
      {/* محتوى المستندات هنا */}
      <div className="flex justify-end space-x-2 rtl:space-x-reverse">
        <Button variant="outline" onClick={onBack}>رجوع</Button>
        <Button onClick={onNext}>التالي</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "basic"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("basic")}
        >
          المعلومات الأساسية
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "documents"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("documents")}
        >
          المستندات
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "zones"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("zones")}
        >
          مناطق العمل
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "summary"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("summary")}
        >
          ملخص البيانات
        </button>
      </div>

      {activeTab === "basic" && (
        <AgentBasicInfo
          formData={formData}
          onChange={handleBasicInfoChange}
          onNext={handleNextTab}
          onCancel={onCancel}
        />
      )}

      {activeTab === "documents" && (
        <AgentDocuments
          agentId={agentId}
          onNext={handleNextTab}
          onBack={handlePreviousTab}
        />
      )}

      {activeTab === "zones" && (
        <AgentZonesManager
          agentId={agentId}
          onSuccess={handleZonesSuccess}
          onCancel={handlePreviousTab}
        />
      )}

      {activeTab === "summary" && (
        <AgentSummary
          agentId={agentId}
          onBack={handlePreviousTab}
        />
      )}
    </div>
  );
} 