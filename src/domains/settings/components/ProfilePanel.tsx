"use client";

/**
 * مكون لوحة الملف الشخصي في الإعدادات
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { toast } from "sonner";
import { FiSave, FiUpload, FiAlertCircle } from "react-icons/fi";
import { updateProfile, uploadProfileImage } from "../store/settingsSlice";
import { UserData } from "../types";

/**
 * مكون لوحة الملف الشخصي
 * يعرض ويتيح تعديل معلومات الملف الشخصي للمستخدم
 */
export const ProfilePanel = () => {
  // الوصول إلى حالة الإعدادات من Redux
  const dispatch = useDispatch<AppDispatch>();
  const { userData, isSaving, error } = useSelector((state: RootState) => state.settings);

  // حالة النموذج المحلية
  const [formData, setFormData] = useState<Partial<UserData>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });

  // تحديث حالة النموذج المحلية عند تحميل بيانات المستخدم
  useEffect(() => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      postalCode: userData.postalCode || ''
    });
  }, [userData]);

  // معالجة تغيير حقول النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // إرسال بيانات النموذج لتحديث الملف الشخصي
      await dispatch(updateProfile({ userId: userData.id, profileData: formData })).unwrap();
      toast.success('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      toast.error('فشل تحديث الملف الشخصي');
      console.error('Error updating profile:', error);
    }
  };

  // معالجة تغيير الصورة الشخصية
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    try {
      await dispatch(uploadProfileImage({ userId: userData.id, file })).unwrap();
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (error) {
      toast.error('فشل تحديث الصورة الشخصية');
      console.error('Error uploading profile image:', error);
    }
  };

  // إلغاء التغييرات
  const handleCancel = () => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      postalCode: userData.postalCode || ''
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* معلومات الملف الشخصي */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>معلومات الملف الشخصي</CardTitle>
          <CardDescription>
            تحديث المعلومات الشخصية وتفاصيل الاتصال
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">الدور</Label>
                <Input id="role" value={userData.role} disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={handleChange} 
                placeholder="أدخل العنوان"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input 
                  id="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="المدينة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">المحافظة/المنطقة</Label>
                <Input 
                  id="state" 
                  value={formData.state} 
                  onChange={handleChange} 
                  placeholder="المحافظة/المنطقة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">الرمز البريدي</Label>
                <Input 
                  id="postalCode" 
                  value={formData.postalCode} 
                  onChange={handleChange} 
                  placeholder="الرمز البريدي"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="gap-1"
              disabled={isSaving}
            >
              <FiSave className="h-4 w-4" />
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* الصورة الشخصية */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>الصورة الشخصية</CardTitle>
          <CardDescription>
            رفع صورة شخصية أو أفاتار
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 relative">
            <Avatar className="w-full h-full rounded-full object-cover border-4 border-gray-100">
              {userData.profileImage ? (
                <img 
                  src={userData.profileImage} 
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl">
                  {userData.name?.charAt(0) || 'U'}
                </div>
              )}
            </Avatar>
            <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 rounded-full p-2 bg-white border border-gray-200 cursor-pointer">
              <FiUpload className="h-4 w-4" />
            </label>
            <input 
              type="file" 
              id="profile-image-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSaving}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>أنواع الملفات المسموح بها: PNG, JPG, GIF</p>
            <p>الحد الأقصى لحجم الملف: 2 ميجابايت</p>
          </div>
          
          <label htmlFor="profile-image-upload-btn">
            <Button 
              variant="outline" 
              className="w-full gap-1"
              disabled={isSaving}
              id="profile-image-upload-btn"
              onClick={() => document.getElementById('profile-image-upload')?.click()}
            >
              <FiUpload className="h-4 w-4" />
              رفع صورة جديدة
            </Button>
          </label>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePanel;