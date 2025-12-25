'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetPassword, clearError, clearResetEmailSent } from '@/domains/admins/store/authSlice';
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
 * صفحة نسيت كلمة المرور
 * تسمح للمستخدمين بطلب رابط إعادة تعيين كلمة المرور
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error, resetEmailSent } = useAppSelector((state) => state.auth);
  
  // مسح الحالة عند التحميل
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearResetEmailSent());
  }, [dispatch]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(resetPassword({ email }));
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">استعادة كلمة المرور</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {resetEmailSent ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. 
                يرجى التحقق من صندوق الوارد الخاص بك واتباع التعليمات لإعادة تعيين كلمة المرور.
              </AlertDescription>
            </Alert>
          ) : (
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
                  placeholder="أدخل بريدك الإلكتروني"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
              </Button>
            </form>
          )}
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