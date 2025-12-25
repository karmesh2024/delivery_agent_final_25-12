"use client";

/**
 * صفحة الرحلات الرئيسية
 * تعرض قائمة الرحلات ولوحة التحكم والإحصائيات
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { TripList } from '../components/TripList';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Activity,
  PackageCheck
} from 'lucide-react';
import { Trip } from '../types';
import { fetchTripStats } from '../store/tripsSlice';
import { useEffect } from 'react';

export function TripsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalDistance: 0,
    totalDuration: 0
  });

  // جلب إحصائيات الرحلات عند تحميل الصفحة
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await dispatch(fetchTripStats()).unwrap();
        setStats(result);
      } catch (error) {
        console.error('فشل في جلب إحصائيات الرحلات:', error);
      }
    };

    fetchStats();
  }, [dispatch]);

  // الانتقال إلى صفحة تفاصيل الرحلة
  const handleViewDetails = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  // الانتقال إلى صفحة إنشاء رحلة جديدة
  const handleCreateTrip = () => {
    router.push('/trips/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة الرحلات</h1>
        <Button onClick={handleCreateTrip}>
          <Plus className="ml-2 h-4 w-4" />
          رحلة جديدة
        </Button>
      </div>

      {/* لوحة الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الرحلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="ml-2 h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الرحلات المجدولة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="ml-2 h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.scheduled}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              رحلات قيد التنفيذ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="ml-2 h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الرحلات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PackageCheck className="ml-2 h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المسافة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="ml-2 h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">{stats.totalDistance.toFixed(1)} كم</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الوقت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="ml-2 h-4 w-4 text-indigo-600" />
              <span className="text-2xl font-bold">
                {Math.floor(stats.totalDuration / 60)} ساعة و {stats.totalDuration % 60} دقيقة
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الرحلات */}
      <TripList onViewDetails={handleViewDetails} />
    </div>
  );
}