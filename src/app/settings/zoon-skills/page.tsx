import React from "react";
import SkillBuilder from "@/domains/zoon-os/components/SkillBuilder";

export const metadata = {
  title: "Zoon OS Skills | الإعدادات",
};

export default function ZoonSkillsPage() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-4" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة مهارات Zoon OS</h1>
        <p className="text-muted-foreground mt-2">
          إضافة، تعديل وحذف مهارات الذكاء الاصطناعي بشكل ديناميكي (Dynamic AI Skills).
        </p>
      </div>

      <div className="mt-8">
        <SkillBuilder />
      </div>
    </div>
  );
}
