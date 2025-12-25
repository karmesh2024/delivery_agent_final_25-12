'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updatePassword, clearError } from '@/domains/admins/store/authSlice';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

/**
 * صفحة إعادة تعيين كلمة المرور
 * تسمح للمستخدمين بتعيين كلمة مرور جديدة بعد النقر على رابط إعادة التعيين
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  
  // مسح الأخطاء عند التحميل والتحقق من وجود الرمز
  useEffect(() => {
    dispatch(clearError());
    
    if (!token) {
      setTokenError(true);
    }
  }, [dispatch, token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
      return;
    }
    
    const result = await dispatch(updatePassword({ 
      password, 
      confirm_password: confirmPassword 
    }));
    
    if (updatePassword.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };
  
  // عرض رسالة خطأ إذا لم يتم العثور على الرمز
  if (tokenError) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">خطأ في إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>
              لم يتم العثور على رمز إعادة التعيين أو انتهت صلاحيته.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="mt-4">
              <Link href="/forgot-password">
                طلب رابط جديد لإعادة تعيين كلمة المرور
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // عرض رسالة نجاح إذا تم تحديث كلمة المرور
  if (success) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">تم إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>
              تم تحديث كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="mt-4">
              <Link href="/login">الذهاب إلى تسجيل الدخول</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // نموذج إعادة تعيين كلمة المرور
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>
            أدخل كلمة المرور الجديدة
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm text-red-500">كلمتا المرور غير متطابقتين</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || password !== confirmPassword}
            >
              {loading ? 'جاري المعالجة...' : 'إعادة تعيين كلمة المرور'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}