'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, XCircle, Clock, AlertTriangle, Info, Mail, MessageSquare } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  data?: any;
  related_entity_type?: string;
  related_entity_id?: string;
}

interface AdvancedNotificationsProps {
  userId?: string;
}

export default function AdvancedNotifications({ userId }: AdvancedNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'permission_request',
          title: 'طلب صلاحية جديد',
          message: 'أحمد محمد يطلب صلاحية إدارة المخازن لمحافظة الرياض',
          priority: 'high',
          is_read: false,
          created_at: '2024-01-15T10:30:00Z',
          data: {
            requester_name: 'أحمد محمد',
            permission_name: 'إدارة المخازن',
            scope_name: 'الرياض'
          },
          related_entity_type: 'permission_request',
          related_entity_id: 'req_1'
        },
        {
          id: '2',
          type: 'approval_needed',
          title: 'موافقة مطلوبة',
          message: 'لديك طلب موافقة جديد يتطلب مراجعتك',
          priority: 'medium',
          is_read: false,
          created_at: '2024-01-15T09:15:00Z',
          data: {
            request_id: 'req_2',
            requester_name: 'فاطمة أحمد'
          },
          related_entity_type: 'approval',
          related_entity_id: 'app_1'
        },
        {
          id: '3',
          type: 'permission_granted',
          title: 'تم منح الصلاحية',
          message: 'تم منحك صلاحية إدارة الموردين بنجاح',
          priority: 'low',
          is_read: true,
          created_at: '2024-01-14T16:45:00Z',
          data: {
            permission_name: 'إدارة الموردين',
            scope_name: 'منطقة الرياض'
          }
        },
        {
          id: '4',
          type: 'permission_expired',
          title: 'انتهت صلاحية مؤقتة',
          message: 'انتهت صلاحية إدارة المخازن المؤقتة',
          priority: 'medium',
          is_read: false,
          created_at: '2024-01-14T08:00:00Z',
          data: {
            permission_name: 'إدارة المخازن',
            admin_name: 'محمد علي'
          }
        },
        {
          id: '5',
          type: 'approval_approved',
          title: 'تمت الموافقة على الطلب',
          message: 'تمت الموافقة على طلبك للحصول على صلاحية إدارة التسعير',
          priority: 'low',
          is_read: true,
          created_at: '2024-01-13T14:20:00Z',
          data: {
            permission_name: 'إدارة التسعير',
            approver_name: 'سعد الدين'
          }
        },
        {
          id: '6',
          type: 'approval_rejected',
          title: 'تم رفض الطلب',
          message: 'تم رفض طلبك للحصول على صلاحية إدارة الموردين',
          priority: 'medium',
          is_read: false,
          created_at: '2024-01-13T11:30:00Z',
          data: {
            permission_name: 'إدارة الموردين',
            reason: 'لا توجد حاجة لهذه الصلاحية حالياً'
          }
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      toast.error('خطأ في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Simulate API call
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('تم تمييز الإشعار كمقروء');
    } catch (error) {
      toast.error('خطأ في تحديث الإشعار');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Simulate API call
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('تم تمييز جميع الإشعارات كمقروءة');
    } catch (error) {
      toast.error('خطأ في تحديث الإشعارات');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Simulate API call
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
      toast.success('تم حذف الإشعار');
    } catch (error) {
      toast.error('خطأ في حذف الإشعار');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'permission_request': return <Bell className="h-5 w-5 text-blue-500" />;
      case 'approval_needed': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'permission_granted': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'permission_expired': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'approval_approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'approval_rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'permission_request': return 'طلب صلاحية';
      case 'approval_needed': return 'موافقة مطلوبة';
      case 'permission_granted': return 'تم منح الصلاحية';
      case 'permission_expired': return 'انتهت الصلاحية';
      case 'approval_approved': return 'تمت الموافقة';
      case 'approval_rejected': return 'تم الرفض';
      default: return type;
    }
  };

  const filteredNotifications = (type?: string) => {
    if (!type) return notifications;
    return notifications.filter(n => n.type === type);
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الإشعارات</h2>
          <p className="text-muted-foreground">إدارة الإشعارات والتنبيهات</p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <Bell className="h-3 w-3" />
              <span>{unreadCount}</span>
            </Badge>
          )}
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            تمييز الكل كمقروء
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">الكل ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">غير مقروءة ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">مقروءة ({readNotifications.length})</TabsTrigger>
          <TabsTrigger value="permission_requests">طلبات الصلاحيات</TabsTrigger>
          <TabsTrigger value="approvals">الموافقات</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`hover:shadow-md transition-shadow ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <Badge variant={getPriorityColor(notification.priority)} size="sm">
                              {getPriorityText(notification.priority)}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {getTypeText(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <div className="space-y-4">
            {unreadNotifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <Badge variant={getPriorityColor(notification.priority)} size="sm">
                              {getPriorityText(notification.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <div className="space-y-4">
            {readNotifications.map((notification) => (
              <Card key={notification.id} className="opacity-75 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={getPriorityColor(notification.priority)} size="sm">
                              {getPriorityText(notification.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permission_requests" className="space-y-4">
          <div className="space-y-4">
            {filteredNotifications('permission_request').map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Bell className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="space-y-4">
            {filteredNotifications('approval_needed').concat(filteredNotifications('approval_approved')).concat(filteredNotifications('approval_rejected')).map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
