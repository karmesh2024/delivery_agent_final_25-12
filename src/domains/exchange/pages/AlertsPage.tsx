'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Bell, CheckCircle, FilterX, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Interfaz temporal para las alertas hasta que se implemente el slice
interface SystemAlert {
  id: string;
  alert_type: 'stock_low' | 'supplier_offer' | 'price_change' | 'demand_high' | 'supply_low' | 'warehouse_capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  warehouse_id?: string;
  supplier_id?: string;
  category_id?: string;
  subcategory_id?: string;
  product_id?: string;
  is_read: boolean;
  created_at: string;
  resolved_at?: string;
}

const AlertsPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  
  // Datos de muestra para el prototipo
  useEffect(() => {
    // En un futuro será: dispatch(fetchAlerts())
    setTimeout(() => {
      setAlerts([
        {
          id: '1',
          alert_type: 'stock_low',
          severity: 'high',
          message: 'مخزون البلاستيك PET منخفض جداً (تحت 50 كجم)',
          product_id: 'pet-123',
          is_read: false,
          created_at: '2023-10-10T10:00:00',
        },
        {
          id: '2',
          alert_type: 'supplier_offer',
          severity: 'medium',
          message: 'عرض سعر جديد من مصنع الإسكندرية (10 جنيه/كجم للكرتون)',
          supplier_id: 'sup-456',
          is_read: true,
          created_at: '2023-10-09T14:30:00',
        },
        {
          id: '3',
          alert_type: 'price_change',
          severity: 'critical',
          message: 'تغير السعر بنسبة 15% للألومنيوم (من 25 إلى 28.75 جنيه)',
          product_id: 'al-789',
          is_read: false,
          created_at: '2023-10-09T09:15:00',
        },
        {
          id: '4',
          alert_type: 'warehouse_capacity',
          severity: 'low',
          message: 'مخزن المعادى وصل إلى 85% من السعة القصوى',
          warehouse_id: 'wh-012',
          is_read: true,
          created_at: '2023-10-08T16:45:00',
          resolved_at: '2023-10-09T11:30:00',
        },
        {
          id: '5',
          alert_type: 'demand_high',
          severity: 'medium',
          message: 'زيادة الطلب على الزجاج الشفاف بنسبة 30% هذا الأسبوع',
          product_id: 'gl-345',
          is_read: false,
          created_at: '2023-10-07T13:20:00',
        }
      ] as SystemAlert[]);
      
      setLoading(false);
    }, 1000);
  }, [dispatch]);

  // عند النقر على التنبيه للتعليم كمقروء
  const handleMarkAsRead = (id: string) => {
    // في المستقبل سيكون: dispatch(markAlertAsRead(id))
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, is_read: true } : alert
    ));
  };

  // عند النقر على التنبيه للتعليم كمحلول
  const handleResolveAlert = (id: string) => {
    // في المستقبل سيكون: dispatch(resolveAlert(id))
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, resolved_at: new Date().toISOString() } : alert
    ));
  };

  // تصفية التنبيهات حسب النوع
  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && alert.resolved_at) return false;
    if (filter === 'all') return true;
    return alert.alert_type === filter;
  });

  // الحصول على لون التنبيه حسب الخطورة
  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ترجمة نوع التنبيه
  const translateAlertType = (type: SystemAlert['alert_type']) => {
    switch (type) {
      case 'stock_low':
        return 'مخزون منخفض';
      case 'supplier_offer':
        return 'عرض مورّد جديد';
      case 'price_change':
        return 'تغيير في السعر';
      case 'demand_high':
        return 'طلب مرتفع';
      case 'supply_low':
        return 'عرض منخفض';
      case 'warehouse_capacity':
        return 'سعة المخزن';
      default:
        return type;
    }
  };

  // ترجمة مستوى الخطورة
  const translateSeverity = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'low':
        return 'منخفضة';
      case 'medium':
        return 'متوسطة';
      case 'high':
        return 'عالية';
      case 'critical':
        return 'حرجة';
      default:
        return severity;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Bell className="ml-2" />
          التنبيهات والإشعارات
        </h1>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            الكل
          </Button>
          <Button
            variant={filter === 'stock_low' ? 'default' : 'outline'}
            onClick={() => setFilter('stock_low')}
            size="sm"
          >
            المخزون
          </Button>
          <Button
            variant={filter === 'price_change' ? 'default' : 'outline'}
            onClick={() => setFilter('price_change')}
            size="sm"
          >
            الأسعار
          </Button>
          <Button
            variant={filter === 'supplier_offer' ? 'default' : 'outline'}
            onClick={() => setFilter('supplier_offer')}
            size="sm"
          >
            العروض
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowResolved(!showResolved)}
            size="sm"
            className={showResolved ? 'bg-gray-100' : ''}
          >
            {showResolved ? <FilterX className="ml-1" size={16} /> : <CheckCircle className="ml-1" size={16} />}
            {showResolved ? 'إخفاء المحلولة' : 'عرض المحلولة'}
          </Button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">لا توجد تنبيهات بالمعايير المحددة</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="w-[120px]">النوع</TableHead>
                  <TableHead className="w-[120px]">الخطورة</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead className="w-[180px]">التاريخ</TableHead>
                  <TableHead className="w-[100px]">الحالة</TableHead>
                  <TableHead className="text-left w-[180px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert, index) => (
                  <TableRow 
                    key={alert.id}
                    className={alert.is_read ? '' : 'bg-blue-50'}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {translateAlertType(alert.alert_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getSeverityColor(alert.severity)}`}
                      >
                        {translateSeverity(alert.severity)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alert.message}
                    </TableCell>
                    <TableCell>
                      {format(new Date(alert.created_at), 'PPp', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {alert.resolved_at ? (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          تم الحل
                        </Badge>
                      ) : alert.is_read ? (
                        <Badge variant="outline" className="bg-gray-50 border-gray-200">
                          مقروء
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          جديد
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2 rtl:space-x-reverse">
                      {!alert.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(alert.id)}
                        >
                          تعليم كمقروء
                        </Button>
                      )}
                      {!alert.resolved_at && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          حل
                        </Button>
                      )}
                      {alert.alert_type === 'supplier_offer' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push('/dashboard/suppliers/offers')}
                        >
                          عرض التفاصيل
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlertsPage; 