'use client';

import { useState, useEffect } from 'react';
import { auditService, AuditLog } from '@/services/auditService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

type FilterType = 'all' | 'success' | 'failed' | 'partial' | 'pending';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState<{
    total: number;
    success: number;
    failed: number;
    partial: number;
    pending: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let data: AuditLog[];
      if (filter === 'failed') {
        data = await auditService.getFailedOperations(100);
      } else {
        data = await auditService.getRecentLogs(100);
        if (filter !== 'all') {
          data = data.filter(log => log.sync_status === filter);
        }
      }
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await auditService.getSyncStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      success: { 
        className: 'bg-green-100 text-green-700 border-green-300', 
        label: 'نجحت',
        icon: <FiCheckCircle className="w-3 h-3 mr-1" />
      },
      failed: { 
        className: 'bg-red-100 text-red-700 border-red-300', 
        label: 'فشلت',
        icon: <FiXCircle className="w-3 h-3 mr-1" />
      },
      partial: { 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300', 
        label: 'جزئية',
        icon: <FiAlertCircle className="w-3 h-3 mr-1" />
      },
      pending: { 
        className: 'bg-gray-100 text-gray-700 border-gray-300', 
        label: 'قيد الانتظار',
        icon: <FiClock className="w-3 h-3 mr-1" />
      },
      in_progress: { 
        className: 'bg-blue-100 text-blue-700 border-blue-300', 
        label: 'قيد التنفيذ',
        icon: <FiRefreshCw className="w-3 h-3 mr-1 animate-spin" />
      }
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.className} border flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">سجل العمليات والمزامنة</h1>
          <p className="text-gray-600 mt-2">
            تتبع جميع عمليات المزامنة والتعديلات في النظام
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" className="flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي العمليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                ناجحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats.success}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                فاشلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {stats.failed}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                جزئية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {stats.partial}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                قيد الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الفلاتر */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'success', 'failed', 'partial', 'pending'] as FilterType[]).map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
          >
            {f === 'all' ? 'الكل' : 
             f === 'success' ? 'الناجحة' :
             f === 'failed' ? 'الفاشلة' :
             f === 'partial' ? 'الجزئية' : 'قيد الانتظار'}
          </Button>
        ))}
      </div>

      {/* الجدول */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">جاري التحميل...</div>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              لا توجد عمليات مسجلة
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">العملية</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المدة</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type}</TableCell>
                      <TableCell className="text-sm">{log.operation}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.entity_name || log.entity_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.sync_status)}</TableCell>
                      <TableCell className="text-sm">
                        {log.execution_time_ms 
                          ? `${log.execution_time_ms}ms`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_email || log.user_id?.slice(0, 8) + '...' || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {log.error_message && (
                            <details className="text-red-600 cursor-pointer">
                              <summary className="text-sm hover:underline">خطأ</summary>
                              <div className="mt-2 text-xs bg-red-50 p-2 rounded border border-red-200">
                                <div className="font-medium mb-1">{log.error_message}</div>
                                {log.error_stack && (
                                  <pre className="mt-2 text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                                    {log.error_stack}
                                  </pre>
                                )}
                              </div>
                            </details>
                          )}
                          {log.target_tables && log.target_tables.length > 0 && (
                            <div className="text-xs text-gray-500">
                              الجداول: {log.target_tables.join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
