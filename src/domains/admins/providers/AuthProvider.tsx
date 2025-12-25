'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkAuth } from '@/domains/admins/store/authSlice';

// المسارات العامة التي لا تتطلب مصادقة
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * مكون مزود المصادقة
 * مسؤول عن التحقق من حالة المصادقة عند بدء التطبيق
 * وتوجيه المستخدم إلى الصفحات المناسبة
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  useEffect(() => {
    // استدعاء checkAuth للتحقق من المصادقة باستخدام HttpOnly cookies
    // لم نعد نعتمد على localStorage
    console.log("AuthProvider: Dispatching checkAuth");
    dispatch(checkAuth()).finally(() => {
      setInitialAuthCheckDone(true);
      console.log("AuthProvider: Initial auth check finished.");
    });
  }, [dispatch]);

  useEffect(() => {
    console.log(`AuthProvider: useEffect for redirection triggered. isAuthenticated: ${isAuthenticated}, loading: ${loading}, initialAuthCheckDone: ${initialAuthCheckDone}, pathname: ${pathname}`);
    // انتظر حتى يكتمل التحقق الأولي من المصادقة
    if (!initialAuthCheckDone) {
      console.log("AuthProvider: Initial auth check not done, returning.");
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => 
      pathname === path || pathname?.startsWith(`${path}/`) || pathname?.startsWith(`${path}?`)
    );
    console.log(`AuthProvider: isPublicPath: ${isPublicPath}`);

    // إذا كان المستخدم مصادقاً
    if (isAuthenticated) {
      console.log("AuthProvider: User is authenticated.");
      // إذا كان المستخدم على مسار عام (مثل /login) وهو مصادق، أعد توجيهه إلى الصفحة الرئيسية
      if (isPublicPath) {
        console.log("AuthProvider: Authenticated user on public path, redirecting to /.");
        router.push('/');
      }
    } 
    // إذا كان المستخدم غير مصادق
    else {
      console.log("AuthProvider: User is NOT authenticated.");
      // إذا كان المستخدم على مسار محمي (ليس مسارًا عامًا) وهو غير مصادق، أعد توجيهه إلى صفحة تسجيل الدخول
      if (!isPublicPath) {
        console.log("AuthProvider: Unauthenticated user on protected path, redirecting to /login.");
        const returnUrl = encodeURIComponent(pathname || '/');
        router.push(`/login?returnUrl=${returnUrl}`);
      }
    }
  }, [isAuthenticated, initialAuthCheckDone, pathname, router]);

  // عرض مؤشر التحميل أثناء التحقق الأولي من المصادقة في الصفحات المحمية
  // سيظهر المؤشر فقط إذا لم يكتمل التحقق الأولي ولم يكن المسار عامًا
  if (!initialAuthCheckDone && !PUBLIC_PATHS.some(path => pathname?.startsWith(path)) && pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}