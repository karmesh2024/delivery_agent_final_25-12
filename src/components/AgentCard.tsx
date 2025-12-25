"use client";

import { Agent } from "@/types";
import { Card, CardContent } from "@/shared/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { FiMapPin, FiPhone, FiStar } from "react-icons/fi";
import { cn } from "@/lib/utils";
import AgentZoneAssignmentModal from './AgentZoneAssignmentModal';
import { useState } from 'react';

interface AgentCardProps {
  agent: Agent;
  onViewDetails?: (agent: Agent) => void;
  onCall?: (agent: Agent) => void;
  className?: string;
}

/**
 * بطاقة عرض بيانات المندوب
 * تم نقلها إلى الهيكل الجديد ضمن مجال المندوبين
 * يمكن تطويرها لاحقاً لاستخدام Redux لإدارة حدث التفاصيل أو الاتصال
 */
export function AgentCard({ agent, onViewDetails, onCall, className }: AgentCardProps) {
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500 text-white";
      case "offline":
        return "bg-gray-400 text-white";
      case "busy":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarImage src={agent.avatar_url || ''} alt={agent.name || ''} />
                <AvatarFallback>{getInitials(agent.name || '')}</AvatarFallback>
              </Avatar>
              <div
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.status).split(' ')[0]}`}
              ></div>
            </div>
            <div>
              <h3 className="font-semibold leading-none">{agent.name}</h3>
              <div className="flex items-center mt-1 gap-1">
                <FiStar className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium">
                  {agent.rating || "N/A"} ({agent.total_deliveries || 0} deliveries)
                </span>
              </div>
            </div>
          </div>
          <Badge className={cn("rounded-full px-2", getStatusColor(agent.status))}>
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          {agent.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiMapPin className="h-3.5 w-3.5" />
              <span className="truncate text-xs">
                {`${agent.location.lat.toFixed(4)}, ${agent.location.lng.toFixed(4)}`}
              </span>
            </div>
          )}
          {agent.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiPhone className="h-3.5 w-3.5" />
              <span className="text-xs">{agent.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          {onCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCall(agent)}
              className="text-xs h-8"
            >
              <FiPhone className="h-3 w-3 mr-1" />
              Call
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(agent)}
              className="text-xs h-8"
            >
              View Details
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8"
            onClick={() => setZoneModalOpen(true)}
          >
            إدارة المناطق
          </Button>
        </div>
        <AgentZoneAssignmentModal
          agentId={agent.id}
          open={zoneModalOpen}
          onClose={() => setZoneModalOpen(false)}
        />
      </CardContent>
    </Card>
  );
}