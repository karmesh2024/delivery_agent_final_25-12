'use client';

import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import PulseTopicManager from '@/domains/zoon-os/components/PulseTopicManager';
import { FiTrendingUp, FiActivity, FiSettings } from 'react-icons/fi';
import { Card, CardContent } from '@/shared/components/ui/card';

export default function PulseSettingsPage() {
  return (
    <DashboardLayout title="إعدادات النبض الاستباقي | Zoon OS">
      <div className="space-y-6 px-4 py-8 max-w-6xl mx-auto" dir="rtl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">إعدادات النبض الاستباقي (Proactive Pulse)</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              التحكم في مواضيع البحث التلقائي وفترات تحديث ذكاء السوق في Zoon OS
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
               <FiActivity className="h-6 w-6 animate-pulse" />
             </div>
          </div>
        </div>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6 border-gray-100">
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><FiActivity /></div>
                <h4 className="font-semibold">توقيت حقيقي</h4>
              </div>
              <p className="text-sm text-gray-500">يتم تحديث البيانات بناءً على الفواصل الزمنية التي تحددها لكل موضوع بحث.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FiTrendingUp /></div>
                <h4 className="font-semibold">تغطية ذكية</h4>
              </div>
              <p className="text-sm text-gray-500">يستخدم Zoon OS أدوات بحث متقدمة لاقتناص أسعار السوق والفرص اللحظية.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FiSettings /></div>
                <h4 className="font-semibold">مرونة كاملة</h4>
              </div>
              <p className="text-sm text-gray-500">يمكنك إضافة أو تعطيل أو تغيير وتيرة فحص أي موضوع في أي وقت.</p>
            </CardContent>
          </Card>
        </div>

        {/* Table/Manager Component */}
        <PulseTopicManager />

      </div>
    </DashboardLayout>
  );
}
