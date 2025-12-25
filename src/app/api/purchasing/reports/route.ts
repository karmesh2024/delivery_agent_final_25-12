import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentAdminId } from '@/lib/auth/get-current-user';
import { checkPurchasingPermission } from '@/lib/permissions/purchasing-permissions';

/**
 * GET /api/purchasing/reports
 * جلب تقارير المشتريات (إحصائيات، تقارير الموردين، تقارير المخازن)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[PurchasingReportsAPI] GET request received');
    
    const adminId = await getCurrentAdminId(request);
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    
    // التحقق من صلاحية عرض التقارير
    const hasPermission = await checkPurchasingPermission(adminId, 'VIEW_INVOICES');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض تقارير المشتريات' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');
    const warehouseId = searchParams.get('warehouseId');

    // بناء شروط التاريخ
    const dateFilter: Prisma.warehouse_invoicesWhereInput = {};
    if (startDate || endDate) {
      dateFilter.invoice_date = {};
      if (startDate) {
        dateFilter.invoice_date.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.invoice_date.lte = new Date(endDate);
      }
    }

    // بناء شروط المورد
    if (supplierId) {
      dateFilter.supplier_id = parseInt(supplierId);
    }

    // بناء شروط المخزن
    if (warehouseId) {
      dateFilter.warehouse_id = parseInt(warehouseId);
    }

    switch (reportType) {
      case 'overview': {
        // تقرير شامل
        const [
          totalInvoices,
          totalAmount,
          invoicesByStatus,
          topSuppliers,
          invoicesByWarehouse,
          recentInvoices,
        ] = await Promise.all([
          // إجمالي الفواتير
          prisma.warehouse_invoices.count({ where: dateFilter }),
          
          // إجمالي المبلغ
          prisma.warehouse_invoices.aggregate({
            where: dateFilter,
            _sum: { total_amount: true },
          }),
          
          // الفواتير حسب الحالة
          prisma.warehouse_invoices.groupBy({
            by: ['status'],
            where: dateFilter,
            _count: { id: true },
            _sum: { total_amount: true },
          }),
          
          // أفضل الموردين
          prisma.warehouse_invoices.groupBy({
            by: ['supplier_id'],
            where: dateFilter,
            _count: { id: true },
            _sum: { total_amount: true },
            orderBy: { _sum: { total_amount: 'desc' } },
            take: 10,
          }),
          
          // الفواتير حسب المخزن
          prisma.warehouse_invoices.groupBy({
            by: ['warehouse_id'],
            where: dateFilter,
            _count: { id: true },
            _sum: { total_amount: true },
          }),
          
          // آخر الفواتير
          prisma.warehouse_invoices.findMany({
            where: dateFilter,
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
              suppliers: { select: { name: true, name_ar: true } },
              warehouses: { select: { name: true } },
            },
          }),
        ]);

        // جلب أسماء الموردين
        const supplierIds = topSuppliers.map((s) => s.supplier_id).filter(Boolean) as number[];
        const suppliers = supplierIds.length > 0
          ? await prisma.suppliers.findMany({
              where: { id: { in: supplierIds } },
              select: { id: true, name: true, name_ar: true },
            })
          : [];

        const topSuppliersWithNames = topSuppliers.map((supplier) => {
          const supplierData = suppliers.find((s) => s.id === supplier.supplier_id);
          return {
            supplier_id: supplier.supplier_id,
            supplier_name: supplierData?.name_ar || supplierData?.name || 'غير محدد',
            invoice_count: supplier._count.id,
            total_amount: Number(supplier._sum.total_amount || 0),
          };
        });

        // جلب أسماء المخازن
        const warehouseIds = invoicesByWarehouse.map((w) => w.warehouse_id).filter(Boolean) as number[];
        const warehouses = warehouseIds.length > 0
          ? await prisma.warehouses.findMany({
              where: { id: { in: warehouseIds } },
              select: { id: true, name: true },
            })
          : [];

        const invoicesByWarehouseWithNames = invoicesByWarehouse.map((warehouse) => {
          const warehouseData = warehouses.find((w) => w.id === warehouse.warehouse_id);
          return {
            warehouse_id: warehouse.warehouse_id,
            warehouse_name: warehouseData?.name || 'غير محدد',
            invoice_count: warehouse._count.id,
            total_amount: Number(warehouse._sum.total_amount || 0),
          };
        });

        return NextResponse.json({
          overview: {
            total_invoices: totalInvoices,
            total_amount: Number(totalAmount._sum.total_amount || 0),
            invoices_by_status: invoicesByStatus.map((status) => ({
              status: status.status,
              count: status._count.id,
              total_amount: Number(status._sum.total_amount || 0),
            })),
            top_suppliers: topSuppliersWithNames,
            invoices_by_warehouse: invoicesByWarehouseWithNames,
            recent_invoices: recentInvoices.map((inv) => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              supplier_name: inv.suppliers?.name_ar || inv.suppliers?.name || null,
              warehouse_name: inv.warehouses?.name || null,
              total_amount: Number(inv.total_amount || 0),
              status: inv.status,
              invoice_date: inv.invoice_date?.toISOString() || null,
            })),
          },
        });
      }

      case 'suppliers': {
        // تقرير الموردين
        const supplierStats = await prisma.warehouse_invoices.groupBy({
          by: ['supplier_id'],
          where: dateFilter,
          _count: { id: true },
          _sum: { total_amount: true },
          _avg: { total_amount: true },
          orderBy: { _sum: { total_amount: 'desc' } },
        });

        const supplierIds = supplierStats.map((s) => s.supplier_id).filter(Boolean) as number[];
        const suppliers = supplierIds.length > 0
          ? await prisma.suppliers.findMany({
              where: { id: { in: supplierIds } },
              select: {
                id: true,
                name: true,
                name_ar: true,
                contact_phone: true,
                email: true,
                rating: true,
              },
            })
          : [];

        const suppliersReport = supplierStats.map((stat) => {
          const supplier = suppliers.find((s) => s.id === stat.supplier_id);
          return {
            supplier_id: stat.supplier_id,
            supplier_name: supplier?.name_ar || supplier?.name || 'غير محدد',
            contact_phone: supplier?.contact_phone || null,
            email: supplier?.email || null,
            rating: supplier?.rating ? Number(supplier.rating) : null,
            invoice_count: stat._count.id,
            total_amount: Number(stat._sum.total_amount || 0),
            average_amount: Number(stat._avg.total_amount || 0),
          };
        });

        return NextResponse.json({ suppliers: suppliersReport });
      }

      case 'warehouses': {
        // تقرير المخازن
        const warehouseStats = await prisma.warehouse_invoices.groupBy({
          by: ['warehouse_id'],
          where: dateFilter,
          _count: { id: true },
          _sum: { total_amount: true },
          _avg: { total_amount: true },
          orderBy: { _sum: { total_amount: 'desc' } },
        });

        const warehouseIds = warehouseStats.map((w) => w.warehouse_id).filter(Boolean) as number[];
        const warehouses = warehouseIds.length > 0
          ? await prisma.warehouses.findMany({
              where: { id: { in: warehouseIds } },
              select: { id: true, name: true, location: true },
            })
          : [];

        const warehousesReport = warehouseStats.map((stat) => {
          const warehouse = warehouses.find((w) => w.id === stat.warehouse_id);
          return {
            warehouse_id: stat.warehouse_id,
            warehouse_name: warehouse?.name || 'غير محدد',
            location: warehouse?.location || null,
            invoice_count: stat._count.id,
            total_amount: Number(stat._sum.total_amount || 0),
            average_amount: Number(stat._avg.total_amount || 0),
          };
        });

        return NextResponse.json({ warehouses: warehousesReport });
      }

      case 'status': {
        // تقرير حسب الحالة
        const statusStats = await prisma.warehouse_invoices.groupBy({
          by: ['status'],
          where: dateFilter,
          _count: { id: true },
          _sum: { total_amount: true },
        });

        return NextResponse.json({
          status: statusStats.map((stat) => ({
            status: stat.status,
            count: stat._count.id,
            total_amount: Number(stat._sum.total_amount || 0),
          })),
        });
      }

      default:
        return NextResponse.json(
          { error: 'نوع التقرير غير صحيح' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[PurchasingReportsAPI] Error fetching reports:', error);
    return NextResponse.json(
      { error: 'فشل في جلب التقارير', details: error.message },
      { status: 500 }
    );
  }
}

