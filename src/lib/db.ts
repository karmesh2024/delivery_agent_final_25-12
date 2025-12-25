import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// معالجة أخطاء الاتصال عند بدء التشغيل
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  
  // محاولة الاتصال عند بدء التشغيل في development
  prisma.$connect().catch((error) => {
    console.warn('[Prisma] Initial connection failed, will retry on first query:', error.message);
  });
}

// معالجة أخطاء الاتصال العامة
prisma.$on('error' as never, (e: any) => {
  console.error('[Prisma] Database error:', e);
});

export default prisma; 