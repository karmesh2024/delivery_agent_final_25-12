import { ReactNode } from 'react';
import { Inter, Cairo } from 'next/font/google';
import { StoreProvider } from '@/core/providers/StoreProvider';
import { ThemeProvider } from '@/core/providers/ThemeProvider';
import { AuthProvider } from '@/domains/admins/providers/AuthProvider';
import { ToastProvider } from '@/shared/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import '@/core/styles/globals.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      className={`h-full ${inter.variable} ${cairo.variable}`} 
      suppressHydrationWarning
    >
      <body className="h-full font-cairo" suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <Toaster richColors position="top-center" />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}