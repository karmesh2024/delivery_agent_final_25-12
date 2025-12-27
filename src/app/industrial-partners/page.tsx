'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Briefcase, ClipboardList, TrendingUp, Handshake } from 'lucide-react';

export default function IndustrialPartnersHubPage() {
  const router = useRouter();

  const cards = [
    {
      title: 'الشركاء',
      description: 'إدارة بيانات المصانع والكسارات والتجار وتصنيفاتهم',
      icon: <Briefcase className="w-6 h-6 text-blue-600" />,
      actionText: 'إدارة الشركاء',
      actionUrl: '/industrial-partners/partners',
      color: 'bg-blue-50 border-blue-100 text-blue-900',
      btnColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'طلبات الشراء الواردة',
      description: 'متابعة طلبات المصانع لتوريد المواد الخام وحالاتها',
      icon: <ClipboardList className="w-6 h-6 text-orange-600" />,
      actionText: 'إدارة الطلبات',
      actionUrl: '/industrial-partners/orders',
      color: 'bg-orange-50 border-orange-100 text-orange-900',
      btnColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'العقود (قريباً)',
      description: 'إدارة عقود التوريد طويلة الأمد والشروط المالية',
      icon: <Handshake className="w-6 h-6 text-purple-600" />,
      actionText: 'إدارة العقود',
      actionUrl: '#',
      color: 'bg-purple-50 border-purple-100 text-purple-900',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      disabled: true
    },
     {
      title: 'تقارير المبيعات (قريباً)',
      description: 'تحليل أداء المبيعات وحجم التوريد لكل شريك',
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      actionText: 'عرض التقارير',
      actionUrl: '#',
      color: 'bg-green-50 border-green-100 text-green-900',
      btnColor: 'bg-green-600 hover:bg-green-700',
      disabled: true
    }
  ];

  return (
    <DashboardLayout title="إدارة الشركاء الصناعيين">
      <div className="p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة الشركاء الصناعيين</h1>
          <p className="text-gray-500 mt-2">
            منظومة متكاملة لإدارة علاقاتنا مع المصانع والمشترين، من التسجيل وحتى تلبية الطلبات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <Card key={index} className={`border ${card.color.includes('border') ? '' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                    {card.icon}
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-6 min-h-[50px]">
                  {card.description}
                </CardDescription>
                <Button 
                  className={`w-full ${card.btnColor}`} 
                  onClick={() => !card.disabled && router.push(card.actionUrl)}
                  disabled={card.disabled}
                >
                  {card.actionText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
