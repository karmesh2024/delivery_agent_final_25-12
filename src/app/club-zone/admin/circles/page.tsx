'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCircles, updateCircleWeights, fetchZoonRooms } from '@/domains/zoon-club/store/zoonClubSlice';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { FiUsers, FiTarget, FiSettings, FiActivity, FiLayers, FiBox } from "react-icons/fi";
import { RootState } from '@/store';
import { toast } from 'react-hot-toast';

export default function CircleManagementPage() {
  const dispatch = useAppDispatch();
  const { circles, rooms, loading } = useAppSelector((state: RootState) => state.zoonClub);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCircles());
    dispatch(fetchZoonRooms());
  }, [dispatch]);

  // تصفية الدوائر بناءً على الغرفة المختارة
  const filteredCircles = selectedRoomId 
    ? circles.filter(c => c.room_id === selectedRoomId)
    : [];

  const selectedCircle = circles.find(c => c.id === selectedCircleId);

  const handleWeightChange = async (key: string, value: number) => {
    if (!selectedCircle) return;
    
    const newWeights = {
      ...(selectedCircle.matching_weights || {}),
      [key]: value
    };

    try {
      await dispatch(updateCircleWeights({ id: selectedCircle.id, weights: newWeights })).unwrap();
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث الأوزان');
    }
  };

  return (
    <DashboardLayout title="إدارة الدوائر الكونية - نادي زوون">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">إدارة الدوائر والروابط (Cosmic Circles)</h1>
            <p className="text-gray-500">التحكم في الهيكل الاجتماعي لكل غرفة (نظام 2026)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. قائمة الغرف (Sidebar 1) */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FiBox /> اختر الغرفة الرئيسية
            </h2>
            <div className="space-y-2">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setSelectedCircleId(null);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex justify-between items-center ${selectedRoomId === room.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'bg-white hover:bg-gray-100 border'}`}
                >
                  <span>{room.name_ar}</span>
                  <Badge variant={selectedRoomId === room.id ? "secondary" : "outline"} className="text-[10px]">
                    {circles.filter(c => c.room_id === room.id).length} دوائر
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* 2. قائمة الدوائر داخل الغرفة (Sidebar 2) */}
          <div className="lg:col-span-3 space-y-4 border-r pr-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FiLayers /> الدوائر الاجتماعية
            </h2>
            {!selectedRoomId ? (
              <div className="text-xs text-gray-400 italic py-10 text-center">قم باختيار غرفة أولاً</div>
            ) : filteredCircles.length === 0 ? (
              <div className="text-xs text-amber-500 bg-amber-50 p-3 rounded border border-amber-100 italic">
                لا توجد دوائر مضافة لهذه الغرفة حتى الآن.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCircles.map((circle) => (
                  <Card 
                    key={circle.id} 
                    className={`cursor-pointer transition-all border-2 ${selectedCircleId === circle.id ? 'border-blue-500 shadow-md bg-blue-50/20' : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedCircleId(circle.id)}
                  >
                    <CardContent className="p-3">
                      <div className="font-bold text-sm truncate">{circle.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                        <FiUsers className="w-3 h-3" /> {circle.member_count} عضو
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 3. إعدادات المطابقة للجائرة المختارة */}
          <div className="lg:col-span-6">
            {selectedCircle ? (
              <div className="space-y-6">
                <Card className="border-t-4 border-t-indigo-600 shadow-xl">
                  <CardHeader className="bg-gray-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge className="bg-indigo-100 text-indigo-700 mb-2">إعدادات المطابقة الذكية</Badge>
                        <CardTitle className="text-2xl">{selectedCircle.name}</CardTitle>
                        <CardDescription>كيف سيقوم النظام بربط الأعضاء في هذه الدائرة؟</CardDescription>
                      </div>
                      <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200">
                        <FiSettings className="w-6 h-6" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-1 gap-8">
                      {/* محركات المطابقة الذكية */}
                      <div className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                        <h3 className="font-bold flex items-center gap-2 text-purple-800">
                          <FiTarget /> معايير البصمة النفسية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'].map((trait) => (
                            <div key={trait} className="space-y-2 bg-white p-3 rounded-lg border shadow-sm">
                              <div className="flex justify-between text-[11px] font-bold uppercase text-gray-500">
                                <span>{trait}</span>
                                <span className="text-indigo-600">{(selectedCircle.matching_weights?.[trait] || 50)}%</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                defaultValue={selectedCircle.matching_weights?.[trait] || 50}
                                onChange={(e) => handleWeightChange(trait, parseInt(e.target.value))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                        <h3 className="font-bold flex items-center gap-2 text-emerald-800">
                          <FiUsers /> معايير التقارب الجيو-اجتماعي
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['age_proximity', 'location', 'interests', 'behavioral_score'].map((factor) => (
                            <div key={factor} className="space-y-2 bg-white p-3 rounded-lg border shadow-sm">
                              <div className="flex justify-between text-[11px] font-bold uppercase text-gray-500">
                                <span>{factor.replace('_', ' ')}</span>
                                <span className="text-emerald-600">{(selectedCircle.matching_weights?.[factor] || 50)}%</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                defaultValue={selectedCircle.matching_weights?.[factor] || 50}
                                onChange={(e) => handleWeightChange(factor, parseInt(e.target.value))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 mt-6">
                      <FiActivity className="text-amber-600 w-5 h-5 mt-1" />
                      <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>تلميح:</strong> تغيير هذه الأوزان سيؤثر فوراً على خوارزمية البحث عن أشخاص جدد لكل عضو في هذه الدائرة. الروابط القائمة لن تتأثر.
                      </p>
                    </div>

                    {/* 👥 قائمة الأعضاء المنضمين فعلياً */}
                    <div className="mt-8 space-y-4">
                      <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                        <FiUsers className="text-blue-600" /> قائمة أعضاء الدائرة (بصمات حقيقية)
                      </h3>
                      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-black">
                            <tr>
                              <th className="p-3 text-right">العضو</th>
                              <th className="p-3 text-right">تاريخ الانضمام</th>
                              <th className="p-3 text-right">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedCircle.member_count === 0 ? (
                              <tr>
                                <td colSpan={3} className="p-10 text-center text-slate-400 italic">لا يوجد أعضاء منضمون لهذه الدائرة بعد. جرب الانضمام من صفحة المعاينة!</td>
                              </tr>
                            ) : (
                              // محاكاة سريعة حتى يتم ربط استعلام الأعضاء الفعليين بجدول zoon_circle_members
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-indigo-600">Admin User (بصمتك الحالية)</td>
                                <td className="p-3 text-slate-500">{new Date().toLocaleDateString('ar-EG')}</td>
                                <td className="p-3">
                                  <Badge className="bg-green-100 text-green-700 text-[9px]">متصل الآن</Badge>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed p-20 min-h-[400px]">
                <FiLayers className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-center font-medium">يرجى اختيار غرفة ثم اختيار دائرة اجتماعية لتعديل أوزان المطابقة</p>
                <div className="mt-4 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
