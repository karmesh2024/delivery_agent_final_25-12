"use client";

/**
 * AgentDetail Component
 * 
 * يعرض معلومات مفصلة عن المندوب في نافذة حوار.
 * 
 * مستقبلاً، سيتم تحديث هذا المكون لاستخدام Redux:
 * - استخدام useSelector للحصول على بيانات المندوب من المتجر
 * - استخدام useDispatch لإرسال إجراءات مثل تحديث بيانات المندوب أو الاتصال به
 * - استبدال البيانات الوهمية بالبيانات الفعلية من واجهة API الموحدة
 */

import React from 'react';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import Image from 'next/image';
import { Agent } from '@/types';
// مستقبلاً سيتم استيراد hooks من متجر Redux
// import { useAppDispatch } from '@/store/hooks';
// import { callAgent, messageAgent } from '@/store/agentsSlice';

interface AgentDetailProps {
  agent: Agent;
  onClose: () => void;
}

export function AgentDetail({ agent, onClose }: AgentDetailProps) {
  // مستقبلاً سيتم استخدام useDispatch هنا
  // const dispatch = useAppDispatch();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-blue-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // مستقبلاً، سيتم الحصول على هذه البيانات من واجهة API أو من متجر Redux
  // const agentDetails = useSelector(state => state.agents.selectedAgentDetails);
  const agentDetails = {
    email: `${agent.name.toLowerCase().replace(/\s+/g, '.')}@delivery.com`,
    location: agent.location ? `${agent.location.lat.toFixed(4)}, ${agent.location.lng.toFixed(4)}` : 'Unknown location',
    deliveryCount: agent.total_deliveries || 0,
    rating: agent.rating || 0,
    joinDate: '01/01/2023', // سيتم استبدالها ببيانات فعلية من API
    activeOrders: agent.current_trip_id ? 1 : 0,
    completedToday: Math.floor(Math.random() * 10), // سيتم استبدالها ببيانات فعلية من API
    earnings: {
      today: Math.floor(Math.random() * 100 + 50),
      week: Math.floor(Math.random() * 500 + 200),
      month: Math.floor(Math.random() * 2000 + 1000),
    },
  };

  // مستقبلاً، سيتم استخدام useDispatch لإرسال الإجراءات
  const handleCallAgent = () => {
    // dispatch(callAgent(agent.id));
    console.log('Calling agent:', agent.phone);
  };

  const handleMessageAgent = () => {
    // dispatch(messageAgent(agent.id));
    console.log('Messaging agent:', agent.id);
  };

  return (
    <div>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow">
                {agent.avatar_url ? (
                  <div className="h-full w-full relative overflow-hidden rounded-full">
                    <Image
                      src={agent.avatar_url}
                      alt={agent.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-blue-100 h-full w-full rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-semibold">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                )}
              </Avatar>
              <div
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(
                  agent.status
                )}`}
              ></div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <div className="flex items-center space-x-2">
                <Badge
                  className={`${
                    agent.status === 'online'
                      ? 'bg-green-100 text-green-800'
                      : agent.status === 'busy'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  } px-2 py-0.5 rounded-md`}
                >
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
                <div className="text-sm text-gray-500">ID: #{agent.id}</div>
              </div>
              <div className="mt-1 flex items-center">
                {renderStars(agentDetails.rating)}
                <span className="ml-1 text-sm text-gray-600">
                  {agentDetails.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{agent.phone || 'No phone'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-sm">{agentDetails.email}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Location</div>
              <div className="font-medium">{agentDetails.location}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Active Orders</div>
                <div className="text-lg font-semibold text-blue-600">
                  {agentDetails.activeOrders}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Completed Today</div>
                <div className="text-lg font-semibold text-green-600">
                  {agentDetails.completedToday}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Total Deliveries</div>
                <div className="text-lg font-semibold">
                  {agentDetails.deliveryCount}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Member Since</div>
                <div className="text-sm font-medium">
                  {agentDetails.joinDate}
                </div>
              </div>
            </div>
          </div>
          
          {/* إضافة قسم معلومات المركبة */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">المركبة</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">نوع المركبة المفضلة</div>
              <div className="text-lg font-semibold text-gray-800 flex items-center">
                {agent.preferred_vehicle ? (
                  <>
                    {agent.preferred_vehicle === 'tricycle' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4h3a2 2 0 012 2v3a2 2 0 01-2 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a2 2 0 01-2-2V6a2 2 0 012-2h3v-.5a1.5 1.5 0 013 0V4h2v-.5z" />
                      </svg>
                    )}
                    {agent.preferred_vehicle === 'pickup_truck' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V10a1 1 0 00-1-1H3.8a1 1 0 00-.8.4L1 12v1a1 1 0 001 1v2zm11-3a1 1 0 00-1 1v7a1 1 0 001 1h3.5a1 1 0 00.8-.4L19 8.4V7a1 1 0 00-1-1h-4z" />
                      </svg>
                    )}
                    {agent.preferred_vehicle === 'light_truck' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V10a1 1 0 00-1-1H3.8a1 1 0 00-.8.4L1 12v1a1 1 0 001 1v2zm11-3a1 1 0 00-1 1v7a1 1 0 001 1h3.5a1 1 0 00.8-.4L19 8.4V7a1 1 0 00-1-1h-4z" />
                      </svg>
                    )}
                    {/* العرض المناسب لنوع المركبة باللغة العربية */}
                    {agent.preferred_vehicle === 'tricycle' && 'دراجة ثلاثية'}
                    {agent.preferred_vehicle === 'pickup_truck' && 'شاحنة بيك أب'}
                    {agent.preferred_vehicle === 'light_truck' && 'شاحنة خفيفة'}
                  </>
                ) : (
                  <span className="text-gray-500">غير محدد</span>
                )}
              </div>
              {agent.license_photo_url && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500">صورة الرخصة</div>
                  <button className="text-blue-600 text-sm mt-1 hover:underline focus:outline-none">
                    عرض صورة الرخصة
                  </button>
                </div>
              )}
              {agent.license_number && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500">رقم الرخصة</div>
                  <div className="text-sm font-medium">
                    {agent.license_number}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Earnings</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-2 rounded-md text-center">
                <div className="text-xs text-gray-500">Today</div>
                <div className="font-semibold text-blue-600">
                  ${agentDetails.earnings.today}
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-md text-center">
                <div className="text-xs text-gray-500">This Week</div>
                <div className="font-semibold text-blue-600">
                  ${agentDetails.earnings.week}
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-md text-center">
                <div className="text-xs text-gray-500">This Month</div>
                <div className="font-semibold text-blue-600">
                  ${agentDetails.earnings.month}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-2">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleCallAgent}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleMessageAgent}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Message
            </Button>
          </div>
        </div>
    </div>
  );
}