'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchZoonRooms, toggleRoomStatus, updateZoonRoom, createZoonRoom, createZoonPost } from '@/domains/zoon-club/store/zoonClubSlice';
import { RoomCard } from '@/domains/zoon-club/components/RoomCard';
import { RoomSettingsDialog } from '@/domains/zoon-club/components/RoomSettingsDialog';
import { PostDialog } from '@/domains/zoon-club/components/PostDialog';
import { Button } from "@/shared/components/ui/button";
import { FiArrowRight, FiPlus, FiRefreshCw, FiHelpCircle, FiEdit, FiZap, FiLayers, FiPieChart } from "react-icons/fi";
import Link from 'next/link';
import { ZoonRoom, ZoonPost } from '@/domains/zoon-club/services/zoonClubService';

export default function RoomsManagementPage() {
  const dispatch = useAppDispatch();
  const { rooms, loading, error } = useAppSelector((state) => state.zoonClub);
  
  // Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ZoonRoom | null>(null);

  useEffect(() => {
    dispatch(fetchZoonRooms());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchZoonRooms());
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    dispatch(toggleRoomStatus({ id, isActive: !currentStatus }));
  };

  const handleManage = (room: ZoonRoom) => {
    setSelectedRoom(room);
    setIsSettingsOpen(true);
  };

  const handleAddNewRoom = () => {
    setSelectedRoom(null);
    setIsSettingsOpen(true);
  };

  const handleOpenPostDialog = () => {
    setIsPostOpen(true);
  };

  const handleUpdateRoom = (id: string | null, values: Partial<ZoonRoom>) => {
    if (id) {
      dispatch(updateZoonRoom({ id, updates: values }));
    } else {
      dispatch(createZoonRoom(values));
    }
  };

  const handleCreatePost = (values: Partial<ZoonPost>) => {
    dispatch(createZoonPost(values));
  };

  return (
    <DashboardLayout title="إدارة غرف نادي زوون">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/club-zone">
                <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-gray-500">
                  <FiArrowRight className="ml-1" /> العودة للوحة التحكم
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">إدارة الغرف والمحتوى</h1>
            <p className="text-gray-500">التحكم في غرف نادي زوون الثمانية وإعدادات كل غرفة</p>
          </div>
          
          <div className="flex gap-2 text-right">
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={handleOpenPostDialog}>
              <FiEdit className="ml-2" /> منشور جديد
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw className={`ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddNewRoom}>
              <FiPlus className="ml-2" /> إضافة غرفة جديدة
            </Button>
          </div>
        </div>

        {/* 🚀 مركز التحكم السريع - نظام 2026 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/club-zone/admin/moderation" className="group">
            <div className="bg-white border-2 border-yellow-100 hover:border-yellow-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-yellow-50 text-yellow-600 p-3 rounded-lg group-hover:bg-yellow-100 transition-colors">
                <FiEdit className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">رقابة المحتوى</h3>
                <p className="text-xs text-gray-500">مراجعة منشورات المستخدمين والقبول/الرفض</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/ai-settings" className="group">
            <div className="bg-white border-2 border-indigo-100 hover:border-indigo-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <FiZap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">المحرك النفسي 🧠</h3>
                <p className="text-xs text-gray-500">إعدادات الذكاء الاصطناعي والتنميط النفسي</p>
              </div>
            </div>
          </Link>

          <Link href="/club-zone/admin/bazzzz" className="group">
            <div className="bg-white border-2 border-blue-100 hover:border-blue-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
                <FiZap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">إدارة الـ Bazzzz</h3>
                <p className="text-xs text-gray-500">التحكم في التفاعلات والنقاط والأثر النفسي</p>
              </div>
            </div>
          </Link>

          <Link href="/club-zone/admin/circles" className="group">
            <div className="bg-white border-2 border-green-100 hover:border-green-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-green-50 text-green-600 p-3 rounded-lg group-hover:bg-green-100 transition-colors">
                <FiLayers className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">إدارة الدوائر</h3>
                <p className="text-xs text-gray-500">خوارزميات المطابقة والروابط الاجتماعية</p>
              </div>
            </div>
          </Link>

          <Link href="/club-zone/admin/insights" className="group">
            <div className="bg-white border-2 border-rose-100 hover:border-rose-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-lg group-hover:bg-rose-100 transition-colors">
                <FiPieChart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">نبض زوون</h3>
                <p className="text-xs text-gray-500">تحليلات الأثر والبيانات الضخمة</p>
              </div>
            </div>
          </Link>

          <Link href="/club-zone/rooms/management/questions" className="group">
            <div className="bg-white border-2 border-purple-100 hover:border-purple-400 p-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-4">
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg group-hover:bg-purple-100 transition-colors">
                <FiHelpCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">بنك الأسئلة</h3>
                <p className="text-xs text-gray-500">إدارة الـ Profiling ومحفزات الأسئلة</p>
              </div>
            </div>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 text-red-700">
            خطأ في جلب البيانات: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && rooms.length === 0 ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
            ))
          ) : (
            rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onManage={handleManage}
                onToggleStatus={handleToggleStatus}
              />
            ))
          )}
        </div>

        {rooms.length === 0 && !loading && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-500">لا توجد غرف مضافة حالياً. يرجى التأكد من تنفيذ ملف التهيئة SQL.</p>
          </div>
        )}

        <RoomSettingsDialog 
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            room={selectedRoom}
            onSubmit={handleUpdateRoom}
        />

        <PostDialog 
            open={isPostOpen}
            onOpenChange={setIsPostOpen}
            onSubmit={handleCreatePost}
            rooms={rooms}
        />
      </div>
    </DashboardLayout>
  );
}
