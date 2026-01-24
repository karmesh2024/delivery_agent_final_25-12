'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiUsers, FiStar, FiGift, FiBriefcase, FiTrendingUp, FiActivity, FiRadio } from "react-icons/fi";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMemberships, fetchPartners, fetchRewards, fetchPointsTransactions } from '@/domains/club-zone/store/clubZoneSlice';
import { supabase } from '@/lib/supabase';

export default function ClubZoneDashboardPage() {
  const dispatch = useAppDispatch();
  const [isSettlementDue, setIsSettlementDue] = useState(false);
  const { 
    membershipsCount, 
    partnersCount, 
    rewardsCount,
    pointsTransactions,
    loading 
  } = useAppSelector((state) => state.clubZone);

  useEffect(() => {
    // Load initial data
    dispatch(fetchMemberships({ is_active: true }));
    dispatch(fetchPartners({ is_active: true }));
    dispatch(fetchRewards({ is_active: true }));
    dispatch(fetchPointsTransactions({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const loadSettlementDue = async () => {
      try {
        const { data, error } = await supabase.rpc('check_monthly_settlement_due');
        if (error) throw error;
        setIsSettlementDue(Boolean(data));
      } catch {
        // ignore banner if RPC is not available
        setIsSettlementDue(false);
      }
    };
    loadSettlementDue();
  }, []);

  // Calculate stats
  const activeRewards = rewardsCount;
  const activePartners = partnersCount;
  const totalMembers = membershipsCount;

  // Calculate total points spent
  const totalPointsSpent = pointsTransactions
    .filter(tx => tx.transaction_type === 'USED')
    .reduce((sum, tx) => sum + Math.abs(tx.points), 0);

  // Get top reward (most redeemed) - simplified for now
  const topReward = null; // TODO: Calculate from redemptions

  return (
    <DashboardLayout title="نادي Scope Zone">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">لوحة تحكم النادي</h1>
        </div>
        <p className="text-gray-600 mb-6">
          نظرة شاملة على نشاط نادي Scope Zone: الأعضاء، النقاط، الجوائز، والرعاة
        </p>

        {isSettlementDue && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900">⚠️ اعتماد نقاط الشهر مطلوب</CardTitle>
              <CardDescription className="text-yellow-800">
                V1.3: “رصيد هذا الشهر” لا يصبح متاحًا إلا بعد الاعتماد الشهري للحفاظ على استدامة الجوائز.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/points">
                <button className="bg-yellow-700 text-white py-2 px-4 rounded-lg hover:bg-yellow-800 transition">
                  الذهاب لإدارة النقاط
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* عدد الأعضاء */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiUsers className="mr-2 text-blue-500" />
                عدد الأعضاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMembers}</div>
              <p className="text-xs text-gray-500 mt-1">عضو نشط</p>
            </CardContent>
          </Card>

          {/* إجمالي النقاط المصروفة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiStar className="mr-2 text-yellow-500" />
                النقاط المصروفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPointsSpent.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">نقطة</p>
            </CardContent>
          </Card>

          {/* عدد الجوائز النشطة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiGift className="mr-2 text-purple-500" />
                الجوائز النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeRewards}</div>
              <p className="text-xs text-gray-500 mt-1">جائزة</p>
            </CardContent>
          </Card>

          {/* عدد الشركاء */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiBriefcase className="mr-2 text-green-500" />
                الشركاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activePartners}</div>
              <p className="text-xs text-gray-500 mt-1">شريك نشط</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* إدارة الأعضاء */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiUsers className="mr-2 text-blue-500" />
                إدارة الأعضاء
              </CardTitle>
              <CardDescription>
                عرض وإدارة أعضاء النادي وترقية العضويات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/members">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  عرض الأعضاء
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* إدارة النقاط */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiStar className="mr-2 text-yellow-500" />
                إدارة النقاط
              </CardTitle>
              <CardDescription>
                تتبع معاملات نقاط النادي وتحويل النقاط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/points">
                <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition">
                  عرض النقاط
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* إدارة الجوائز */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiGift className="mr-2 text-purple-500" />
                إدارة الجوائز
              </CardTitle>
              <CardDescription>
                إدارة الجوائز والهدايا المتاحة للاستبدال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/rewards">
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
                  عرض الجوائز
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* إدارة الرعاة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiBriefcase className="mr-2 text-green-500" />
                إدارة الرعاة
              </CardTitle>
              <CardDescription>
                إدارة الشركاء والرعاة التجاريين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/partners">
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                  عرض الرعاة
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* راديو كارمش */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiRadio className="mr-2 text-red-500" />
                راديو كارمش
              </CardTitle>
              <CardDescription>
                إدارة البث المباشر وتتبع المستمعين النشطين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/club-zone/radio">
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition">
                  فتح الراديو
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* نشاط الأسبوع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FiActivity className="mr-2 text-orange-500" />
                نشاط الأسبوع
              </CardTitle>
              <CardDescription>
                نظرة على نشاط النادي خلال الأسبوع الماضي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                قريباً: رسوم بيانية للنشاط
              </p>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
