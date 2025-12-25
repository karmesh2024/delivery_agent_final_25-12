"use client";

import { cn } from "@/lib/utils";
import { AgentStatus } from "@/types";
import { Button } from "@/shared/ui/button";

interface AgentStatusFilterProps {
  statuses: {
    id: AgentStatus;
    label: string;
    count?: number;
  }[];
  activeStatus: AgentStatus;
  onStatusChange: (status: AgentStatus) => void;
  className?: string;
}

export function AgentStatusFilter({
  statuses,
  activeStatus,
  onStatusChange,
  className,
}: AgentStatusFilterProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center bg-muted p-1 rounded-md">
        {statuses.map((status) => (
          <Button
            key={status.id}
            variant={activeStatus === status.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onStatusChange(status.id)}
            className={cn(
              "relative rounded-sm text-xs h-8",
              activeStatus === status.id
                ? ""
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {status.label}
            {status.count !== undefined && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-xs",
                  activeStatus === status.id
                    ? "bg-primary-foreground text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {status.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}