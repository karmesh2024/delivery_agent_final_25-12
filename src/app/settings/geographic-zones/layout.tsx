import { ReactNode } from 'react';
import Script from 'next/script';

export const metadata = {
  title: 'إدارة المناطق الجغرافية',
  description: 'إضافة وتعديل المناطق الجغرافية لمناطق عمل المناديب',
};

export default function GeographicZonesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      
      {/* إضافة أوراق أنماط Leaflet في Client Component */}
      <Script id="leaflet-css" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            // إضافة أنماط Leaflet
            if (!document.getElementById('leaflet-css-link')) {
              const leafletCssLink = document.createElement('link');
              leafletCssLink.id = 'leaflet-css-link';
              leafletCssLink.rel = 'stylesheet';
              leafletCssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
              leafletCssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
              leafletCssLink.crossOrigin = '';
              document.head.appendChild(leafletCssLink);
            }
            
            // إضافة أنماط Leaflet Draw
            if (!document.getElementById('leaflet-draw-css-link')) {
              const leafletDrawCssLink = document.createElement('link');
              leafletDrawCssLink.id = 'leaflet-draw-css-link';
              leafletDrawCssLink.rel = 'stylesheet';
              leafletDrawCssLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
              leafletDrawCssLink.crossOrigin = '';
              document.head.appendChild(leafletDrawCssLink);
            }
          }
        `}
      </Script>
    </>
  );
} 