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
    return status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500';
  };

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="glass-card premium-hover p-4 flex flex-col items-center text-center cursor-pointer border-white/5 relative group"
          onClick={() => onAgentClick?.(agent)}
        >
          {/* Status Indicator Glow */}
          <div className={cn(
            "absolute top-3 left-3 w-2 h-2 rounded-full",
            getStatusColor(agent.status)
          )} />
          
          <div className="relative mb-3">
            <div className="h-16 w-16 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl font-black text-white italic">
                {agent.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <span className="text-sm font-bold block truncate max-w-[100px]">{agent.name}</span>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              agent.status === 'online' ? 'text-emerald-400' : 'text-slate-400'
            )}>
              {agent.status === 'online' ? 'متصل الآن' : 'غير متصل'}
            </span>
          </div>
          
          {/* Action Hint */}
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-[10px] py-1 px-2 bg-white/5 rounded-lg border border-white/10 font-bold">عرض الملف</div>
          </div>
        </div>
      ))}
    </div>
  );
}