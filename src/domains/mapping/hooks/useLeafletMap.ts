import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

/**
 * Hook مخصص لإدارة دورة حياة خريطة Leaflet بشكل صحيح في React وNext.js
 */
export function useLeafletMap(options: {
  center: [number, number];
  zoom: number;
  id?: string;
}) {
  const { center, zoom, id = 'leaflet-map' } = options;
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const initializingRef = useRef(false); // لتجنب التهيئة المتعددة

  // إعداد الأيقونات قبل تهيئة الخريطة
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LeafletIcon = (L as any).Icon;
    if (LeafletIcon && LeafletIcon.Default) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (LeafletIcon.Default.prototype as any)._getIconUrl;
      
      LeafletIcon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    }
  }, []);

  // تهيئة الخريطة عند تركيب المكون
  useEffect(() => {
    // إذا لم يكن هناك حاوية أو كانت الخريطة موجودة بالفعل أو كانت عملية التهيئة جارية
    if (!containerRef.current || mapRef.current || initializingRef.current) return;

    // وضع علامة بأن التهيئة قيد التنفيذ
    initializingRef.current = true;

    // تأجيل تهيئة الخريطة
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        initializingRef.current = false;
        return;
      }

      // فحص إضافي للتأكد من عدم وجود خريطة سابقة على نفس الحاوية
      const existingMapInstance = container.querySelector('.leaflet-map-pane');
      if (existingMapInstance) {
        console.warn(`Found existing Leaflet map in container with ID: ${id}. Skipping initialization.`);
        initializingRef.current = false;
        return;
      }

      console.log(`Creating new Leaflet map with ID: ${id}`);
      
      try {
        // تهيئة الخريطة مع الخيارات المطلوبة
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (L as any).map(container, {
          center,
          zoom,
          zoomControl: false,
        });

        // إضافة طبقة OpenStreetMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // إضافة عناصر التحكم
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (L as any).control.zoom({ position: 'topright' }).addTo(map);

        // حفظ مرجع الخريطة
        mapRef.current = map;
        setIsMapReady(true);
      } catch (error) {
        console.error(`Error initializing Leaflet map: ${error}`);
      } finally {
        initializingRef.current = false;
      }
    }, 100); // تأخير أطول لضمان جاهزية DOM

    // تنظيف الخريطة عند إزالة المكون
    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        console.log(`Removing Leaflet map with ID: ${id}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
      initializingRef.current = false;
    };
    // ✅ FIX: استخدام id فقط كـ dependency - center و zoom يتم تحديثهما عبر map.setView() بدلاً من إعادة الإنشاء
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // فقط id - center و zoom لا يجب أن يسببا إعادة إنشاء

  return {
    containerRef,
    mapInstance: mapRef.current,
    isMapReady
  };
} 