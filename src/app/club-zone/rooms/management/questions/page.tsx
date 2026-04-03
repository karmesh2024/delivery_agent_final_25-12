'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchZoonQuestions, fetchZoonRooms } from '@/domains/zoon-club/store/zoonClubSlice';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { FiArrowRight, FiPlus, FiFilter, FiTrash2, FiEdit2, FiHelpCircle } from "react-icons/fi";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useSearchParams } from 'next/navigation';
import { QuestionDialog } from '@/domains/zoon-club/components/QuestionDialog';
import { createZoonQuestion, updateZoonQuestion, deleteZoonQuestion } from '@/domains/zoon-club/store/zoonClubSlice';
import { ZoonQuestion } from '@/domains/zoon-club/services/zoonClubService';

function QuestionsBankContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const initialRoomId = searchParams?.get('roomId') || 'all';
  
  const { questions, rooms, loading } = useAppSelector((state) => state.zoonClub);
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoomId);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ZoonQuestion | null>(null);

  useEffect(() => {
    dispatch(fetchZoonRooms());
    dispatch(fetchZoonQuestions());
  }, [dispatch]);

  // Update selection if URL param changes
  useEffect(() => {
    const roomId = searchParams?.get('roomId');
    if (roomId) setSelectedRoom(roomId);
  }, [searchParams]);

  const handleCreateNew = () => {
    setEditingQuestion(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (question: ZoonQuestion) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      dispatch(deleteZoonQuestion(id));
    }
  };

  const handleDialogSubmit = (values: Partial<ZoonQuestion>) => {
    if (editingQuestion) {
      dispatch(updateZoonQuestion({ id: editingQuestion.id, updates: values }));
    } else {
      dispatch(createZoonQuestion(values));
    }
  };

  const filteredQuestions = selectedRoom === 'all' 
    ? questions 
    : questions.filter(q => q.room_id === selectedRoom);

  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name_ar || 'غرفة غير معروفة';
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, string> = {
      'ENTRY': 'bg-blue-100 text-blue-700',
      'EXIT': 'bg-orange-100 text-orange-700',
      'ENGAGEMENT': 'bg-green-100 text-green-700',
      'FOLLOW_UP': 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      'ENTRY': 'سؤال دخول',
      'EXIT': 'سؤال خروج',
      'ENGAGEMENT': 'سؤال تفاعل',
      'FOLLOW_UP': 'سؤال متابعة',
    };
    return <Badge className={`${variants[category] || 'bg-gray-100'} border-none`}>{labels[category] || category}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/club-zone/rooms/management">
              <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-gray-500">
                <FiArrowRight className="ml-1" /> العودة لإدارة الغرف
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">بنك الأسئلة الذكية</h1>
          <p className="text-gray-500">إدارة الأسئلة الديناميكية (Dynamic Profiling) لكل غرف نادي زوون</p>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateNew}>
          <FiPlus className="ml-2" /> إضافة سؤال جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FiFilter /> تصفية الأسئلة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-64">
              <label className="text-sm text-gray-500 mb-1 block">اختر الغرفة</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الغرف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الغرف</SelectItem>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>{room.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <FiHelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد أسئلة مضافة في هذه الغرفة حالياً.</p>
          </div>
        ) : (
          filteredQuestions.map((question: any) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(question.category)}
                      <Badge variant="outline" className="border-gray-200 text-gray-600 font-normal">
                        📍 {getRoomName(question.room_id)}
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-100">
                        ⭐️ {question.points_reward} نقطة
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {question.question_text_ar}
                    </h3>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {question.options?.map((opt: any, idx: number) => (
                        <span key={idx} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-500">
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-blue-600"
                      onClick={() => handleEdit(question)}
                    >
                      <FiEdit2 />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(question.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <QuestionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleDialogSubmit}
        rooms={rooms}
        initialData={editingQuestion}
        defaultRoomId={selectedRoom !== 'all' ? selectedRoom : undefined}
      />
    </div>
  );
}

export default function QuestionsBankPage() {
  return (
    <DashboardLayout title="بنك الأسئلة الذكية">
      <Suspense fallback={<div className="p-10 text-center">جاري تحميل البيانات...</div>}>
        <QuestionsBankContent />
      </Suspense>
    </DashboardLayout>
  );
}
