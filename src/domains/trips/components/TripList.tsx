"use client";

/**
 * مكون قائمة الرحلات
 * يعرض قائمة من الرحلات مع دعم التصفية والبحث والتنقل بين الصفحات
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { 
  fetchTrips, 
  setFilters, 
  setPage, 
  setSelectedTrip, 
  changeTripStatus
} from '../store/tripsSlice';
import { Trip, TripFilters, TripStatus, TripPriority } from '../types';
import { TripListItem } from './TripListItem';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Loader2, Filter, Search, RefreshCw } from 'lucide-react';

interface TripListProps {
  onViewDetails: (tripId: string) => void;
  agentId?: string;
}

export function TripList({ onViewDetails, agentId }: TripListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    trips,
    filters,
    isLoading,
    totalCount,
    page,
    limit
  } = useSelector((state: RootState) => state.trips);

  // حالة محلية لفلاتر متغيرة
  const [localFilters, setLocalFilters] = useState<TripFilters>(filters || {});
  const [searchQuery, setSearchQuery] = useState(filters?.searchQuery || '');

  // جلب الرحلات عند تحميل المكون
  useEffect(() => {
    // إذا تم تحديد معرف وكيل، قم بإضافته إلى الفلاتر
    const initialFilters = agentId ? { ...filters, agentId } : filters;
    dispatch(fetchTrips({ filters: initialFilters, page, limit }));
  }, [dispatch, page, limit, agentId, filters]);

  // تحديث الفلاتر المحلية عند تغيير الفلاتر الرئيسية
  useEffect(() => {
    setLocalFilters(filters || {});
    setSearchQuery(filters?.searchQuery || '');
  }, [filters]);

  // وظيفة التصفية
  const applyFilters = () => {
    // إضافة نص البحث إلى الفلاتر
    const updatedFilters = {
      ...localFilters,
      searchQuery: searchQuery.trim() || undefined,
    };

    // إذا تم تحديد معرف وكيل، قم بإضافته إلى الفلاتر
    if (agentId) {
      updatedFilters.agentId = agentId;
    }

    // تحديث الفلاتر الرئيسية
    dispatch(setFilters(updatedFilters));
    // إعادة تعيين الصفحة إلى 1
    dispatch(setPage(1));
    // جلب الرحلات بالفلاتر الجديدة
    dispatch(fetchTrips({ filters: updatedFilters, page: 1, limit }));
  };

  // مسح الفلاتر
  const clearFilters = () => {
    // إعداد الفلاتر الأولية
    const initialFilters: TripFilters = agentId ? { agentId } : {};
    
    // تحديث الحالة المحلية
    setLocalFilters(initialFilters);
    setSearchQuery('');
    
    // تحديث الفلاتر الرئيسية
    dispatch(setFilters(initialFilters));
    dispatch(setPage(1));
    dispatch(fetchTrips({ filters: initialFilters, page: 1, limit }));
  };

  // تحديد رحلة
  const handleSelectTrip = (trip: Trip) => {
    dispatch(setSelectedTrip(trip));
  };

  // تغيير حالة الرحلة
  const handleStatusChange = (tripId: string, newStatus: TripStatus) => {
    dispatch(changeTripStatus({ tripId, newStatus }))
      .then(() => {
        // تحديث قائمة الرحلات بعد تغيير الحالة
        dispatch(fetchTrips({ filters, page, limit }));
      });
  };

  // التنقل بين الصفحات
  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    dispatch(fetchTrips({ filters, page: newPage, limit }));
  };

  // حساب عدد الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      {/* منطقة التصفية والبحث */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-4">فلاتر الرحلات</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* حقل البحث */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>

          {/* فلتر الحالة */}
          <Select
            value={localFilters.status || 'all'}
            onValueChange={(value) => 
              setLocalFilters({ ...localFilters, status: value === 'all' ? undefined : value as TripStatus })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="scheduled">مجدولة</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="cancelled">ملغاة</SelectItem>
            </SelectContent>
          </Select>

          {/* فلتر الأولوية */}
          <Select
            value={localFilters.priority || 'all'}
            onValueChange={(value) => 
              setLocalFilters({ ...localFilters, priority: value === 'all' ? undefined : (value as TripPriority) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
            </SelectContent>
          </Select>

          {/* أزرار التصفية */}
          <div className="flex space-x-2">
            <Button onClick={applyFilters} className="mr-2 flex-1">
              <Filter className="ml-2 h-4 w-4" />
              تصفية
            </Button>
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              <RefreshCw className="ml-2 h-4 w-4" />
              مسح
            </Button>
          </div>
        </div>
      </div>

      {/* قائمة الرحلات */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          الرحلات ({totalCount})
          {isLoading && <Loader2 className="inline animate-spin mr-2" />}
        </h2>

        {/* عرض الرسالة عندما لا توجد رحلات */}
        {!isLoading && trips && trips.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            لا توجد رحلات متاحة. يرجى تغيير الفلاتر أو إنشاء رحلات جديدة.
          </div>
        )}

        {/* عرض قائمة الرحلات */}
        {trips && trips.map((trip: Trip) => (
          <TripListItem
            key={trip.id}
            trip={trip}
            onSelect={handleSelectTrip}
            onViewDetails={onViewDetails}
            onStatusChange={handleStatusChange}
          />
        ))}

        {/* التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="ml-2"
            >
              السابق
            </Button>
            <span className="mx-4">
              الصفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}