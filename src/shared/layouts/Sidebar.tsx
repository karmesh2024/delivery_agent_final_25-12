"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "@/shared/layouts/DashboardLayout";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/domains/admins/store/authSlice";
import {
  FiHome,
  FiBox,
  FiUsers,
  FiTruck,
  FiMap,
  FiBarChart2,
  FiMessageSquare,
  FiSettings,
  FiHelpCircle,
  FiChevronRight,
  FiChevronLeft,
  FiLogOut,
  FiUser,
  FiTag,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiShoppingCart,
  FiAward,
  FiClipboard
} from "react-icons/fi";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const mainRoutes = [
    { name: "لوحة القيادة", href: "/", icon: FiHome },
    { name: "الطلبات", href: "/orders", icon: FiBox },
    { name: "العملاء", href: "/customers", icon: FiUser },
    { name: "العملاء غير المسجلين", href: "/unregistered-customers", icon: FiUsers },
    { name: "الوكلاء المعتمدون", href: "/approved-agents", icon: FiUsers },
    { name: "مناديب التوصيل", href: "/agents", icon: FiTruck },
    { name: "تتبع الرحلات", href: "/trips", icon: FiTruck },
    { name: "الخارطة", href: "/map-view", icon: FiMap },
    { name: "الإدارة المالية", href: "/financial-management", icon: FiDollarSign },
    { name: "نظام النقاط", href: "/financial-management/points", icon: FiTag },
    { name: "إدارة المخازن", href: "/warehouse-management", icon: FiPackage },
    { name: "إدارة الموردين", href: "/supplier-management", icon: FiShoppingBag },
    { name: "إدارة المخلفات", href: "/waste-management", icon: FiPackage },
    { name: "المتاجر الإلكترونية", href: "/store-management", icon: FiShoppingCart },
    { name: "التحليلات", href: "/analytics", icon: FiBarChart2 },
    { name: "لوحة الرسائل", href: "/messages", icon: FiMessageSquare },
    { name: "الإحصائيات والتقارير", href: "/admin/audit-log", icon: FiClipboard },
    { name: "نادي كارمش (Scope)", href: "/club-zone", icon: FiAward },
    { name: "الدعم الفني", href: "/support", icon: FiHelpCircle },
    { name: "الإعدادات العامة", href: "/settings", icon: FiSettings },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        window.location.href = '/login';
      }
    } catch (error) {
      window.location.href = '/login';
    }
  };

  if (!isMounted) return null;

  return (
    <div className={`flex flex-col h-screen ${isExpanded ? 'w-64' : 'w-20'} bg-[#0a0f18] text-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-50 border-l border-white/5`}>
      {/* Premium Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-xl font-bold italic">K</span>
          </div>
          <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">KARMESH</span>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="mx-4 my-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5"
      >
        {isExpanded ? <FiChevronRight className="w-5 h-5 text-blue-400" /> : <FiChevronLeft className="w-5 h-5 text-blue-400" />}
      </button>

      {/* Navigation */}
      <nav className="flex-grow px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {mainRoutes.map((route) => {
          const isActive = pathname === route.href || (route.href !== "/" && pathname?.startsWith(route.href));
          
          return (
            <button
              key={route.href}
              onClick={() => router.push(route.href)}
              className={`group relative flex items-center w-full p-3.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <route.icon className={`text-xl transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
              <span className={`mr-4 font-medium transition-all duration-300 ${isExpanded ? 'opacity-100 flex' : 'opacity-0 w-0 hidden'}`}>
                {route.name}
              </span>
              {!isExpanded && (
                <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {route.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/5 bg-white/2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mb-4 group"
        >
          <FiLogOut className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className={`mr-4 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
            تسجيل الخروج
          </span>
        </button>

        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center flex-shrink-0 text-white font-bold">
            م
          </div>
          <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
            <div className="text-sm font-semibold text-white whitespace-nowrap">مدير النظام</div>
            <div className="text-xs text-gray-500 truncate">admin@karmesh.sa</div>
          </div>
        </div>
      </div>
    </div>
  );
}