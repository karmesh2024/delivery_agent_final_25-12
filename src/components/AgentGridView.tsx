"use client";

/**
 * AgentGridView Component
 * 
 * يعرض المندوبين في شكل شبكي مع مؤشرات بصرية للحالة.
 * 
 * مستقبلاً، ستتم تحديث هذا المكون لاستخدام Redux:
 * - استخدام useSelector للحصول على قائمة المندوبين من المتجر
 * - استخدام useDispatch لإرسال إجراءات عند التفاعل مع المندوبين
 */

import React, { useState, useEffect } from 'react';
import { Agent } from '@/types';
import { cn } from '@/lib/utils';

interface AgentGridViewProps {
  agents: Agent[];
  className?: string;
  onAgentClick?: (agent: Agent) => void;
}

export function AgentGridView({ agents, className, onAgentClick }: AgentGridViewProps) {
  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
  };

  // استخدام حالة لتخزين معرفات المندوبين مع الحفاظ على توافق التصيير بين الخادم والعميل
  const [agentIdentifiers, setAgentIdentifiers] = useState<Record<string, string>>({});
  
  // تحديث المعرفات بعد التصيير على جانب العميل فقط
  useEffect(() => {
    if (agents.length > 0) {
      const identifiers: Record<string, string> = {};
      agents.forEach(agent => {
        identifiers[agent.id] = `A${agent.id.toString().slice(0, 1)}`;
      });
      setAgentIdentifiers(identifiers);
    }
  }, [agents]);

  return (
    <div className={cn("mb-6", className)}>
      <h2 className="text-lg font-semibold mb-4">Delivery Agents</h2>
      <div className="flex flex-wrap gap-4 justify-center">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
            onClick={() => onAgentClick?.(agent)}
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-xl font-semibold text-gray-700">{agentIdentifiers[agent.id] || `A${agent.id.toString().slice(0, 1)}`}</span>
              </div>
              <div
                className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.status)}`}
              ></div>
            </div>
            <span className="text-sm font-medium">{agent.name.split(' ')[0]}</span>
            <span className="text-xs text-gray-500">{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}