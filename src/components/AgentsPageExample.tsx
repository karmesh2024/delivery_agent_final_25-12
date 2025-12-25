'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAgents, fetchActiveAgents, setActiveFilter } from '@/store/agentsSlice';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

/**
 * مثال لصفحة المندوبين باستخدام Redux
 * هذا المكون يوضح كيفية استخدام متجر Redux في صفحة المندوبين
 */
export default function AgentsPageExample() {
  const dispatch = useAppDispatch();
  
  // استخدام useSelector للوصول إلى حالة المندوبين من متجر Redux
  const { 
    items: agents, 
    activeAgents,
    status, 
    error, 
    activeFilter 
  } = useAppSelector(state => state.agents);
  
  // جلب المندوبين عند تحميل الصفحة
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAgents());
      dispatch(fetchActiveAgents());
    }
  }, [status, dispatch]);
  
  // تغيير فلتر المندوبين النشط
  const handleFilterChange = (filter: string) => {
    dispatch(setActiveFilter(filter));
  };
  
  // تصفية المندوبين بناءً على الفلتر النشط
  const filteredAgents = activeFilter === 'all' 
    ? agents 
    : activeFilter === 'active'
      ? activeAgents
      : agents.filter(agent => agent.status === activeFilter);
  
  // عرض رسالة التحميل
  if (status === 'loading') {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل بيانات المندوبين...</p>
      </div>
    );
  }
  
  // عرض رسالة الخطأ
  if (status === 'failed') {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">خطأ!</strong>
          <span className="block sm:inline"> {error || 'حدث خطأ أثناء تحميل بيانات المندوبين.'}</span>
        </div>
        <Button onClick={() => dispatch(fetchAgents())}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">المندوبين</h1>
        <p className="text-muted-foreground">إدارة ومراقبة مندوبي التوصيل</p>
      </div>
      
      {/* أزرار الفلترة */}
      <div className="mb-6 flex space-x-2 rtl:space-x-reverse">
        <Button 
          variant={activeFilter === 'all' ? 'default' : 'outline'} 
          onClick={() => handleFilterChange('all')}
        >
          الكل ({agents.length})
        </Button>
        <Button 
          variant={activeFilter === 'active' ? 'default' : 'outline'} 
          onClick={() => handleFilterChange('active')}
        >
          نشط ({activeAgents.length})
        </Button>
        <Button 
          variant={activeFilter === 'offline' ? 'default' : 'outline'} 
          onClick={() => handleFilterChange('offline')}
        >
          غير متصل ({agents.filter(a => a.status === 'offline').length})
        </Button>
      </div>
      
      {/* قائمة المندوبين */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-muted rounded-lg">
            <p>لا يوجد مندوبين متطابقين مع الفلتر الحالي.</p>
          </div>
        ) : (
          filteredAgents.map(agent => (
            <div 
              key={agent.id} 
              className="bg-card border rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary text-lg font-medium">
                        {agent.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {agent.phone}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                      {agent.status === 'online' ? 'نشط' : 'غير متصل'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm">
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}