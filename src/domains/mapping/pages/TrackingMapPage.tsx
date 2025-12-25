'use client';

/**
 * TrackingMapPage Component
 * نموذج لصفحة خرائط التتبع باستخدام البنية الجديدة
 * 
 * هذه الصفحة توضح كيفية استخدام Redux وواجهة API الموحدة للخرائط
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchActiveAgents, 
  fetchTrackingPointsByOrderId, 
  setSelectedAgent, 
  setSelectedOrder,
  setMapCenter
} from '../store/mappingSlice';
import { AppDispatch, RootState } from '@/store';
import { TrackingMap } from '../components/TrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { AlertCircle, MapPin, CheckCircle, Clock, Info } from "lucide-react";

const TrackingMapPage = ({ orderId }: { orderId?: string }) => {
  const dispatch = useDispatch<AppDispatch>();
  const mapping = useSelector((state: RootState) => state.mapping);
  const { agents, trackingPoints, selectedAgent, selectedOrder } = mapping;
  
  // حالة تحديد الطلب المحلية
  const [localOrderId, setLocalOrderId] = useState<string | undefined>(orderId);
  
  // جلب المندوبين النشطين عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchActiveAgents());
  }, [dispatch]);

  // في حالة توفر معرف الطلب، جلب نقاط التتبع له
  useEffect(() => {
    if (localOrderId) {
      dispatch(fetchTrackingPointsByOrderId(localOrderId));
      dispatch(setSelectedOrder(localOrderId));
      
      // إذا كان الطلب لديه نقاط تتبع، حدد آخر موقع كمركز للخريطة
      const trackingPointsForOrder = trackingPoints.byOrderId[localOrderId] || [];
      if (trackingPointsForOrder.length > 0) {
        const lastPoint = trackingPointsForOrder[trackingPointsForOrder.length - 1];
        dispatch(setMapCenter({ lat: lastPoint.lat, lng: lastPoint.lng }));
      }
    }
  }, [dispatch, localOrderId]);

  // التعامل مع تغيير المندوب المحدد
  const handleAgentSelect = (agentId: string) => {
    dispatch(setSelectedAgent(agentId));
    
    // البحث عن المندوب وتحديد موقعه كمركز للخريطة
    const agent = agents.items.find(a => a.id === agentId);
    if (agent?.location) {
      dispatch(setMapCenter(agent.location));
    }
  };

  // التعامل مع تغيير الطلب المحدد
  const handleOrderSelect = (selectedId: string) => {
    setLocalOrderId(selectedId);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* عمود التحكم */}
        <div className="lg:col-span-1">
          <Card className="mb-4 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg text-blue-700">
                <Info className="inline-block mr-2" />
                لوحة التحكم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* اختيار المندوب */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">المندوب:</label>
                <Select
                  value={selectedAgent || ''}
                  onValueChange={handleAgentSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المندوب" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.items.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} 
                        <Badge className="ml-2" variant={agent.status === 'online' ? 'success' : 'secondary'}>
                          {agent.status === 'online' ? 'متصل' : 'غير متصل'}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* معلومات المندوب المحدد */}
              {selectedAgent && (
                <div className="border rounded-md p-3 bg-gray-50 mb-4">
                  {agents.items.find(a => a.id === selectedAgent) && (
                    <>
                      <h3 className="font-semibold mb-2">
                        {agents.items.find(a => a.id === selectedAgent)?.name}
                      </h3>
                      <div className="text-sm text-gray-500 mb-1">
                        <Clock className="inline-block mr-1 h-4 w-4" />
                        آخر تحديث: {agents.items.find(a => a.id === selectedAgent)?.location?.timestamp 
                          ? new Date(agents.items.find(a => a.id === selectedAgent)?.location?.timestamp || '').toLocaleTimeString() 
                          : 'غير متوفر'}
                      </div>
                      <div className="text-sm text-gray-500">
                        <MapPin className="inline-block mr-1 h-4 w-4" />
                        الموقع: {agents.items.find(a => a.id === selectedAgent)?.location 
                          ? `${agents.items.find(a => a.id === selectedAgent)?.location?.lat.toFixed(6)}, ${agents.items.find(a => a.id === selectedAgent)?.location?.lng.toFixed(6)}` 
                          : 'غير متوفر'}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => dispatch(fetchActiveAgents())}
                  className="flex-1"
                >
                  تحديث البيانات
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة حالة التتبع */}
          <Card className="shadow-md">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-lg text-green-700">
                <CheckCircle className="inline-block mr-2" />
                حالة التتبع
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium">المندوبين النشطين:</span> {agents.items.filter(a => a.status === 'online').length} من أصل {agents.items.length}
              </div>
              
              {trackingPoints.status === 'loading' && (
                <div className="text-sm text-gray-500">
                  <div className="animate-pulse">جاري تحميل بيانات التتبع...</div>
                </div>
              )}
              
              {trackingPoints.status === 'succeeded' && selectedOrder && trackingPoints.byOrderId[selectedOrder] && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">نقاط التتبع للطلب:</span> {trackingPoints.byOrderId[selectedOrder]?.length || 0}
                </div>
              )}
              
              {trackingPoints.status === 'failed' && (
                <div className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  خطأ في تحميل البيانات
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* منطقة الخريطة */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 pb-2">
              <CardTitle className="text-xl">خريطة التتبع</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full rounded-b-lg overflow-hidden">
                <TrackingMap
                  activeAgents={agents.items}
                  trackingPoints={selectedOrder ? trackingPoints.byOrderId[selectedOrder] || [] : []}
                  selectedAgent={selectedAgent}
                  selectedOrder={selectedOrder}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrackingMapPage;