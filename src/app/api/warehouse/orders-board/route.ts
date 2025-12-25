import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';

// Helper function to retry Prisma queries on connection errors
async function retryPrismaQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 5,
  attempt = 1
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    // قائمة بأكواد أخطاء الاتصال التي يجب إعادة المحاولة عليها
    const connectionErrorCodes = [
      'P1001', // Can't reach database server
      'P1002', // Database connection timeout
      'P1008', // Operations timed out
      'P1011', // TLS connection error
      'P1017', // Server has closed the connection / Connection pool timeout
    ];
    
    // التحقق من أخطاء Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (connectionErrorCodes.includes(error.code) && attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.warn(`[OrdersBoardAPI] Prisma connection error ${error.code} on attempt ${attempt}/${maxRetries}, retrying in ${waitTime}ms...`);
        
        // محاولة إعادة الاتصال
        try {
          await prisma.$disconnect();
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          await prisma.$connect();
        } catch (reconnectError) {
          // إذا فشل إعادة الاتصال، نستمر في المحاولة
          console.warn(`[OrdersBoardAPI] Reconnection attempt failed, will retry query...`);
        }
        
        return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
      }
    }
    
    // معالجة أخطاء الشبكة العامة
    if (error instanceof Error) {
      const isNetworkError = 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('Connection pool timeout') ||
        error.message.includes('connect ECONNREFUSED') ||
        error.message.includes('getaddrinfo ENOTFOUND');
      
      if (isNetworkError && attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`[OrdersBoardAPI] Network error on attempt ${attempt}/${maxRetries}, retrying in ${waitTime}ms...`);
        
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return retryPrismaQuery(queryFn, maxRetries, attempt + 1);
      }
    }
    
    throw error;
  }
}

// Helper function to serialize BigInt values
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * GET /api/warehouse/orders-board
 * جلب الطلبات للوحة التجميع
 * يعرض فقط الطلبات التي لم تكتمل بعد (fulfillment_status != 'completed')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fulfillmentStatus = searchParams.get('fulfillment_status');
    const shopId = searchParams.get('shop_id');

    // بناء استعلام للطلبات
    const where: any = {};

    // فلترة حسب المتجر
    if (shopId) {
      where.shop_id = shopId;
    }

    // جلب الطلبات مع العناصر والمتجر
    // ملاحظة: إذا كان حقل fulfillment_status غير موجود في schema، سنتعامل معه بعد الجلب
    const orders = await retryPrismaQuery(() =>
      prisma.store_orders.findMany({
        where,
        include: {
          store_order_items: {
            include: {
              store_products: {
                select: {
                  id: true,
                  name_ar: true,
                  name_en: true,
                  sku: true,
                  store_product_images: {
                    where: {
                      is_primary: true,
                    },
                    take: 1,
                    select: {
                      image_url: true,
                    },
                  },
                },
              },
            },
          },
          store_shops: {
            select: {
              id: true,
              name_ar: true,
              name_en: true,
            },
          },
        },
        orderBy: [
          { created_at: 'asc' }, // حسب تاريخ الإنشاء
        ],
      })
    );

    // جلب بيانات الوكلاء للطلبات التي لديها customer_id
    const customerIds = orders
      .map((order) => order.customer_id)
      .filter((id): id is string => id !== null);

    let agentsMap: Record<string, any> = {};
    if (customerIds.length > 0) {
      const agents = await retryPrismaQuery(() =>
        prisma.agents.findMany({
          where: {
            id: {
              in: customerIds,
            },
          },
          include: {
            agent_details: {
              select: {
                latitude: true,
                longitude: true,
              },
            },
          },
        })
      );

      agents.forEach((agent) => {
        agentsMap[agent.id] = {
          id: agent.id,
          full_name: agent.full_name,
          phone: agent.phone,
          email: agent.email || null,
          location:
            agent.agent_details && agent.agent_details.latitude && agent.agent_details.longitude
              ? {
                  lat: parseFloat(String(agent.agent_details.latitude)),
                  lng: parseFloat(String(agent.agent_details.longitude)),
                }
              : undefined,
        };
      });
    }

    // فلترة الطلبات حسب fulfillment_status بعد الجلب (للتعامل مع الحقل غير الموجود)
    let filteredOrders = orders;
    if (!fulfillmentStatus || fulfillmentStatus === 'all') {
      // إزالة الطلبات المكتملة فقط
      filteredOrders = orders.filter((order) => {
        const status = (order as any).fulfillment_status;
        return !status || status !== 'completed';
      });
    }

    // دمج بيانات الوكلاء مع الطلبات
    const ordersWithAgents = filteredOrders.map((order) => {
      const orderData: any = {
        ...order,
        fulfillment_status: (order as any).fulfillment_status || 'pending', // تعيين قيمة افتراضية إذا كانت null
        agent: order.customer_id ? agentsMap[order.customer_id] || null : null,
        items: order.store_order_items.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price.toString(),
          product_data: item.product_data,
          created_at: item.created_at?.toISOString() || null,
          product: item.store_products
            ? {
                id: item.store_products.id,
                name_ar: item.store_products.name_ar,
                name_en: item.store_products.name_en,
                sku: item.store_products.sku,
                image_url:
                  item.store_products.store_product_images?.[0]?.image_url || null,
              }
            : null,
        })),
        shop: order.store_shops,
        final_amount: order.final_amount.toString(),
        created_at: order.created_at?.toISOString() || null,
        updated_at: order.updated_at?.toISOString() || null,
        // Fulfillment stage timestamps
        pending_at: (order as any).pending_at?.toISOString() || null,
        collecting_at: (order as any).collecting_at?.toISOString() || null,
        verifying_at: (order as any).verifying_at?.toISOString() || null,
        packaging_at: (order as any).packaging_at?.toISOString() || null,
        ready_at: (order as any).ready_at?.toISOString() || null,
        completed_at: (order as any).completed_at?.toISOString() || null,
      };

      delete orderData.store_order_items;
      delete orderData.store_shops;

      return serializeBigInt(orderData);
    });

    return NextResponse.json(ordersWithAgents);
  } catch (error) {
    console.error('Error fetching orders for fulfillment board:', error);
    
    // Log more details for debugging
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
    }
    
    return NextResponse.json(
      { 
        error: 'فشل في جلب الطلبات', 
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined
      },
      { status: 500 }
    );
  } finally {
    // Don't disconnect here as it might be needed for retries
    // The connection will be managed by Prisma Client
  }
}

