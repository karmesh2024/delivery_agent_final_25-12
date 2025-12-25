"use client";

import { useEffect, useState, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * مكون ClientOnly يُستخدم لعرض المحتوى فقط على جانب العميل (المتصفح)
 * يمنع أخطاء Hydration التي تحدث عندما يختلف الناتج بين الخادم والعميل
 * مفيد بشكل خاص للمحتوى الذي يعتمد على واجهة برمجة التطبيقات المحلية، والتوقيت، واللغة المحلية، وما إلى ذلك
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // يتم عرض محتوى بديل أو لا شيء أثناء تحميل الصفحة من جانب الخادم
  if (!isClient) {
    return <>{fallback}</>;
  }

  // يتم عرض المحتوى الحقيقي فقط عندما يكون المكون على جانب العميل
  return <>{children}</>;
}