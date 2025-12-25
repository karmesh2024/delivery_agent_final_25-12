'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, clearError } from '@/domains/admins/store/authSlice';
import { authApi } from '@/services/authApi';
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
import { AuthResult } from '@/domains/admins/types/auth';
import { ClientOnly } from '@/domains/admins/providers/ClientOnly';

/**
 * صفحة تسجيل الدخول
 * تسمح للمستخدمين بتسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  
  // إعادة التوجيه إذا كان المستخدم مصادقًا بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('authStatusChecked', 'true');
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  // مسح رسائل الخطأ عند التحميل
  useEffect(() => {
    dispatch(clearError());
    setEmailNotConfirmed(false);
    setResendSuccess(false);
    setResendError(null);
  }, [dispatch]);
  
  const handleResendConfirmation = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    setResendError(null);
    
    try {
      const result = await authApi.resendEmailConfirmation(email);
      if (result.success) {
        setResendSuccess(true);
      } else if (result.error) {
        setResendError(result.error);
      }
    } catch (err) {
      setResendError('حدث خطأ أثناء إعادة إرسال رابط التأكيد');
    } finally {
      setResendLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    
    // التحقق من رد الفعل لتحديد إذا كان البريد الإلكتروني غير مؤكد
    const payload = result.payload as AuthResult;
    if (payload && payload.emailNotConfirmed) {
      setEmailNotConfirmed(true);
    } else if (payload && payload.success) {
      // تعيين authStatusChecked في sessionStorage فورًا بعد نجاح تسجيل الدخول
      sessionStorage.setItem('authStatusChecked', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');
      console.log('تم تسجيل الدخول بنجاح. حالة المصادقة الآن في Redux store.');
      
      // التوجيه المباشر إلى الصفحة الرئيسية بعد تسجيل الدخول
      setTimeout(() => {
        console.log('توجيه المستخدم إلى الصفحة الرئيسية بعد تسجيل الدخول');
        router.push('/');
      }, 100); // تأخير قصير للسماح بتحديث الحالة
      
      setEmailNotConfirmed(false);
    } else {
      setEmailNotConfirmed(false);
    }
  };
  
  // محتوى النموذج
  const renderFormContent = () => {
    if (emailNotConfirmed) {
      return (
        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800">
              لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد.
            </AlertDescription>
          </Alert>
          
          {resendSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني. يرجى فحص البريد الوارد الخاص بك.
              </AlertDescription>
            </Alert>
          )}
          
          {resendError && (
            <Alert variant="destructive">
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              لم يصلك بريد التأكيد؟
            </p>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="mx-auto"
            >
              {resendLoading ? 'جاري إعادة الإرسال...' : 'إعادة إرسال رابط التأكيد'}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setEmailNotConfirmed(false);
                setResendSuccess(false);
                setResendError(null);
              }}
              className="text-sm"
            >
              العودة إلى تسجيل الدخول
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input 
            id="email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </Button>
      </form>
    );
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-semibold tracking-tight text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            قم بتسجيل الدخول للوصول إلى لوحة تحكم المسؤولين
          </CardDescription>
        </CardHeader>
        
        <ClientOnly fallback={<CardContent className="p-6 pt-0"></CardContent>}>
          <CardContent>
            {renderFormContent()}
          </CardContent>
        </ClientOnly>
        
        <CardFooter className="flex items-center p-6 pt-0 justify-center">
          <div className="text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              التسجيل
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}