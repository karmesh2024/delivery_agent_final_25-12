'use client';

import React, { useState, useEffect, ComponentType } from 'react';
import { Button } from "@/shared/components/ui/button";
import { FiRefreshCw } from "react-icons/fi";

interface DynamicComponentLoaderProps {
  // مسار المكون الأصلي للاستيراد
  originalComponentPath: string;
  // مسار المكون الاحتياطي للاستيراد
  fallbackComponentPath: string;
  // العنوان الذي سيظهر في رسائل الخطأ
  componentTitle: string;
  // أي خصائص إضافية تريد تمريرها للمكون
  componentProps?: Record<string, unknown>;
}

/**
 * مكون لتحميل المكونات بشكل ديناميكي مع معالجة أخطاء الترميز UTF-8
 */
const DynamicComponentLoader: React.FC<DynamicComponentLoaderProps> = ({
  originalComponentPath,
  fallbackComponentPath,
  componentTitle,
  componentProps = {}
}) => {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(Date.now());
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const loadComponent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // إصلاح: استخدام importComponent بشكل صحيح عبر إضافة المسار نسبيًا
        let importedComponent;
        try {
          // محاولة استيراد مباشرة من المسار الأصلي
          importedComponent = await import(/* webpackIgnore: true */ originalComponentPath);
        } catch (directImportError) {
          // إذا فشل، نجرب استيراد عبر مسار تطبيق Next.js الكامل
          if (typeof window !== 'undefined') {
            const fullPath = require.resolve(originalComponentPath);
            importedComponent = await import(/* webpackIgnore: true */ fullPath);
          } else {
            throw directImportError;
          }
        }
        
        setComponent(() => importedComponent.default);
        setUsingFallback(false);
      } catch (err) {
        console.error(`فشل في تحميل المكون الأصلي (${componentTitle}):`, err);
        
        try {
          // محاولة تحميل المكون الاحتياطي
          const fallbackModule = await import(fallbackComponentPath);
          setComponent(() => fallbackModule.default);
          setUsingFallback(true);
        } catch (fallbackErr) {
          console.error(`فشل في تحميل المكون الاحتياطي (${componentTitle}):`, fallbackErr);
          setError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)));
          setComponent(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [originalComponentPath, fallbackComponentPath, componentTitle, key]);

  // عرض رسالة تحميل
  if (isLoading) {
    return <div className="p-8 text-center">جاري تحميل {componentTitle}...</div>;
  }

  // عرض رسالة خطأ إذا فشل تحميل المكونين
  if (error || !Component) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h2 className="text-red-800 text-lg font-bold mb-2">حدث خطأ أثناء تحميل {componentTitle}</h2>
          <p className="text-red-700 mb-4">{error?.message || 'قد تكون هناك مشكلة في ملفات النظام'}</p>
          <Button 
            onClick={() => setKey(Date.now())}
          >
            <FiRefreshCw className="mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // عرض تنبيه إذا كان يستخدم النسخة الاحتياطية
  if (usingFallback) {
    return (
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
          <p className="text-amber-700">
            ملاحظة: يتم عرض نسخة احتياطية من {componentTitle} حالياً. بعض الوظائف قد لا تعمل.
            <Button 
              variant="link"
              className="p-0 h-auto ml-2 text-amber-800"
              onClick={() => setKey(Date.now())}
            >
              <FiRefreshCw className="inline mr-1" />
              إعادة المحاولة
            </Button>
          </p>
        </div>
        <Component key={key} {...componentProps} />
      </div>
    );
  }

  // عرض المكون بنجاح
  return <Component key={key} {...componentProps} />;
};

export default DynamicComponentLoader; 