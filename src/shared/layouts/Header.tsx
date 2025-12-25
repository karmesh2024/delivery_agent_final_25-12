"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { 
  FiSearch, 
  FiBell, 
  FiMoon, 
  FiSun, 
  FiMenu, 
  FiX 
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Header({ className, title = "لوحة التحكم", ...props }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // useEffect only runs on the client, so we need to wait for mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header 
      className={cn(
        "flex h-16 items-center px-3 md:px-5 bg-white dark:bg-slate-900 transition-all duration-300 shadow-sm mt-8 mb-4 rounded-t-lg border-b-2 border-blue-500",
         className
      )} 
      {...props}
    >
      <div className="flex flex-1 items-center justify-between gap-x-4">
        {/* عنوان الصفحة */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200 rtl:ml-2">{title}</h1>
        </div>

        {/* البحث والأزرار */}
        <div className="flex items-center gap-2">
          {/* البحث للشاشات المتوسطة والكبيرة */}
          <div className={cn(
            "transition-all duration-300 relative",
            {
              "w-0 opacity-0 overflow-hidden md:w-60 md:opacity-100": !showSearch,
              "w-full opacity-100": showSearch
            }
          )}>
            <GlobalSearch
              placeholder="بحث عن مندوبين أو طلبات..."
              onClose={() => setShowSearch(false)}
              className="w-full"
            />
          </div>

          {/* زر بحث للشاشات الصغيرة */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FiSearch className="h-5 w-5" />
          </Button>

          {/* زر الإشعارات */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <FiBell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-500 ring-1 ring-white dark:ring-slate-900"></span>
          </Button>

          {/* زر تبديل الوضع المظلم/الفاتح */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            {mounted && theme === "dark" ? (
              <FiSun className="h-5 w-5" />
            ) : (
              <FiMoon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}