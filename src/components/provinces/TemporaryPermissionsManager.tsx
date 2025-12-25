'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Shield, Clock, AlertTriangle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface TemporaryPermission {
  id: string;
  admin_name: string;
  admin_email: string;
  permission_name: string;
  scope_type: string;
  scope_name: string;
  granted_by_name: string;
  granted_at: string;
  expires_at: string;
  is_active: boolean;
  reason: string;
  days_remaining: number;
}

interface TemporaryPermissionsManagerProps {
  onRefresh?: () => void;
}

export default function TemporaryPermissionsManager({ onRefresh }: TemporaryPermissionsManagerProps) {
  const [permissions, setPermissions] = useState<TemporaryPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<TemporaryPermission | null>(null);
  
  const [grantForm, setGrantForm] = useState({
    admin_id: '',
    permission_id: '',
    scope_type: 'province',
    scope_id: '',
    reason: '',
    expires_at: '',
    duration_days: 30
  });

  const [editForm, setEditForm] = useState({
    expires_at: '',
    reason: '',
    is_active: true
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockPermissions: TemporaryPermission[] = [
        {
          id: '1',
          admin_name: 'أحمد محمد',
          admin_email: 'ahmed@example.com',
          permission_name: 'إدارة المخازن',
          scope_type: 'province',
          scope_name: 'الرياض',
          granted_by_name: 'محمد علي',
          granted_at: '2024-01-15',
          expires_at: '2024-02-15',
          is_active: true,
          reason: 'مشروع جديد يتطلب إدارة مخازن الرياض',
          days_remaining: 15
        },
        {
          id: '2',
          admin_name: 'فاطمة أحمد',
          admin_email: 'fatima@example.com',
          permission_name: 'إدارة الموردين',
          scope_type: 'region',
          scope_name: 'منطقة الرياض',
          granted_by_name: 'سعد الدين',
          granted_at: '2024-01-10',
          expires_at: '2024-01-25',
          is_active: true,
          reason: 'إدارة موردين المنطقة الجديدة',
          days_remaining: 3
        }
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      toast.error('خطأ في تحميل الصلاحيات المؤقتة');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate API call
      toast.success('تم منح الصلاحية المؤقتة بنجاح');
      setShowGrantDialog(false);
      setGrantForm({
        admin_id: '',
        permission_id: '',
        scope_type: 'province',
        scope_id: '',
        reason: '',
        expires_at: '',
        duration_days: 30
      });
      loadPermissions();
      onRefresh?.();
    } catch (error) {
      toast.error('خطأ في منح الصلاحية');
    }
  };

  const handleEditPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermission) return;
    
    try {
      // Simulate API call
      toast.success('تم تحديث الصلاحية بنجاح');
      setShowEditDialog(false);
      setSelectedPermission(null);
      loadPermissions();
      onRefresh?.();
    } catch (error) {
      toast.error('خطأ في تحديث الصلاحية');
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    try {
      // Simulate API call
      toast.success('تم إلغاء الصلاحية بنجاح');
      loadPermissions();
      onRefresh?.();
    } catch (error) {
      toast.error('خطأ في إلغاء الصلاحية');
    }
  };

  const openEditDialog = (permission: TemporaryPermission) => {
    setSelectedPermission(permission);
    setEditForm({
      expires_at: permission.expires_at,
      reason: permission.reason,
      is_active: permission.is_active
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (permission: TemporaryPermission) => {
    if (!permission.is_active) return 'secondary';
    if (permission.days_remaining <= 0) return 'destructive';
    if (permission.days_remaining <= 3) return 'destructive';
    if (permission.days_remaining <= 7) return 'default';
    return 'default';
  };

  const getStatusText = (permission: TemporaryPermission) => {
    if (!permission.is_active) return 'غير نشط';
    if (permission.days_remaining <= 0) return 'منتهية الصلاحية';
    if (permission.days_remaining <= 3) return 'تنتهي قريباً';
    if (permission.days_remaining <= 7) return 'تنتهي خلال أسبوع';
    return 'نشط';
  };

  const getStatusIcon = (permission: TemporaryPermission) => {
    if (!permission.is_active) return <XCircle className="h-4 w-4 text-gray-500" />;
    if (permission.days_remaining <= 0) return <XCircle className="h-4 w-4 text-red-500" />;
    if (permission.days_remaining <= 3) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (permission.days_remaining <= 7) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getScopeTypeText = (scopeType: string) => {
    switch (scopeType) {
      case 'province': return 'محافظة';
      case 'region': return 'منطقة';
      case 'city': return 'مدينة';
      case 'warehouse': return 'مخزن';
      case 'global': return 'عام';
      default: return scopeType;
    }
  };

  const calculateExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الصلاحيات المؤقتة</h2>
          <p className="text-muted-foreground">إدارة الصلاحيات المؤقتة الممنوحة للمديرين</p>
        </div>
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              منح صلاحية مؤقتة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>منح صلاحية مؤقتة</DialogTitle>
              <DialogDescription>
                منح صلاحية مؤقتة لمدير معين
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGrantPermission} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admin_id">المدير</Label>
                  <Select value={grantForm.admin_id} onValueChange={(value) => setGrantForm({...grantForm, admin_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin1">أحمد محمد</SelectItem>
                      <SelectItem value="admin2">فاطمة أحمد</SelectItem>
                      <SelectItem value="admin3">محمد علي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permission_id">الصلاحية</Label>
                  <Select value={grantForm.permission_id} onValueChange={(value) => setGrantForm({...grantForm, permission_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصلاحية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouses:manage">إدارة المخازن</SelectItem>
                      <SelectItem value="inventory:manage">إدارة المخزون</SelectItem>
                      <SelectItem value="suppliers:manage">إدارة الموردين</SelectItem>
                      <SelectItem value="pricing:manage">إدارة التسعير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scope_type">نوع النطاق</Label>
                  <Select value={grantForm.scope_type} onValueChange={(value) => setGrantForm({...grantForm, scope_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="province">محافظة</SelectItem>
                      <SelectItem value="region">منطقة</SelectItem>
                      <SelectItem value="city">مدينة</SelectItem>
                      <SelectItem value="warehouse">مخزن</SelectItem>
                      <SelectItem value="global">عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scope_id">النطاق</Label>
                  <Select value={grantForm.scope_id} onValueChange={(value) => setGrantForm({...grantForm, scope_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النطاق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="province1">الرياض</SelectItem>
                      <SelectItem value="province2">مكة المكرمة</SelectItem>
                      <SelectItem value="region1">منطقة الرياض</SelectItem>
                      <SelectItem value="warehouse1">مخزن الرياض الرئيسي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">السبب</Label>
                <Textarea
                  id="reason"
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({...grantForm, reason: e.target.value})}
                  placeholder="اشرح سبب منح هذه الصلاحية..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_days">مدة الصلاحية (أيام)</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    max="365"
                    value={grantForm.duration_days}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      setGrantForm({
                        ...grantForm, 
                        duration_days: days,
                        expires_at: calculateExpiryDate(days)
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">تاريخ الانتهاء</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={grantForm.expires_at}
                    onChange={(e) => setGrantForm({...grantForm, expires_at: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowGrantDialog(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  <Shield className="h-4 w-4 mr-2" />
                  منح الصلاحية
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {permissions.map((permission) => (
          <Card key={permission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-lg">{permission.admin_name}</h4>
                    <Badge variant={getStatusColor(permission)} className="flex items-center space-x-1">
                      {getStatusIcon(permission)}
                      <span>{getStatusText(permission)}</span>
                    </Badge>
                    {permission.days_remaining > 0 && permission.is_active && (
                      <Badge variant="outline">
                        {permission.days_remaining} يوم متبقي
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">الصلاحية</p>
                      <p className="font-medium">{permission.permission_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">النطاق</p>
                      <p className="font-medium">
                        {permission.scope_name} ({getScopeTypeText(permission.scope_type)})
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">منحها</p>
                      <p className="font-medium">{permission.granted_by_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ المنح</p>
                      <p className="font-medium">
                        {new Date(permission.granted_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ الانتهاء</p>
                      <p className="font-medium">
                        {new Date(permission.expires_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{permission.admin_email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">السبب</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{permission.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(permission)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokePermission(permission.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog تعديل الصلاحية */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الصلاحية المؤقتة</DialogTitle>
            <DialogDescription>
              تعديل تفاصيل الصلاحية المؤقتة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPermission} className="space-y-4">
            {selectedPermission && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل الصلاحية</h4>
                <p><strong>المدير:</strong> {selectedPermission.admin_name}</p>
                <p><strong>الصلاحية:</strong> {selectedPermission.permission_name}</p>
                <p><strong>النطاق:</strong> {selectedPermission.scope_name}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="edit_expires_at">تاريخ الانتهاء</Label>
              <Input
                id="edit_expires_at"
                type="date"
                value={editForm.expires_at}
                onChange={(e) => setEditForm({...editForm, expires_at: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_reason">السبب</Label>
              <Textarea
                id="edit_reason"
                value={editForm.reason}
                onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                placeholder="اشرح سبب تعديل هذه الصلاحية..."
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
              />
              <Label htmlFor="edit_is_active">نشط</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                <Edit className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
