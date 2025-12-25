"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";

interface FilterTabsProps {
  items: {
    id: string;
    label: string;
    count?: number;
    color?: string;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function FilterTabs({
  items,
  activeTab,
  onTabChange,
  className
}: FilterTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === item.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.count !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "ml-1 bg-background",
                activeTab === item.id && "bg-primary-foreground text-primary"
              )}
            >
              {item.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}