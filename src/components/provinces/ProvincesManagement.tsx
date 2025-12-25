'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, MapPin, Building, Users, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Province {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  is_active: boolean;
  created_at: string;
  regions_count?: number;
}

interface Region {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  province_id: string;
  is_active: boolean;
  created_at: string;
  cities_count?: number;
}

interface City {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  region_id: string;
  is_active: boolean;
  created_at: string;
}

interface PermissionRequest {
  id: string;
  requester_name: string;
  permission_name: string;
  scope_type: string;
  scope_name: string;
  reason: string;
  priority: string;
  status: string;
  requested_at: string;
  expires_at?: string;
}

export default function ProvincesManagement() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  
  // Form states
  const [showProvinceDialog, setShowProvinceDialog] = useState(false);
  const [showRegionDialog, setShowRegionDialog] = useState(false);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  
  const [provinceForm, setProvinceForm] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    is_active: true
  });
  
  const [regionForm, setRegionForm] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    province_id: '',
    is_active: true
  });
  
  const [cityForm, setCityForm] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    region_id: '',
    is_active: true
  });
  
  const [permissionForm, setPermissionForm] = useState({
    permission_id: '',
    scope_type: 'province',
    scope_id: '',
    reason: '',
    priority: 'medium',
    expires_at: ''
  });

  // Load data
  useEffect(() => {
    loadProvinces();
    loadPermissionRequests();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadRegions(selectedProvince);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRegion) {
      loadCities(selectedRegion);
    }
  }, [selectedRegion]);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockProvinces: Province[] = [
        {
          id: '1',
          name_ar: 'الرياض',
          name_en: 'Riyadh',
          code: 'RY',
          is_active: true,
          created_at: '2024-01-01',
          regions_count: 15
        },
        {
          id: '2',
          name_ar: 'مكة المكرمة',
          name_en: 'Makkah',
          code: 'MK',
          is_active: true,
          created_at: '2024-01-01',
          regions_count: 12
        }
      ];
      setProvinces(mockProvinces);
    } catch (error) {
      toast.error('خطأ في تحميل المحافظات');
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (provinceId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      const mockRegions: Region[] = [
        {
          id: '1',
          name_ar: 'الرياض',
          name_en: 'Riyadh',
          code: 'RY01',
          province_id: provinceId,
          is_active: true,
          created_at: '2024-01-01',
          cities_count: 8
        }
      ];
      setRegions(mockRegions);
    } catch (error) {
      toast.error('خطأ في تحميل المناطق');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (regionId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      const mockCities: City[] = [
        {
          id: '1',
          name_ar: 'الرياض',
          name_en: 'Riyadh',
          code: 'RY0101',
          region_id: regionId,
          is_active: true,
          created_at: '2024-01-01'
        }
      ];
      setCities(mockCities);
    } catch (error) {
      toast.error('خطأ في تحميل المدن');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionRequests = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockRequests: PermissionRequest[] = [
        {
          id: '1',
          requester_name: 'أحمد محمد',
          permission_name: 'إدارة المخازن',
          scope_type: 'province',
          scope_name: 'الرياض',
          reason: 'مشروع جديد يتطلب إدارة مخازن الرياض',
          priority: 'high',
          status: 'pending',
          requested_at: '2024-01-15',
          expires_at: '2024-02-15'
        }
      ];
      setPermissionRequests(mockRequests);
    } catch (error) {
      toast.error('خطأ في تحميل طلبات الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate API call
      toast.success('تم إنشاء المحافظة بنجاح');
      setShowProvinceDialog(false);
      setProvinceForm({ name_ar: '', name_en: '', code: '', is_active: true });
      loadProvinces();
    } catch (error) {
      toast.error('خطأ في إنشاء المحافظة');
    }
  };

  const handleRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate API call
      toast.success('تم إنشاء المنطقة بنجاح');
      setShowRegionDialog(false);
      setRegionForm({ name_ar: '', name_en: '', code: '', province_id: '', is_active: true });
      if (selectedProvince) loadRegions(selectedProvince);
    } catch (error) {
      toast.error('خطأ في إنشاء المنطقة');
    }
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate API call
      toast.success('تم إنشاء المدينة بنجاح');
      setShowCityDialog(false);
      setCityForm({ name_ar: '', name_en: '', code: '', region_id: '', is_active: true });
      if (selectedRegion) loadCities(selectedRegion);
    } catch (error) {
      toast.error('خطأ في إنشاء المدينة');
    }
  };

  const handlePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate API call
      toast.success('تم إرسال طلب الصلاحية بنجاح');
      setShowPermissionDialog(false);
      setPermissionForm({ permission_id: '', scope_type: 'province', scope_id: '', reason: '', priority: 'medium', expires_at: '' });
      loadPermissionRequests();
    } catch (error) {
      toast.error('خطأ في إرسال طلب الصلاحية');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'expired': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المحافظات والصلاحيات</h1>
          <p className="text-muted-foreground">إدارة المحافظات والمناطق والمدن والصلاحيات المؤقتة</p>
        </div>
      </div>

      <Tabs defaultValue="provinces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="provinces">المحافظات</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات المؤقتة</TabsTrigger>
          <TabsTrigger value="requests">طلبات الصلاحيات</TabsTrigger>
        </TabsList>

        <TabsContent value="provinces" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* المحافظات */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المحافظات</CardTitle>
                <Dialog open={showProvinceDialog} onOpenChange={setShowProvinceDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة محافظة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة محافظة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل المحافظة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProvinceSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية</Label>
                        <Input
                          id="name_ar"
                          value={provinceForm.name_ar}
                          onChange={(e) => setProvinceForm({...provinceForm, name_ar: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                        <Input
                          id="name_en"
                          value={provinceForm.name_en}
                          onChange={(e) => setProvinceForm({...provinceForm, name_en: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="code">الكود</Label>
                        <Input
                          id="code"
                          value={provinceForm.code}
                          onChange={(e) => setProvinceForm({...provinceForm, code: e.target.value})}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={provinceForm.is_active}
                          onChange={(e) => setProvinceForm({...provinceForm, is_active: e.target.checked})}
                        />
                        <Label htmlFor="is_active">نشط</Label>
                      </div>
                      <Button type="submit" className="w-full">إنشاء المحافظة</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {provinces.map((province) => (
                    <div
                      key={province.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProvince(province.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{province.name_ar}</p>
                          <p className="text-sm text-muted-foreground">{province.code}</p>
                        </div>
                      </div>
                      <Badge variant={province.is_active ? "default" : "secondary"}>
                        {province.regions_count} منطقة
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* المناطق */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المناطق</CardTitle>
                <Dialog open={showRegionDialog} onOpenChange={setShowRegionDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedProvince}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة منطقة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة منطقة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل المنطقة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegionSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="region_name_ar">الاسم بالعربية</Label>
                        <Input
                          id="region_name_ar"
                          value={regionForm.name_ar}
                          onChange={(e) => setRegionForm({...regionForm, name_ar: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="region_name_en">الاسم بالإنجليزية</Label>
                        <Input
                          id="region_name_en"
                          value={regionForm.name_en}
                          onChange={(e) => setRegionForm({...regionForm, name_en: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="region_code">الكود</Label>
                        <Input
                          id="region_code"
                          value={regionForm.code}
                          onChange={(e) => setRegionForm({...regionForm, code: e.target.value})}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="region_is_active"
                          checked={regionForm.is_active}
                          onChange={(e) => setRegionForm({...regionForm, is_active: e.target.checked})}
                        />
                        <Label htmlFor="region_is_active">نشط</Label>
                      </div>
                      <Button type="submit" className="w-full">إنشاء المنطقة</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{region.name_ar}</p>
                          <p className="text-sm text-muted-foreground">{region.code}</p>
                        </div>
                      </div>
                      <Badge variant={region.is_active ? "default" : "secondary"}>
                        {region.cities_count} مدينة
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* المدن */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المدن</CardTitle>
                <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedRegion}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مدينة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مدينة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل المدينة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCitySubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="city_name_ar">الاسم بالعربية</Label>
                        <Input
                          id="city_name_ar"
                          value={cityForm.name_ar}
                          onChange={(e) => setCityForm({...cityForm, name_ar: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="city_name_en">الاسم بالإنجليزية</Label>
                        <Input
                          id="city_name_en"
                          value={cityForm.name_en}
                          onChange={(e) => setCityForm({...cityForm, name_en: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city_code">الكود</Label>
                        <Input
                          id="city_code"
                          value={cityForm.code}
                          onChange={(e) => setCityForm({...cityForm, code: e.target.value})}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="city_is_active"
                          checked={cityForm.is_active}
                          onChange={(e) => setCityForm({...cityForm, is_active: e.target.checked})}
                        />
                        <Label htmlFor="city_is_active">نشط</Label>
                      </div>
                      <Button type="submit" className="w-full">إنشاء المدينة</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cities.map((city) => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{city.name_ar}</p>
                          <p className="text-sm text-muted-foreground">{city.code}</p>
                        </div>
                      </div>
                      <Badge variant={city.is_active ? "default" : "secondary"}>
                        نشط
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات المؤقتة</CardTitle>
              <CardDescription>
                إدارة الصلاحيات المؤقتة للمديرين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد صلاحيات مؤقتة</h3>
                <p className="text-muted-foreground mb-4">
                  لم يتم منح أي صلاحيات مؤقتة حالياً
                </p>
                <Button onClick={() => setShowPermissionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  منح صلاحية مؤقتة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الصلاحيات</CardTitle>
              <CardDescription>
                مراجعة وموافقة على طلبات الصلاحيات المؤقتة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissionRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{request.requester_name}</h4>
                          <Badge variant={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge variant={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>الصلاحية:</strong> {request.permission_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>النطاق:</strong> {request.scope_name} ({request.scope_type})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>السبب:</strong> {request.reason}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>تاريخ الطلب:</strong> {new Date(request.requested_at).toLocaleDateString('ar-SA')}
                        </p>
                        {request.expires_at && (
                          <p className="text-sm text-muted-foreground">
                            <strong>ينتهي في:</strong> {new Date(request.expires_at).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button size="sm" variant="default">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              موافقة
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog لطلب الصلاحيات */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب صلاحية مؤقتة</DialogTitle>
            <DialogDescription>
              أرسل طلب للحصول على صلاحية مؤقتة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePermissionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="permission_id">الصلاحية</Label>
              <Select value={permissionForm.permission_id} onValueChange={(value) => setPermissionForm({...permissionForm, permission_id: value})}>
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
            <div>
              <Label htmlFor="scope_type">نوع النطاق</Label>
              <Select value={permissionForm.scope_type} onValueChange={(value) => setPermissionForm({...permissionForm, scope_type: value})}>
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
              <Select value={permissionForm.scope_id} onValueChange={(value) => setPermissionForm({...permissionForm, scope_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النطاق" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">السبب</Label>
              <Textarea
                id="reason"
                value={permissionForm.reason}
                onChange={(e) => setPermissionForm({...permissionForm, reason: e.target.value})}
                placeholder="اشرح سبب الحاجة لهذه الصلاحية"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">الأولوية</Label>
              <Select value={permissionForm.priority} onValueChange={(value) => setPermissionForm({...permissionForm, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expires_at">تاريخ الانتهاء</Label>
              <Input
                id="expires_at"
                type="date"
                value={permissionForm.expires_at}
                onChange={(e) => setPermissionForm({...permissionForm, expires_at: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full">إرسال الطلب</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

