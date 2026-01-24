'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { FiRadio, FiCalendar, FiPlay, FiArrowLeft, FiGlobe } from 'react-icons/fi';
import Link from 'next/link';

export default function RadioHubPage() {
  return (
    <DashboardLayout title="راديو كارمش">
      <div className="p-6 space-y-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/club-zone">
            <FiArrowLeft className="mr-2" />
            العودة إلى لوحة التحكم
          </Link>
        </Button>

        <div className="flex items-center gap-2 mb-6">
          <FiRadio className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">راديو كارمش</h1>
        </div>

        <p className="text-muted-foreground mb-6">
          اختر نوع البث: البث المباشر الأسبوعي أو البث العام المستمر
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* البث المباشر الأسبوعي */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FiCalendar className="text-blue-500" />
                البث المباشر الأسبوعي
              </CardTitle>
              <CardDescription>
                بث مباشر أسبوعي: بدء بث جديد، تتبع المستمعين والنقاط، راديو كارمش - البث المباشر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/club-zone/radio/live">
                  <FiPlay className="mr-2" />
                  بدء بث جديد
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* البث العام */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FiGlobe className="text-green-500" />
                البث العام
              </CardTitle>
              <CardDescription>
                البث العام المستمر 24/7: مكتبة المحتوى، الجدولة، محرك القوائم، التبديل التلقائي، وإعدادات Icecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Link href="/club-zone/radio/always-on">
                  <FiRadio className="mr-2" />
                  فتح البث العام
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
