"use client";

import { useState } from 'react';
import { CustomerStatus, CustomerType, CustomerFilters } from '../types';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/ui/select';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface CustomersFiltersProps {
  filters: CustomerFilters;
  onFilterChange: (filters: Partial<CustomerFilters>) => void;
  onResetFilters: () => void;
}

export function CustomersFilters({ filters, onFilterChange, onResetFilters }: CustomersFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // التعامل مع تغيير البحث
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // تنفيذ البحث عند الضغط على زر البحث أو مفتاح الإدخال
  const handleSearch = () => {
    onFilterChange({ search: searchTerm });
  };

  // تنفيذ البحث عند الضغط على مفتاح الإدخال
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* حقل البحث */}
          <div className="flex space-x-2 md:col-span-2">
            <div className="relative flex-grow">
              <Input
                placeholder="البحث بالاسم أو رقم الهاتف أو البريد الإلكتروني"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="pl-10 h-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button onClick={handleSearch} variant="default" className="gap-2">
              <Filter className="h-4 w-4" />
              بحث
            </Button>
          </div>

          {/* فلتر الحالة */}
          <div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFilterChange({ status: value as CustomerStatus | 'all' })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value={CustomerStatus.ACTIVE}>نشط</SelectItem>
                <SelectItem value={CustomerStatus.INACTIVE}>غير نشط</SelectItem>
                <SelectItem value={CustomerStatus.BLOCKED}>محظور</SelectItem>
                <SelectItem value={CustomerStatus.SUSPENDED}>موقوف</SelectItem>
                <SelectItem value={CustomerStatus.PENDING}>قيد الانتظار</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر نوع العميل */}
          <div>
            <Select
              value={filters.customerType || 'all'}
              onValueChange={(value) => onFilterChange({ customerType: value as CustomerType | 'all' })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="نوع العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value={CustomerType.HOUSEHOLD}>فرد</SelectItem>
                <SelectItem value={CustomerType.BUSINESS}>شركة</SelectItem>
                <SelectItem value={CustomerType.AGENT}>وكيل</SelectItem>
                <SelectItem value={CustomerType.OTHER}>أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* زر إعادة تعيين الفلاتر */}
          <div className="md:col-span-4 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={onResetFilters} 
              className="gap-2 text-gray-500"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 