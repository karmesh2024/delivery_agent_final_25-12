'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';

/**
 * مكون StoreProvider
 * يوفر مزودي الحالة للتطبيق (Redux, React Query, إلخ)
 * يستخدم مع الـ layout.tsx لتوفير الحالة لجميع مكونات التطبيق
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}