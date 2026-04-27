"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  description?: string;
  className?: string;
  iconClassName?: string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
  change
}: StatCardProps) {
  return (
    <Card className={cn("glass-card premium-hover border-white/5 group relative overflow-hidden", className)}>
      {/* Decorative Gradient Background */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-bold opacity-70 group-hover:opacity-100 transition-opacity">{title}</CardTitle>
        <div className={cn("p-2.5 rounded-xl shadow-lg shadow-black/5 premium-gradient text-white", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-black tracking-tight glow-text mb-1">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground/60 font-medium">{description}</p>
        )}
        {change && (
          <div className="flex items-center mt-2">
            <div
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full flex items-center",
                change.trend === "up" ? "bg-emerald-500/10 text-emerald-500" :
                change.trend === "down" ? "bg-rose-500/10 text-rose-500" :
                "bg-amber-500/10 text-amber-500"
              )}
            >
              <span className="mr-1">{change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "•"}</span>
              {Math.abs(change.value)}%
            </div>
            <div className="text-[10px] text-muted-foreground mr-2 font-medium uppercase tracking-wider opacity-50">مقارنة بالأسبوع الماضي</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}