"use client";

/**
 * مكون لوحة إعدادات الإشعارات في الإعدادات
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FiMail, FiBell, FiPhone, FiSave, FiAlertCircle } from "react-icons/fi";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { toast } from "sonner";
import { updateUserNotificationSettings, updateUserQuietHours } from "../store/settingsSlice";
import { NotificationSettings } from "../types";

/**
 * مكون لوحة إعدادات الإشعارات
 * يتيح تخصيص كيفية ومتى يتلقى المستخدم الإشعارات
 */
export const NotificationsPanel = () => {
  // الوصول إلى حالة الإعدادات من Redux
  const dispatch = useDispatch<AppDispatch>();
  const { userData, isSaving, error, quietHoursStart, quietHoursEnd } = useSelector((state: RootState) => state.settings);
  
  // حالة إعدادات الإشعارات المحلية
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    agentUpdates: true,
    orderStatusChanges: true,
    systemAnnouncements: true,
    marketingMessages: false
  });
  
  // حالة الساعات الهادئة المحلية
  const [quietHours, setQuietHours] = useState({
    start: "22:00",
    end: "07:00"
  });

  // تحديث الحالة المحلية عند تغير بيانات المستخدم
  useEffect(() => {
    if (userData.notificationSettings) {
      setNotificationSettings(userData.notificationSettings);
    }
    
    setQuietHours({
      start: quietHoursStart,
      end: quietHoursEnd
    });
  }, [userData.notificationSettings, quietHoursStart, quietHoursEnd]);

  // معالجة تغيير إعدادات القنوات
  const handleChannelChange = (channel: keyof Pick<NotificationSettings, 'email' | 'push' | 'sms'>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  // معالجة تغيير أنواع الإشعارات
  const handleTypeChange = (type: keyof Omit<NotificationSettings, 'email' | 'push' | 'sms'>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // معالجة تغيير وقت الساعات الهادئة
  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setQuietHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ إعدادات الإشعارات
  const handleSaveNotifications = async () => {
    try {
      await dispatch(updateUserNotificationSettings({
        userId: userData.id,
        settings: notificationSettings
      })).unwrap();
      
      toast.success('تم تحديث إعدادات الإشعارات بنجاح');
    } catch (error) {
      toast.error('فشل تحديث إعدادات الإشعارات');
      console.error('Error updating notification settings:', error);
    }
  };

  // حفظ إعدادات الساعات الهادئة
  const handleSaveQuietHours = async () => {
    try {
      await dispatch(updateUserQuietHours({
        userId: userData.id,
        startTime: quietHours.start,
        endTime: quietHours.end
      })).unwrap();
      
      toast.success('تم تحديث إعدادات الساعات الهادئة بنجاح');
    } catch (error) {
      toast.error('فشل تحديث إعدادات الساعات الهادئة');
      console.error('Error updating quiet hours:', error);
    }
  };

  // إعادة التعيين إلى الإعدادات الافتراضية
  const handleResetNotifications = () => {
    setNotificationSettings({
      email: true,
      push: true,
      sms: false,
      agentUpdates: true,
      orderStatusChanges: true,
      systemAnnouncements: true,
      marketingMessages: false
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <FiAlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* قنوات الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle>قنوات الإشعارات</CardTitle>
          <CardDescription>
            تكوين كيفية تلقي الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FiMail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-sm text-gray-500">تلقي رسائل بريد إلكتروني للتحديثات المهمة</p>
                </div>
              </div>
              <Switch 
                checked={notificationSettings.email} 
                onCheckedChange={() => handleChannelChange('email')}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FiBell className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">إشعارات الدفع</p>
                  <p className="text-sm text-gray-500">الحصول على تنبيهات على سطح المكتب أو الجوال</p>
                </div>
              </div>
              <Switch 
                checked={notificationSettings.push} 
                onCheckedChange={() => handleChannelChange('push')}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FiPhone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">إشعارات الرسائل القصيرة</p>
                  <p className="text-sm text-gray-500">الحصول على رسائل نصية للتنبيهات الهامة</p>
                </div>
              </div>
              <Switch 
                checked={notificationSettings.sms} 
                onCheckedChange={() => handleChannelChange('sms')}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* أنواع الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle>أنواع الإشعارات</CardTitle>
          <CardDescription>
            اختر أنواع الإشعارات التي ترغب في تلقيها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تحديثات المندوبين</p>
              <p className="text-sm text-gray-500">تغييرات الحالة، تحديثات الموقع، إلخ.</p>
            </div>
            <Switch 
              checked={notificationSettings.agentUpdates} 
              onCheckedChange={() => handleTypeChange('agentUpdates')}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تغييرات حالة الطلب</p>
              <p className="text-sm text-gray-500">عند إنشاء الطلبات أو تحديثها أو اكتمالها</p>
            </div>
            <Switch 
              checked={notificationSettings.orderStatusChanges} 
              onCheckedChange={() => handleTypeChange('orderStatusChanges')}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">إعلانات النظام</p>
              <p className="text-sm text-gray-500">صيانة، تحديثات، ورسائل النظام المهمة</p>
            </div>
            <Switch 
              checked={notificationSettings.systemAnnouncements} 
              onCheckedChange={() => handleTypeChange('systemAnnouncements')}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">التسويق والنصائح</p>
              <p className="text-sm text-gray-500">ميزات جديدة، نصائح، ومحتوى ترويجي</p>
            </div>
            <Switch 
              checked={notificationSettings.marketingMessages} 
              onCheckedChange={() => handleTypeChange('marketingMessages')}
              disabled={isSaving}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-5">
          <Button 
            variant="outline" 
            onClick={handleResetNotifications}
            disabled={isSaving}
          >
            إعادة التعيين إلى الافتراضي
          </Button>
          <Button 
            className="gap-1" 
            onClick={handleSaveNotifications}
            disabled={isSaving}
          >
            <FiSave className="h-4 w-4" />
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* الساعات الهادئة */}
      <Card>
        <CardHeader>
          <CardTitle>الساعات الهادئة</CardTitle>
          <CardDescription>
            تعيين نطاق زمني لن تتلقى خلاله إشعارات باستثناء التنبيهات الهامة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">وقت البدء</Label>
              <Input 
                id="quiet-start" 
                type="time" 
                value={quietHours.start}
                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">وقت الانتهاء</Label>
              <Input 
                id="quiet-end" 
                type="time" 
                value={quietHours.end}
                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-5">
          <Button 
            className="gap-1" 
            onClick={handleSaveQuietHours}
            disabled={isSaving}
          >
            <FiSave className="h-4 w-4" />
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ الساعات الهادئة'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotificationsPanel;