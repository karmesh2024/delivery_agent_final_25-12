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
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiKey,
  FiUser,
  FiCreditCard,
  FiLayers,
  FiTag,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiShoppingCart,
  FiBriefcase,
  FiClipboard
} from "react-icons/fi";

// مكون للتأكد من أن المحتوى يظهر فقط بعد اكتمال الهيدريشن
// function ClientOnly({ children }: { children: React.ReactNode }) { // معلق للاختبار مرة أخرى
//   const [hasMounted, setHasMounted] = useState(false);
//   
//   useEffect(() => {
//     setHasMounted(true);
//   }, []);
//   
//   if (!hasMounted) {
//     return null;
//   }
//   
//   return <>{children}</>;
// }

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isExpanded, toggleSidebar } = useSidebar();
  
  // حالة لتتبع ما إذا كان المكون قد تم تحميله في المتصفح
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const mainRoutes = [
    { name: "Dashboard", href: "/", icon: FiHome },
    { name: "Orders", href: "/orders", icon: FiBox },
    { name: "Customers", href: "/customers", icon: FiUser },
    { name: "العملاء غير المسجلين", href: "/unregistered-customers", icon: FiUsers },
    { name: "الإدارة المالية", href: "/financial-management", icon: FiDollarSign },
    { name: "إدارة المخازن", href: "/warehouse-management", icon: FiPackage },
    { name: "إدارة الموردين", href: "/supplier-management", icon: FiShoppingBag },
    { name: "إدارة الشركاء الصناعيين", href: "/industrial-partners", icon: FiBriefcase },
    { name: "إدارة المتاجر الالكترونية", href: "/store-management", icon: FiShoppingCart },
    { name: "الوكلاء المعتمدون", href: "/approved-agents", icon: FiUsers },
    { name: "Delivery Agents", href: "/agents", icon: FiTruck },
    { name: "Trips", href: "/trips", icon: FiTruck },
    { name: "إدارة الفئات والمنتجات", href: "/product-categories", icon: FiLayers },
    { name: "Map View", href: "/map-view", icon: FiMap },
    { name: "Analytics", href: "/analytics", icon: FiBarChart2 },
    { name: "البورصة", href: "/financial-management/exchange", icon: FiDollarSign },
    { name: "Messages", href: "/messages", icon: FiMessageSquare },
    { name: "Support", href: "/support", icon: FiHelpCircle },
    { name: "الإعدادات", href: "/settings", icon: FiSettings },
    { name: "مركز الإدارة", href: "/administration-center", icon: FiSettings },
  ];

  const sidebarStyle = {
    background: '#000000', // Changed to solid black
    color: '#fff',
    minHeight: '100vh',
    width: isExpanded ? '240px' : '72px', // Original style
    transition: 'width 0.2s', // Original style
    boxShadow: '2px 0 16px rgba(0,0,0,0.10)', // Original style
    display: 'flex',
    flexDirection: 'column' as const, // Original style
    overflow: 'hidden', // Original style
    // padding: '20px', // Removed (was part of diagnostic)
    // zIndex: 1000,      // Removed (was part of diagnostic)
    // border: '5px solid yellow' // Removed (was part of diagnostic)
  };

  const itemStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px', // Original style
    margin: '10px 8px', // Original style
    borderRadius: '10px', // Original style
    color: '#fff', // Original style
    background: active ? 'rgba(52, 152, 219, 0.15)' : 'transparent', // Original style
    borderLeft: active ? '4px solid #3498db' : '4px solid transparent', // Original style
    fontWeight: active ? 700 : 500, // Original style
    cursor: 'pointer',
    transition: 'background 0.2s, border 0.2s', // Original style
    whiteSpace: 'nowrap' as const, // Original style
  });

  const iconStyle = {
    color: '#fff', // Original style
    marginRight: isExpanded ? '18px' : '0', // Original style
    fontSize: '24px', // Original style
    minWidth: '24px', // Original style
    textAlign: 'center' as const, // Original style
    transition: 'margin 0.2s', // Original style
  };

  const labelStyle = {
    color: '#fff', // Original style
    fontSize: '17px', // Original style
    fontWeight: 500, // Original style
    letterSpacing: '0.5px', // Original style
    opacity: isExpanded ? 1 : 0,
    transition: 'opacity 0.2s, width 0.2s', // Original style
    width: isExpanded ? 'auto' : '0', // Original style
    overflow: 'hidden', // Original style
  };

  // تعريف وظيفة تسجيل الخروج
  const handleLogout = async () => {
    try {
      // تنفيذ تسجيل الخروج وانتظار النتيجة
      const result = await dispatch(logout());
      
      // إزالة جميع بيانات المصادقة من التخزين المحلي والكوكيز
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        sessionStorage.clear();
        
        // إزالة الكوكيز
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'isAuthenticated=false; path=/;';
        
        // إعادة تحميل الصفحة
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('[Sidebar] Error during logout:', error);
      // حتى في حالة الخطأ، نقوم بإعادة تحميل الصفحة
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    // <div style={sidebarStyle}> // Original wrapper was className based
    <div className={`flex flex-col h-screen ${isExpanded ? 'w-60' : 'w-[72px]'} bg-black text-white shadow-lg transition-all duration-200 ease-in-out overflow-hidden`}>
      {/* Logo and Title */}
      <div className="flex items-center p-5 border-b border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">+</span>
            </div>
          </div>
          <div className={`ml-3 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <span className="text-xl font-medium text-white">DeliveryApp</span>
          </div>
        </div>
      </div>
      {/* زر التوسعة/الطي */}
      <button
        className={`flex items-center p-4 my-2 mx-2 rounded-lg hover:bg-blue-900/20 transition-all duration-200`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <div className="text-white text-xl min-w-[24px] text-center">
          {(isExpanded ? <FiChevronLeft className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />)}
        </div>
        <span className={`ml-4 text-white transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          Toggle Sidebar
        </span>
      </button>
      {/* Main Menu */}
      <div className="px-4 mt-6">
        {isExpanded && (
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            MAIN MENU
          </h2>
        )}
      </div>
      <nav className="flex-grow px-3 space-y-1 overflow-y-auto">
        {mainRoutes.map((route) => {
          const isActive = pathname !== null && 
            (route.href === "/" 
              ? pathname === route.href 
              : pathname.startsWith(route.href));
          
          return (
            <button
              key={route.name}
              className={`flex items-center w-full p-4 my-2 rounded-lg transition-all duration-200
                ${isActive ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
                hover:bg-blue-900/10`}
              title={!isExpanded ? route.name : undefined}
              onClick={() => {
                router.push(route.href);
              }}
            >
              <route.icon className="text-white text-xl min-w-[24px] text-center" />
              <span className={`ml-4 text-white font-medium transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {route.name}
              </span>
            </button>
          );
        })}
      </nav>
      {/* Logout Button */}
      <div className="px-3 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-4 my-2 rounded-lg text-red-400 hover:bg-red-900/10 transition-all duration-200"
          title={!isExpanded ? "Logout" : undefined}
        >
          <FiLogOut className="text-red-400 text-xl min-w-[24px] text-center" />
          <span className={`ml-4 transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Logout
          </span>
        </button>
      </div>
      {/* User Profile */}
      <div className="border-t border-gray-700 p-4 mt-2">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div className={`ml-3 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="text-sm font-medium text-white">Admin User</div>
            <div className="text-xs text-gray-400">admin@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}