import { ReactNode } from 'react';
import { StoreProvider } from '@/core/providers/StoreProvider';
import { ThemeProvider } from '@/core/providers/ThemeProvider';
import { AuthProvider } from '@/domains/admins/providers/AuthProvider';
import { ToastProvider } from '@/shared/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import '@/core/styles/globals.css';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * التخطيط الرئيسي للتطبيق
 * يستخدم لتوفير السياق المشترك لجميع الصفحات
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="ltr" className="h-full" suppressHydrationWarning>
      <StoreProvider>
        <body className="h-full">
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <Toaster />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </body>
      </StoreProvider>
    </html>
  );
}