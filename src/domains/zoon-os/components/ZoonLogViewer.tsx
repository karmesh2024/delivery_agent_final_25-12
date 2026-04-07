'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiSearch, FiList } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface ToolLog {
  id: string;
  tool_name: string;
  status: 'success' | 'error';
  duration_ms: number;
  attempts: number;
  error_type: string | null;
  error_detail: string | null;
  created_at: string;
}

export default function ZoonLogViewer() {
  const [logs, setLogs] = useState<ToolLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = `/api/zoon/logs?limit=100${filter !== 'all' ? `&status=${filter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLogs(data);
      } else if (!Array.isArray(data)) {
        console.error('Expected logs array but got:', data);
        setLogs([]);
      }
    } catch (error) {
       console.error('Fetch logs error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <FiList className="text-slate-600" />
            سجلات التنفيذ (Execution Logs)
          </h3>
          <p className="text-slate-500 text-xs mt-1">مراقبة أداء الوكيل والأدوات البرمجية واكتشاف الأخطاء</p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <Button 
            variant={filter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all')}
            className="text-[10px] px-4"
          >الكل</Button>
          <Button 
            variant={filter === 'success' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('success')}
            className="text-[10px] px-4 text-emerald-600"
          >ناجح</Button>
          <Button 
            variant={filter === 'error' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('error')}
            className="text-[10px] px-4 text-red-600"
          >فشل</Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50 font-black">
            <TableRow>
              <TableHead className="text-right">الأداة / المهمة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الوقت (ms)</TableHead>
              <TableHead className="text-right">المحاولات</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">تفاصيل الخطأ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">لا توجد سجلات حالياً</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="font-bold text-slate-700">{log.tool_name}</TableCell>
                <TableCell>
                  {log.status === 'success' ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 hover:bg-emerald-50 shadow-none">
                      <FiCheckCircle size={10} /> ناجح
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 px-2 uppercase text-[9px]">
                      <FiAlertTriangle size={10} /> {log.error_type || 'فشل'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">{log.duration_ms}ms</TableCell>
                <TableCell className="text-slate-400 text-xs">{log.attempts}</TableCell>
                <TableCell className="text-slate-500 text-[10px]">
                   <span className="flex items-center gap-1"><FiClock size={10} /> {new Date(log.created_at).toLocaleString('ar-EG')}</span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-slate-400 text-[10px]" dir="ltr">
                  {log.error_detail || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-between items-center text-[10px] text-slate-400">
        <p>يتم عرض آخر 100 عملية تنفيذ فقط لتوفير الأداء.</p>
        <Button variant="ghost" size="sm" onClick={fetchLogs} className="gap-1 hover:bg-slate-50">
          <FiSearch size={12} /> تحديث البيانات
        </Button>
      </div>
    </div>
  );
}
