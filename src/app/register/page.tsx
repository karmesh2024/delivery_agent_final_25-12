'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register, clearError } from '@/domains/admins/store/authSlice';
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
 * Component that uses useSearchParams - must be wrapped in Suspense
 */
function RegisterForm() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get('token'); // استخراج رمز الدعوة من الرابط
  
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  
  // إعادة التوجيه إذا كان المستخدم مصادقًا بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // مسح رسائل الخطأ عند التحميل
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
      // يمكن استخدام إشعارات أو رسائل خطأ هنا
      return;
    }
    
    const result = await dispatch(register({ 
      email, 
      password, 
      confirm_password: confirmPassword,
      full_name: fullName,
      invitation_token: invitationToken || undefined
    }));
    
    if (register.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };
  
  if (success) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">تم التسجيل بنجاح!</CardTitle>
            <CardDescription>
              تم إنشاء حسابك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
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
  
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            قم بالتسجيل للوصول إلى لوحة تحكم المسؤولين
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
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input 
                id="fullName" 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
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
            
            {invitationToken && (
              <Alert>
                <AlertDescription>
                  تم العثور على رمز دعوة في الرابط. سيتم استخدامه للتسجيل.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || password !== confirmPassword}
            >
              {loading ? 'جاري التسجيل...' : 'التسجيل'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              تسجيل الدخول
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * صفحة التسجيل
 * تسمح للمستخدمين الجدد بالتسجيل في النظام
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
