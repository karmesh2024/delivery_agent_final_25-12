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
        "flex h-20 items-center px-6 transition-all duration-300 glass-card rounded-3xl m-6 mb-8 border border-white/5",
         className
      )} 
      {...props}
    >
      <div className="flex flex-1 items-center justify-between gap-x-4">
        {/* عنوان الصفحة */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight glow-text">{title}</h1>
        </div>

        {/* البحث والأزرار */}
        <div className="flex items-center gap-3">
          {/* البحث للشاشات المتوسطة والكبيرة */}
          <div className={cn(
            "transition-all duration-300 relative",
            {
              "w-0 opacity-0 overflow-hidden md:w-80 md:opacity-100": !showSearch,
              "w-full opacity-100": showSearch
            }
          )}>
            <GlobalSearch
              placeholder="ابحث عن أي شيء هنا..."
              onClose={() => setShowSearch(false)}
              className="w-full h-12 bg-white/5 border-white/5 rounded-2xl premium-hover"
            />
          </div>

          {/* أزرار الإجراءات الفاخرة */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
            {/* زر بحث للشاشات الصغيرة */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => setShowSearch(!showSearch)}
            >
              <FiSearch className="h-5 w-5" />
            </Button>

            {/* زر الإشعارات */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <FiBell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#0a0f18] animate-pulse"></span>
            </Button>

            {/* زر تبديل الوضع المظلم/الفاتح */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              {mounted && theme === "dark" ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}