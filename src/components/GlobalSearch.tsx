"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { 
  FiSearch, 
  FiX, 
  FiUser,
  FiPhone,
  FiPackage,
  FiMapPin,
  FiClock
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Agent } from "@/types";

interface SearchResult {
  id: string;
  type: 'agent' | 'order' | 'customer';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  url: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

export function GlobalSearch({ 
  className, 
  placeholder = "بحث عن مندوبين أو طلبات...",
  onClose 
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // محاكاة البحث (يمكن استبدالها بـ API حقيقي)
  const searchData = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    setIsSearching(true);
    
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 300));

    // محاكاة بيانات البحث
    const mockResults: SearchResult[] = [
      // مندوبين وهميين
      {
        id: "agent-1",
        type: "agent",
        title: "محمد أحمد",
        subtitle: "مندوب توصيل - +201234567890",
        icon: <FiUser className="h-4 w-4" />,
        url: "/agents"
      },
      {
        id: "agent-2", 
        type: "agent",
        title: "أحمد علي",
        subtitle: "مندوب توصيل - +201234567891",
        icon: <FiUser className="h-4 w-4" />,
        url: "/agents"
      },
      // طلبات وهمية
      {
        id: "order-1",
        type: "order",
        title: "طلب #12345",
        subtitle: "من: سارة محمد - إلى: أحمد علي",
        icon: <FiPackage className="h-4 w-4" />,
        url: "/orders"
      },
      {
        id: "order-2",
        type: "order", 
        title: "طلب #12346",
        subtitle: "من: فاطمة أحمد - إلى: محمد حسن",
        icon: <FiPackage className="h-4 w-4" />,
        url: "/orders"
      },
      // عملاء وهميين
      {
        id: "customer-1",
        type: "customer",
        title: "سارة محمد",
        subtitle: "عميل - +201234567892",
        icon: <FiUser className="h-4 w-4" />,
        url: "/customers"
      }
    ];

    // تصفية النتائج بناءً على الاستعلام
    const filteredResults = mockResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setIsSearching(false);
    return filteredResults;
  };

  // البحث عند تغيير الاستعلام
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        const searchResults = await searchData(query);
        setResults(searchResults);
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // معالجة تغيير الاستعلام
  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  // معالجة اختيار نتيجة
  const handleResultSelect = (result: SearchResult) => {
    router.push(result.url);
    setQuery("");
    setShowResults(false);
    onClose?.();
  };

  // معالجة الضغط على المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // التركيز على حقل الإدخال عند فتح المكون
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={resultsRef}>
      {/* حقل البحث */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          dir="rtl"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuery("");
              setShowResults(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <FiX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* نتائج البحث */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              جاري البحث...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors",
                    selectedIndex === index && "bg-blue-50"
                  )}
                >
                  <div className="text-gray-400">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {result.type === 'agent' ? 'مندوب' : 
                     result.type === 'order' ? 'طلب' : 'عميل'}
                  </Badge>
                </button>
              ))}
            </div>
          ) : query && (
            <div className="p-4 text-center text-gray-500">
              <FiSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>لم يتم العثور على نتائج</p>
              <p className="text-sm">جرب كلمات مختلفة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
