"use client";

import { Sidebar } from "@/shared/layouts/Sidebar";
import { Header } from "@/shared/layouts/Header";
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { ClientOnly } from "@/shared/components/ClientOnly";

// إنشاء سياق لحالة الشريط الجانبي
export const SidebarContext = createContext({
  isExpanded: true,
  toggleSidebar: () => {}
});

// هوك لاستخدام سياق الشريط الجانبي
export const useSidebar = () => useContext(SidebarContext);

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideSidebar?: boolean;
}

export function DashboardLayout({ children, title = "Dashboard", hideSidebar = false }: DashboardLayoutProps) {
  // حالة لتتبع ما إذا كان الشريط الجانبي موسعًا أم مطويًا
  const [isExpanded, setIsExpanded] = useState(true);
  // حالة لتتبع ما إذا كان المكون قد تم تحميله في المتصفح
  
  // تأكيد أن الترميز يحدث فقط في جانب العميل
  
  // وظيفة لتبديل حالة الشريط الجانبي
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      <div className="flex h-screen bg-background text-foreground">
        {!hideSidebar && (
          <ClientOnly>
            <Sidebar />
          </ClientOnly>
        )}
        
        {/* Main Content Area */}
        <div className={`flex flex-col flex-1 overflow-y-auto ${hideSidebar ? 'p-0' : 'p-6'}`}>
          {/* Header at the top with bottom margin */}
          <div className="mb-6">
            <Header title={title} />
          </div>
          
          {/* Main Content with scroll - direct child of content area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}