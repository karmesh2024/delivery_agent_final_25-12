"use client";

/**
 * مكون عنصر واحد في قائمة الرحلات
 * يعرض معلومات موجزة عن الرحلة ويوفر إجراءات سريعة
 */

import React from 'react';
import { Trip, TripStatus } from '../types';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Calendar, Clock, MapPin, Truck, User, File, ExternalLink } from 'lucide-react';
// استيراد المكونات من shadcn/ui

// كائن لتنسيق حالات الرحلة
const statusConfig: Record<TripStatus, { label: string; color: string }> = {
  scheduled: { label: 'مجدولة', color: 'bg-blue-500' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-yellow-500' },
  completed: { label: 'مكتملة', color: 'bg-green-500' },
  cancelled: { label: 'ملغاة', color: 'bg-red-500' }
};

// كائن لتنسيق أولويات الرحلة
const priorityConfig = {
  high: { label: 'عالية', color: 'bg-red-500' },
  medium: { label: 'متوسطة', color: 'bg-yellow-500' },
  low: { label: 'منخفضة', color: 'bg-blue-500' }
};

interface TripListItemProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  onViewDetails: (tripId: string) => void;
  onStatusChange?: (tripId: string, newStatus: TripStatus) => void;
}

export function TripListItem({ trip, onSelect, onViewDetails, onStatusChange }: TripListItemProps) {
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // تحديد العنوان المناسب للعرض
  const displayAddress = trip.startLocation?.address || 'عنوان غير محدد';

  return (
    <Card 
      className="mb-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: statusConfig[trip.status].color }}
      onClick={() => onSelect(trip)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{trip.title}</CardTitle>
          <Badge 
            className={`text-white ${statusConfig[trip.status].color}`}
          >
            {statusConfig[trip.status].label}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User size={14} />
            <span>{trip.agentName || 'غير محدد'}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`text-white ${priorityConfig[trip.priority].color}`}
          >
            {priorityConfig[trip.priority].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="text-sm space-y-2">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-1 flex-shrink-0" />
            <p className="text-gray-700">{displayAddress}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="flex-shrink-0" />
            <p className="text-gray-700">{formatDate(trip.startTime)}</p>
          </div>
          
          {trip.distance && (
            <div className="flex items-center gap-2">
              <Truck size={16} className="flex-shrink-0" />
            <p className="text-gray-700">{trip.distance.toFixed(1)} كم</p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <File size={16} className="flex-shrink-0" />
            <p className="text-gray-700">
              {trip.orderIds.length} {trip.orderIds.length === 1 ? 'طلب' : 'طلبات'}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(trip.id);
          }}
        >
          <ExternalLink size={16} className="ml-1" />
          عرض التفاصيل
        </Button>
        
        {onStatusChange && trip.status !== 'completed' && trip.status !== 'cancelled' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // تحديث الحالة إلى الحالة التالية
              const nextStatus: TripStatus = trip.status === 'scheduled' ? 'in_progress' : 'completed';
              onStatusChange(trip.id, nextStatus);
            }}
          >
            <Clock size={16} className="ml-1" />
            {trip.status === 'scheduled' ? 'بدء الرحلة' : 'إنهاء الرحلة'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}