"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { 
  FiSearch, 
  FiX, 
  FiFilter, 
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiMapPin,
  FiStar
} from "react-icons/fi";
import { Agent, AgentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { SearchService, SearchFilters } from "@/services/searchService";

interface AgentsSearchProps {
  agents: Agent[];
  onFilteredAgents: (agents: Agent[]) => void;
  className?: string;
}

interface LocalSearchFilters {
  query: string;
  status: AgentStatus;
  minRating: number;
  hasLocation: boolean;
  sortBy: 'name' | 'rating' | 'deliveries' | 'lastActive';
  sortOrder: 'asc' | 'desc';
}

export function AgentsSearch({ agents, onFilteredAgents, className }: AgentsSearchProps) {
  const [searchFilters, setSearchFilters] = useState<LocalSearchFilters>({
    query: '',
    status: 'all',
    minRating: 0,
    hasLocation: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // تصفية وترتيب المندوبين باستخدام خدمة البحث
  useEffect(() => {
    const performSearch = async () => {
      setIsSearching(true);
      
      try {
        const searchResult = await SearchService.searchAgents(agents, {
          query: searchFilters.query,
          status: searchFilters.status === 'all' ? undefined : searchFilters.status as any,
          minRating: searchFilters.minRating > 0 ? searchFilters.minRating : undefined,
          hasLocation: searchFilters.hasLocation || undefined,
          sortBy: searchFilters.sortBy,
          sortOrder: searchFilters.sortOrder
        });

        onFilteredAgents(searchResult.agents);
        setIsSearching(false);
      } catch (error) {
        console.error('خطأ في البحث:', error);
        onFilteredAgents(agents);
        setIsSearching(false);
      }
    };
    
    performSearch();
  }, [agents, searchFilters, onFilteredAgents]);

  // تحديث البحث
  const handleSearchChange = (value: string) => {
    setSearchFilters(prev => ({ ...prev, query: value }));
  };

  // تحديث الفلاتر
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  // مسح جميع الفلاتر
  const clearAllFilters = () => {
    setSearchFilters({
      query: '',
      status: 'all',
      minRating: 0,
      hasLocation: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  // إحصائيات البحث
  const searchStats = useMemo(() => {
    const stats = SearchService.getSearchStats(agents, {
      query: searchFilters.query,
      status: searchFilters.status === 'all' ? undefined : searchFilters.status as any,
      minRating: searchFilters.minRating > 0 ? searchFilters.minRating : undefined,
      hasLocation: searchFilters.hasLocation || undefined
    });

    return stats;
  }, [agents, searchFilters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* شريط البحث الرئيسي */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ابحث عن مندوب بالاسم، الهاتف، كود التوصيل، أو نوع المركبة..."
            value={searchFilters.query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
            dir="rtl"
          />
          {searchFilters.query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <FiX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <FiFilter className="h-4 w-4" />
            فلاتر متقدمة
          </Button>
          
          {searchStats.hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              <FiRefreshCw className="h-4 w-4" />
              مسح الكل
            </Button>
          )}
        </div>
      </div>

      {/* إحصائيات البحث */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FiUser className="h-4 w-4" />
          <span>
            {searchStats.total} مندوب إجمالي
          </span>
        </div>
        
        {searchStats.hasActiveFilters && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FiFilter className="h-3 w-3" />
            فلاتر نشطة
          </Badge>
        )}
        
        {isSearching && (
          <div className="flex items-center gap-2 text-blue-600">
            <FiRefreshCw className="h-4 w-4 animate-spin" />
            جاري البحث...
          </div>
        )}
      </div>

      {/* الفلاتر المتقدمة */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">فلاتر متقدمة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر الحالة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={searchFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value as AgentStatus)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="online">متاح</option>
                <option value="offline">غير نشط</option>
                <option value="busy">مشغول</option>
              </select>
            </div>

            {/* فلتر التقييم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحد الأدنى للتقييم
              </label>
              <select
                value={searchFilters.minRating}
                onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={0}>جميع التقييمات</option>
                <option value={1}>⭐ 1+ نجوم</option>
                <option value={2}>⭐⭐ 2+ نجوم</option>
                <option value={3}>⭐⭐⭐ 3+ نجوم</option>
                <option value={4}>⭐⭐⭐⭐ 4+ نجوم</option>
                <option value={4.5}>⭐⭐⭐⭐⭐ 4.5+ نجوم</option>
              </select>
            </div>

            {/* فلتر الموقع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasLocation"
                  checked={searchFilters.hasLocation}
                  onChange={(e) => handleFilterChange('hasLocation', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="hasLocation" className="text-sm text-gray-700">
                  لديه موقع محدد
                </label>
              </div>
            </div>

            {/* ترتيب النتائج */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ترتيب حسب
              </label>
              <div className="space-y-2">
                <select
                  value={searchFilters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="name">الاسم</option>
                  <option value="rating">التقييم</option>
                  <option value="deliveries">عدد التوصيلات</option>
                  <option value="lastActive">آخر نشاط</option>
                </select>
                <select
                  value={searchFilters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="asc">تصاعدي</option>
                  <option value="desc">تنازلي</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نتائج البحث السريع */}
      {searchFilters.query && !isSearching && (
        <div className="text-center py-8 text-gray-500">
          <FiSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">لم يتم العثور على نتائج</p>
          <p className="text-sm">جرب تغيير كلمات البحث أو الفلاتر</p>
        </div>
      )}
    </div>
  );
}
