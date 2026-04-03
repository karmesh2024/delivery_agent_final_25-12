'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchZoonPosts, updatePostStatus, deleteZoonPost } from '@/domains/zoon-club/store/zoonClubSlice';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { FiCheck, FiX, FiTrash2, FiClock, FiEye } from "react-icons/fi";
import { PostStatus } from '@/domains/zoon-club/services/zoonClubService';
import { toast } from 'react-hot-toast';

export default function ModerationPage() {
  const dispatch = useAppDispatch();
  const { posts, loading } = useAppSelector((state) => state.zoonClub);
  const [filter, setFilter] = useState<PostStatus | 'ALL'>('PENDING');

  useEffect(() => {
    dispatch(fetchZoonPosts());
  }, [dispatch]);

  const handleStatusUpdate = async (id: string, status: PostStatus) => {
    let rejectionNote = '';
    if (status === 'REJECTED') {
      rejectionNote = prompt('يرجى كتابة سبب الرفض (اختياري):') || '';
    }

    try {
      await dispatch(updatePostStatus({ id, status, rejectionNote })).unwrap();
      toast.success(status === 'APPROVED' ? 'تمت الموافقة على المنشور' : 'تم رفض المنشور');
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const filteredPosts = posts.filter(p => filter === 'ALL' || p.status === filter);

  return (
    <DashboardLayout title="رقابة المحتوى - نادي زوون">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مراجعة المنشورات</h1>
            <p className="text-gray-500">إدارة وموافقة المحتوى المقدم من المستخدمين (نظام 2026)</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-md text-sm transition-all ${
                  filter === s ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'PENDING' ? 'قيد الانتظار' : s === 'APPROVED' ? 'تمت الموافقة' : s === 'REJECTED' ? 'مرفوض' : 'الكل'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
              <p className="text-gray-500 text-lg">لا توجد منشورات {filter === 'PENDING' ? 'تنتظر المراجعة' : ''} حالياً</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-r-4" style={{ borderRightColor: post.status === 'PENDING' ? '#eab308' : post.status === 'APPROVED' ? '#22c55e' : '#ef4444' }}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                          {post.zoon_rooms?.icon || '💬'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{post.zoon_rooms?.name_ar || 'غرفة غير معروفة'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <FiClock className="w-3 h-3" /> {new Date(post.created_at).toLocaleString('ar-EG')}
                          </p>
                        </div>
                        <div className="mr-auto">
                          <Badge 
                            variant="outline" 
                            className={
                              post.status === 'PENDING' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              post.status === 'APPROVED' ? "bg-green-50 text-green-700 border-green-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {post.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                      
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {post.media_urls.map((url, i) => (
                            <img key={i} src={url} alt="Post media" className="h-32 w-32 object-cover rounded-lg border" />
                          ))}
                        </div>
                      )}

                      {post.rejection_note && (
                        <div className="bg-red-50 border-r-2 border-red-400 p-3 text-red-700 text-sm mb-4">
                          <strong>سبب الرفض:</strong> {post.rejection_note}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 md:w-48 p-4 flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-r">
                      {post.status === 'PENDING' && (
                        <>
                          <Button 
                            className="bg-green-600 hover:bg-green-700 gap-2 w-full"
                            onClick={() => handleStatusUpdate(post.id, 'APPROVED')}
                          >
                            <FiCheck /> موافقة
                          </Button>
                          <Button 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-2 w-full"
                            onClick={() => handleStatusUpdate(post.id, 'REJECTED')}
                          >
                            <FiX /> رفض
                          </Button>
                        </>
                      )}
                      
                      {post.status !== 'PENDING' && (
                        <Button 
                          variant="outline"
                          className="gap-2 w-full"
                          onClick={() => handleStatusUpdate(post.id, 'PENDING')}
                        >
                          <FiEye /> إعادة مراجعة
                        </Button>
                      )}

                      <Button 
                        variant="ghost"
                        className="text-gray-400 hover:text-red-600 gap-2 w-full"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا المنشور نهائياً؟')) {
                            dispatch(deleteZoonPost(post.id));
                          }
                        }}
                      >
                        <FiTrash2 /> حذف نهائي
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
