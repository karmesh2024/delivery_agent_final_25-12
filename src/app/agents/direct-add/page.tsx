"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { DirectApiAddAgentForm } from "@/components";
import { useToast } from "@/shared/ui/toast";

export default function DirectAddAgentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleAgentCreated = () => {
    toast({
      title: "تم إنشاء المندوب بنجاح",
      description: "تم إضافة المندوب الجديد وإنشاء حساب له بنجاح",
      type: "success"
    });
    router.push("/agents");
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
        <h1 className="text-2xl font-bold">إضافة مندوب جديد (مع كلمة مرور)</h1>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>بيانات المندوب الجديد</CardTitle>
          <CardDescription>أدخل جميع البيانات المطلوبة لإضافة مندوب جديد. ستظهر كلمة المرور وكود التحقق بعد الإضافة.</CardDescription>
        </CardHeader>
        <CardContent>
          <DirectApiAddAgentForm
            onSuccess={handleAgentCreated}
            onCancel={() => router.push("/agents")}
          />
        </CardContent>
      </Card>
    </div>
  );
} 