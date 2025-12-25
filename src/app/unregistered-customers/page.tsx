"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnregisteredCustomers, setFilters, resetFilters } from '@/domains/customers/store/unregisteredCustomersSlice';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Loader2, Search, RefreshCw, Phone, User, Calendar, DollarSign, Package2, Eye, MessageSquare, Settings } from 'lucide-react';
import { formatDate } from '@/shared/utils/formatters';
import dynamic from 'next/dynamic';

// استيراد مكون الاتصال بشكل ديناميكي لتجنب أخطاء الهيدريشن
const ContactDialog = dynamic(
  () => import('@/domains/customers/components/ContactDialog').then((mod) => mod.ContactDialog),
  { ssr: false }
);

export default function UnregisteredCustomersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { unregisteredCustomers, isLoading, filters, totalCount } = useAppSelector((state) => state.unregisteredCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  
  // حالة نافذة الاتصال
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof unregisteredCustomers[0] | null>(null);

  // جلب بيانات العملاء غير المسجلين عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchUnregisteredCustomers(filters));
  }, [dispatch, filters]);

  // التعامل مع تغيير البحث
  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm, page: 1 }));
  };

  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setSearchTerm('');
    setAgentFilter(null);
    dispatch(resetFilters());
  };

  // الانتقال إلى صفحة تفاصيل العميل غير المسجل
  const handleViewCustomer = (customerId: string) => {
    router.push(`/unregistered-customers/${customerId}`);
  };
  
  // فتح نافذة الاتصال بالعميل
  const handleOpenContactDialog = (customer: typeof unregisteredCustomers[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setContactDialogOpen(true);
  };
  
  // إغلاق نافذة الاتصال
  const handleCloseContactDialog = () => {
    setContactDialogOpen(false);
    setSelectedCustomer(null);
  };
  
  // استخراج قائمة الوكلاء الفريدة
  const uniqueAgents = useMemo(() => {
    const agentsMap = new Map();
    
    unregisteredCustomers.forEach(customer => {
      if (customer.agent) {
        agentsMap.set(customer.agent.id, customer.agent);
      }
    });
    
    return Array.from(agentsMap.values());
  }, [unregisteredCustomers]);
  
  // تصفية العملاء حسب الوكيل
  const filteredCustomers = useMemo(() => {
    if (!agentFilter) return unregisteredCustomers;
    
    return unregisteredCustomers.filter(customer => 
      customer.agent && customer.agent.id === agentFilter
    );
  }, [unregisteredCustomers, agentFilter]);

  return (
    <DashboardLayout title="العملاء غير المسجلين">
      <div className="space-y-4">
        {/* عنوان الصفحة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">العملاء غير المسجلين</h1>
            <p className="text-muted-foreground">عرض وإدارة بيانات العملاء غير المسجلين</p>
          </div>
          <Button
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => router.push('/unregistered-customers/settings')}
          >
            <Settings className="h-4 w-4 ml-2" />
            إعدادات التواصل
          </Button>
        </div>

        {/* بطاقة الإحصائيات */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-blue-100 shadow-sm">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardDescription className="text-gray-600 text-sm mb-1">إجمالي العملاء غير المسجلين</CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-700">{totalCount}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* فلاتر البحث */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center">
              <Search className="h-5 w-5 ml-2 text-blue-600" />
              بحث عن عميل
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3">
              {/* صف البحث */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="البحث بالاسم أو رقم الهاتف"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                  >
                    <Search className="h-4 w-4 ml-2" />
                    بحث
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilters}
                    className="border-gray-300 hover:bg-gray-100 hover:text-gray-800 flex-1 sm:flex-none"
                  >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    إعادة تعيين
                  </Button>
                </div>
              </div>
              
              {/* فلتر الوكلاء */}
              {uniqueAgents.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2 text-gray-700">تصفية حسب الوكيل:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={agentFilter === null ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setAgentFilter(null)}
                      className={agentFilter === null 
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                        : "border-gray-200 text-gray-700"
                      }
                    >
                      الكل
                    </Button>
                    
                    {uniqueAgents.map(agent => (
                      <Button 
                        key={agent.id}
                        variant={agentFilter === agent.id ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setAgentFilter(agent.id)}
                        className={agentFilter === agent.id 
                          ? "bg-orange-100 text-orange-800 hover:bg-orange-200" 
                          : "border-gray-200 text-gray-700"
                        }
                      >
                        <User className="h-3 w-3 ml-1" />
                        {agent.fullName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* جدول العملاء غير المسجلين */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-center py-10">
                <div className="bg-gray-100 p-5 rounded-full mb-4">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {unregisteredCustomers.length === 0 
                    ? "لا يوجد عملاء غير مسجلين" 
                    : "لا توجد نتائج مطابقة للفلتر"
                  }
                </h3>
                <p className="text-gray-500 max-w-md">
                  {unregisteredCustomers.length === 0 
                    ? "لم يتم العثور على أي عملاء غير مسجلين في النظام. قد يكون السبب أنه لم يتم تسجيل أي عملاء غير مسجلين بعد."
                    : "لا توجد نتائج مطابقة لمعايير البحث الحالية. يرجى تعديل معايير البحث أو إعادة تعيينها."
                  }
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={handleResetFilters}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة تعيين البحث
                </Button>
              </div>
            ) : (
              <Table className="border border-gray-200 rounded-md">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-center font-bold py-3 w-16">#</TableHead>
                    <TableHead className="text-right font-bold py-3">الاسم</TableHead>
                    <TableHead className="text-center font-bold py-3">رقم الهاتف</TableHead>
                    <TableHead className="text-center font-bold py-3">تابع</TableHead>
                    <TableHead className="text-center font-bold py-3">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-center font-bold py-3">حالة الاتصال</TableHead>
                    <TableHead className="text-center font-bold py-3">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100"
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      <TableCell className="text-center font-medium py-3">{(filters.page - 1) * filters.limit + index + 1}</TableCell>
                      <TableCell className="text-right font-medium py-3">{customer.name}</TableCell>
                      <TableCell className="text-center py-3 font-medium text-gray-700">{customer.phone}</TableCell>
                      <TableCell className="text-center py-3">
                        {customer.agent ? (
                          <div className="flex flex-col items-center">
                            <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md mb-1">
                              وكيل
                            </div>
                            <span className="font-medium text-sm">{customer.agent.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{formatDate(customer.createdAt)}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(customer.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {customer.contactStatus ? (
                          <div className="flex flex-col items-center">
                            {customer.contactStatus.contacted ? (
                              <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md">
                                تم التواصل
                              </div>
                            ) : (
                              <div className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-md">
                                لم يتم التواصل
                              </div>
                            )}
                            {customer.contactStatus.lastContactDate && (
                              <span className="text-xs text-gray-500 mt-1">
                                {formatDate(customer.contactStatus.lastContactDate)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-md">
                            لم يتم التواصل
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomer(customer.id);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={(e) => handleOpenContactDialog(customer, e)}
                          >
                            <MessageSquare className="h-4 w-4 ml-2" />
                            تواصل
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ترقيم الصفحات - يمكن إضافته لاحقاً */}
      </div>
      
      {/* نافذة الاتصال بالعميل */}
      {selectedCustomer && contactDialogOpen && (
        <ContactDialog 
          isOpen={contactDialogOpen} 
          onClose={handleCloseContactDialog} 
          customer={selectedCustomer} 
        />
      )}
    </DashboardLayout>
  );
} 