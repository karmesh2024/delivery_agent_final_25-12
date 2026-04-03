import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FiSettings, FiCheckCircle, FiXCircle, FiMessageSquare } from "react-icons/fi";
import { ZoonRoom } from '../services/zoonClubService';
import Link from 'next/link';

interface RoomCardProps {
  room: ZoonRoom;
  onManage: (room: ZoonRoom) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onManage, onToggleStatus }) => {
  return (
    <Card className="overflow-hidden border-2 transition-all hover:shadow-lg" style={{ borderColor: room.color + '30' }}>
      <CardHeader className="pb-2 space-y-0" style={{ backgroundColor: room.color + '10' }}>
        <div className="flex justify-between items-start">
          <div className="text-4xl">{room.icon}</div>
          <Badge variant={room.is_active ? "default" : "secondary"} className={room.is_active ? "bg-green-100 text-green-700 border-green-200" : ""}>
            {room.is_active ? 'نشط' : 'متوقف'}
          </Badge>
        </div>
        <CardTitle className="text-xl mt-2">{room.name_ar}</CardTitle>
        <CardDescription className="text-xs font-mono uppercase tracking-wider">{room.name}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
          {room.description}
        </p>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">الرضا</div>
            <div className="font-bold text-sm text-yellow-600">
              {room.satisfaction_rate ? `⭐${room.satisfaction_rate}` : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">نشط الآن</div>
            <div className="font-bold text-sm text-green-600">
              {room.active_members_count || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">الأعضاء</div>
            <div className="font-bold text-sm">
              {room.total_members || 0}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1 gap-1 text-xs" 
            style={{ backgroundColor: room.color }}
            onClick={() => onManage(room)}
          >
            <FiSettings className="w-3 h-3" />
            الإعدادات
          </Button>
          <Link href={`/club-zone/rooms/management/questions?roomId=${room.id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-1 text-xs">
              <FiMessageSquare className="w-3 h-3" />
              الأسئلة
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onToggleStatus(room.id, room.is_active)}
            title={room.is_active ? "إيقاف" : "تفعيل"}
          >
            {room.is_active ? <FiXCircle className="text-red-500" /> : <FiCheckCircle className="text-green-500" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
