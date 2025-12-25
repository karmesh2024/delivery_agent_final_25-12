import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ تفعيل الوضع الصارم في React للحماية من المشاكل
  reactStrictMode: true,
  
  // إعدادات تجريبية
  experimental: {
    // استخدام optimizePackageImports لتحسين الأداء
    optimizePackageImports: ['@headlessui/react'],
    // تكوين Turbopack بشكل صحيح
    turbo: {
      rules: {
        // تكوين قواعد Turbopack إذا لزم الأمر
      }
    }
  },
  
  // تحديد مسار المجلدات الخاصة بالتطبيق
  distDir: '.next',
  
  // Remove static export configuration
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
      "randomuser.me",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // ✅ فحص أخطاء ESLint في الإنتاج
    ignoreDuringBuilds: false,
  },
  typescript: {
    // ✅ فحص أخطاء TypeScript في الإنتاج
    ignoreBuildErrors: false,
  },
  // ✅ سياسة أمان المحتوى المحسنة والآمنة
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://unpkg.com", // فقط للـ unpkg
              "style-src 'self' 'unsafe-inline' https://unpkg.com",  // فقط للـ unpkg
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'"
            ].join("; ")
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          }
        ]
      }
    ]
  },
  webpack(config) {
    // إضافة دعم للقماشة (canvas) لحل مشاكل التوافق مع Leaflet
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
